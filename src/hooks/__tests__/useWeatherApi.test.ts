import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeatherApi } from '../useWeatherApi';
import type { WeatherData } from '../../types';

// ---------------------------------------------------------------------------
// Mock the entire services module — avoids unbound-method lint errors that
// come from vi.spyOn on a static class method
// ---------------------------------------------------------------------------

vi.mock('../../services', () => ({
  WeatherApiService: {
    getWeatherByCity: vi.fn(),
  },
}));

// Import the mocked service after vi.mock so we get the mock version
import { WeatherApiService } from '../../services';

// ---------------------------------------------------------------------------
// Fixtures
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
  weather: [
    {
      id: 801,
      main: 'Clouds',
      description: 'few clouds',
      icon: '02d',
    },
  ],
  wind: { speed: 4.1, deg: 230 },
  clouds: { all: 20 },
  dt: 1700000000,
  timezone: 3600,
};

// Typed alias to the mock so we can call .mockResolvedValueOnce etc.
// eslint-disable-next-line @typescript-eslint/unbound-method
const getWeatherByCity = vi.mocked(WeatherApiService.getWeatherByCity);

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  getWeatherByCity.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWeatherApi', () => {
  describe('initial state', () => {
    it('starts with null data, no loading, and no error', () => {
      const { result } = renderHook(() => useWeatherApi());

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe('fetchWeather – success', () => {
    it('sets loading to true while fetching, then returns data', async () => {
      getWeatherByCity.mockResolvedValueOnce(mockWeatherData);

      const { result } = renderHook(() => useWeatherApi());

      let fetchPromise: Promise<unknown>;
      act(() => {
        fetchPromise = result.current.fetchWeather('London');
      });

      // While the promise is still in flight, loading should be true
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await fetchPromise;
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockWeatherData);
      expect(result.current.error).toBeNull();
    });

    it('returns the fetched WeatherData from the fetchWeather call', async () => {
      getWeatherByCity.mockResolvedValueOnce(mockWeatherData);

      const { result } = renderHook(() => useWeatherApi());

      let returnValue: WeatherData | undefined;
      await act(async () => {
        returnValue = await result.current.fetchWeather('London');
      });

      expect(returnValue).toEqual(mockWeatherData);
    });

    it('clears a previous error on a new successful fetch', async () => {
      // First call fails
      getWeatherByCity.mockRejectedValueOnce(new Error('City not found'));

      const { result } = renderHook(() => useWeatherApi());

      await act(async () => {
        try {
          await result.current.fetchWeather('BadCity');
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('City not found');

      // Second call succeeds
      getWeatherByCity.mockResolvedValueOnce(mockWeatherData);

      await act(async () => {
        await result.current.fetchWeather('London');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockWeatherData);
    });
  });

  // -------------------------------------------------------------------------
  // Error path
  // -------------------------------------------------------------------------

  describe('fetchWeather – failure', () => {
    it('sets error message and clears data on API failure', async () => {
      getWeatherByCity.mockRejectedValueOnce(
        new Error('City "XYZ" not found. Please check the spelling and try again.')
      );

      const { result } = renderHook(() => useWeatherApi());

      await act(async () => {
        try {
          await result.current.fetchWeather('XYZ');
        } catch {
          // expected to bubble up
        }
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(
        'City "XYZ" not found. Please check the spelling and try again.'
      );
    });

    it('uses a generic error message for non-Error rejections', async () => {
      getWeatherByCity.mockRejectedValueOnce('unexpected string');

      const { result } = renderHook(() => useWeatherApi());

      await act(async () => {
        try {
          await result.current.fetchWeather('London');
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBe('An unexpected error occurred');
    });

    it('re-throws the error so callers can handle it', async () => {
      const thrownError = new Error('Too many requests. Please try again later.');
      getWeatherByCity.mockRejectedValueOnce(thrownError);

      const { result } = renderHook(() => useWeatherApi());

      await expect(
        act(async () => {
          await result.current.fetchWeather('London');
        })
      ).rejects.toThrow('Too many requests');
    });

    it('always sets loading to false after a failed fetch', async () => {
      getWeatherByCity.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useWeatherApi());

      await act(async () => {
        try {
          await result.current.fetchWeather('London');
        } catch {
          // expected
        }
      });

      expect(result.current.loading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // clearError
  // -------------------------------------------------------------------------

  describe('clearError', () => {
    it('resets the error state to null', async () => {
      getWeatherByCity.mockRejectedValueOnce(new Error('City not found'));

      const { result } = renderHook(() => useWeatherApi());

      await act(async () => {
        try {
          await result.current.fetchWeather('BadCity');
        } catch {
          // expected
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
