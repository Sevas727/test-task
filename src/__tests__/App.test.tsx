/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { WeatherData } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockWeatherData: WeatherData = {
  id: 2643743,
  name: 'London',
  sys: { country: 'GB' },
  main: {
    temp: 15.5,
    feels_like: 14.0,
    temp_min: 12.0,
    temp_max: 18.0,
    pressure: 1013,
    humidity: 76,
  },
  weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
  wind: { speed: 4.1, deg: 230 },
  clouds: { all: 20 },
  dt: 1700000000,
  timezone: 3600,
};

const mockGetWeatherByCity = vi.fn();

vi.mock('../services', () => {
  let store: unknown[] = [];

  return {
    WeatherApiService: {
      getWeatherByCity: (...args: unknown[]) => mockGetWeatherByCity(...args),
    },
    StorageService: {
      getSearchHistory: vi.fn(() => store),
      addToHistory: vi.fn((item: unknown) => {
        const typed = item as { cityName: string };
        store = [
          item,
          ...store.filter(
            (h) =>
              (h as { cityName: string }).cityName.toLowerCase() !== typed.cityName.toLowerCase()
          ),
        ];
      }),
      removeFromHistory: vi.fn((id: string) => {
        store = store.filter((h) => (h as { id: string }).id !== id);
      }),
      clearHistory: vi.fn(() => {
        store = [];
      }),
      _reset() {
        store = [];
      },
    },
  };
});

import { StorageService } from '../services';
const mockStorage = StorageService as unknown as { _reset(): void };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function searchForCity(user: ReturnType<typeof userEvent.setup>, cityName: string) {
  await user.type(screen.getByLabelText('City name'), cityName);
  await user.click(screen.getByRole('button', { name: 'Search' }));
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockGetWeatherByCity.mockReset();
  mockStorage._reset();
  vi.mocked(StorageService.getSearchHistory).mockClear();
  vi.mocked(StorageService.addToHistory).mockClear();
  vi.mocked(StorageService.removeFromHistory).mockClear();
});

// ---------------------------------------------------------------------------
// Tests — US1: Weather Display (SearchForm → API → Results)
// ---------------------------------------------------------------------------

