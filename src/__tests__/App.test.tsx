/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
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
