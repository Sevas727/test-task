/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