describe('US1: Weather Display', () => {
  it('displays weather data after a successful search', async () => {
    const user = userEvent.setup();
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    await searchForCity(user, 'London');

    // Weather card should display with all key data
    const heading = await screen.findByRole('heading', { name: 'London, GB' });
    const weatherCard = heading.closest('.bg-white') as HTMLElement;
    expect(heading).toBeInTheDocument();
    expect(within(weatherCard).getByText('16°C')).toBeInTheDocument();
    expect(within(weatherCard).getByText('few clouds')).toBeInTheDocument();
    expect(within(weatherCard).getByText('76%')).toBeInTheDocument();
    expect(within(weatherCard).getByText('4.1 m/s')).toBeInTheDocument();
  });

  it('displays an error message when the API call fails', async () => {
    const user = userEvent.setup();
    mockGetWeatherByCity.mockRejectedValue(
      new Error('City "BadCity" not found. Please check the spelling and try again.')
    );

    render(<App />);

    await searchForCity(user, 'BadCity');

    // Error alert should be visible
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'City "BadCity" not found. Please check the spelling and try again.'
    );

    // No weather card should be shown
    expect(screen.queryByText('°C')).not.toBeInTheDocument();
  });

  it('clears a previous error when a new search succeeds', async () => {
    const user = userEvent.setup();

    // First search fails
    mockGetWeatherByCity.mockRejectedValueOnce(new Error('City not found'));

    render(<App />);

    await searchForCity(user, 'BadCity');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    // Second search succeeds
    mockGetWeatherByCity.mockResolvedValueOnce(mockWeatherData);

    // Clear input and search again
    const input = screen.getByLabelText('City name');
    await user.clear(input);
    await searchForCity(user, 'London');

    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests — US3: Click History Item
// ---------------------------------------------------------------------------

describe('US3: Click History Item', () => {
  it('fetches weather and adds to history when a city is searched', async () => {
    const user = userEvent.setup();
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    await searchForCity(user, 'London');

    // Wait for the weather card heading to appear
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();

    // History should now contain the item
    expect(StorageService.addToHistory).toHaveBeenCalledTimes(1);
  });

  it('clicking a history item fetches fresh weather for that city', async () => {
    const user = userEvent.setup();
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    // First, search to create a history entry
    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();
    expect(mockGetWeatherByCity).toHaveBeenCalledTimes(1);

    // Now click the history item — return updated weather
    const updatedWeather: WeatherData = {
      ...mockWeatherData,
      main: { ...mockWeatherData.main, temp: 20.0 },
    };
    mockGetWeatherByCity.mockResolvedValue(updatedWeather);

    await user.click(screen.getByRole('button', { name: 'View weather for London' }));

    // Should fetch again with the city name
    expect(mockGetWeatherByCity).toHaveBeenCalledTimes(2);
    expect(mockGetWeatherByCity).toHaveBeenLastCalledWith('London');

    // Weather card should update with new temperature
    const weatherCard = (await screen.findByRole('heading', { name: 'London, GB' })).closest(
      'div.bg-white'
    )!;
    expect(within(weatherCard as HTMLElement).getByText('20°C')).toBeInTheDocument();
  });

  it('updates the history entry (timestamp) when a history item is clicked', async () => {
    const user = userEvent.setup();
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    // Search to create a history entry
    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();
    expect(StorageService.addToHistory).toHaveBeenCalledTimes(1);

    // Click the history item — triggers a new fetch + addToHistory
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);
    await user.click(screen.getByRole('button', { name: 'View weather for London' }));

    // Wait for the update to complete
    await screen.findByRole('heading', { name: 'London, GB' });

    // addToHistory called again → StorageService deduplicates, updating the entry
    expect(StorageService.addToHistory).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Tests — US4: Remove History Item
// ---------------------------------------------------------------------------

describe('US4: Remove History Item', () => {
  it('removes a history item when the delete button is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    // Search to create a history entry
    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View weather for London' })).toBeInTheDocument();

    // Click the remove button
    await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

    // Advance past the animation duration (300ms)
    vi.advanceTimersByTime(300);

    // After animation, the item should be removed from storage
    await waitFor(() => {
      expect(StorageService.removeFromHistory).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });

  it('applies the exit animation class before removing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();

    // Click remove — the animation class should be applied immediately
    await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

    // The item container should have the animation class
    const historyButton = screen.getByRole('button', { name: 'View weather for London' });
    const card = historyButton.closest('.bg-white');
    expect(card).toHaveClass('animate-fade-out-left');

    // The actual removal hasn't happened yet
    expect(StorageService.removeFromHistory).not.toHaveBeenCalled();

    // After animation completes
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(StorageService.removeFromHistory).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Tests — US5: Undo Remove
// ---------------------------------------------------------------------------

describe('US5: Undo Remove', () => {
  it('shows an undo notification when a history item is removed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    // Create a history entry
    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();

    // Remove the history item
    await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

    // Advance past delete animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Undo notification should appear
    expect(screen.getByText(/London.*removed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('restores the history item when Undo is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    // Create a history entry
    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();

    // Verify the history item exists
    expect(screen.getByRole('button', { name: 'View weather for London' })).toBeInTheDocument();

    // Remove the history item
    await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

    // Advance past delete animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Item should be removed from history
    expect(
      screen.queryByRole('button', { name: 'View weather for London' })
    ).not.toBeInTheDocument();

    // Click Undo
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    // Item should be restored in history
    expect(screen.getByRole('button', { name: 'View weather for London' })).toBeInTheDocument();

    // Undo notification should disappear
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('dismisses the undo notification when close button is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    // Create a history entry and remove it
    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

    // Advance past delete animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Notification visible
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();

    // Close it
    await user.click(screen.getByRole('button', { name: 'Close notification' }));

    // Notification gone
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('auto-dismisses the undo notification after 5 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockGetWeatherByCity.mockResolvedValue(mockWeatherData);

    render(<App />);

    // Create a history entry and remove it
    await searchForCity(user, 'London');
    expect(await screen.findByRole('heading', { name: 'London, GB' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

    // Advance past delete animation (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();

    // Advance 5 seconds for undo timeout
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Notification should be gone
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
