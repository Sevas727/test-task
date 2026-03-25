import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherApiService } from '../weatherApi';
import type { WeatherData } from '../../types';

// ---------------------------------------------------------------------------
// Mock the config module so we control API key / URL in every test.
// vi.mock is hoisted to top by Vitest.
// ---------------------------------------------------------------------------

vi.mock('../../config', () => ({
  getWeatherApiKey: vi.fn(() => 'test-api-key'),
  getWeatherApiUrl: vi.fn(() => 'https://api.openweathermap.org/data/2.5'),
}));

// Import after mock so we get the mocked versions
import * as config from '../../config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_API_KEY = 'test-api-key';
const MOCK_API_URL = 'https://api.openweathermap.org/data/2.5';

/** Minimal valid WeatherData fixture */
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

/** Creates a mock fetch Response */
function makeFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

// Typed fetch mock — replaces global.fetch and avoids unsafe-member-access
const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Restore default mock config values
  vi.mocked(config.getWeatherApiKey).mockReturnValue(MOCK_API_KEY);
  vi.mocked(config.getWeatherApiUrl).mockReturnValue(MOCK_API_URL);

  // Reset cache between tests so tests are isolated
  WeatherApiService.clearCache();

  // Install typed fetch mock on globalThis
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WeatherApiService', () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe('getWeatherByCity – happy path', () => {
    it('returns weather data for a valid city', async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      const result = await WeatherApiService.getWeatherByCity('London');

      expect(result).toEqual(mockWeatherData);
    });

    it('calls the correct API URL with encoded city name and metric units', async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      await WeatherApiService.getWeatherByCity('New York');

      expect(fetchMock).toHaveBeenCalledWith(
        `${MOCK_API_URL}/weather?q=New%20York&appid=${MOCK_API_KEY}&units=metric`
      );
    });

    it('trims leading/trailing whitespace from the city name', async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      await WeatherApiService.getWeatherByCity('  London  ');

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('q=London'));
    });
  });

  // -------------------------------------------------------------------------
  // Caching
  // -------------------------------------------------------------------------

  describe('caching', () => {
    it('returns cached result on second call without a new fetch', async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      await WeatherApiService.getWeatherByCity('London');
      await WeatherApiService.getWeatherByCity('London');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('uses the same cache entry for case-insensitive city names', async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      await WeatherApiService.getWeatherByCity('london');
      await WeatherApiService.getWeatherByCity('LONDON');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('re-fetches after cache entry expires', async () => {
      vi.useFakeTimers();

      fetchMock.mockResolvedValue(makeFetchResponse(200, mockWeatherData));

      await WeatherApiService.getWeatherByCity('London');

      // Advance time past the 5-minute TTL
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      await WeatherApiService.getWeatherByCity('London');

      expect(fetchMock).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('clearCache() forces a fresh fetch', async () => {
      fetchMock.mockResolvedValue(makeFetchResponse(200, mockWeatherData));

      await WeatherApiService.getWeatherByCity('London');
      WeatherApiService.clearCache();
      await WeatherApiService.getWeatherByCity('London');

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  describe('input validation', () => {
    it('throws when API key is not configured', async () => {
      vi.mocked(config.getWeatherApiKey).mockReturnValueOnce(undefined);

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow(
        'Weather API key is not configured'
      );
    });

    it('throws when city name is an empty string', async () => {
      await expect(WeatherApiService.getWeatherByCity('')).rejects.toThrow(
        'City name cannot be empty'
      );
    });

    it('throws when city name contains only whitespace', async () => {
      await expect(WeatherApiService.getWeatherByCity('   ')).rejects.toThrow(
        'City name cannot be empty'
      );
    });
  });

  // -------------------------------------------------------------------------
  // HTTP error handling
  // -------------------------------------------------------------------------

  describe('HTTP error handling', () => {
    it('throws a user-friendly message for 404 (city not found)', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse(404, { cod: '404', message: 'city not found' })
      );

      await expect(WeatherApiService.getWeatherByCity('InvalidCity')).rejects.toThrow(
        'City "InvalidCity" not found'
      );
    });

    it('throws a user-friendly message for 401 (invalid API key)', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse(401, { cod: 401, message: 'Invalid API key.' })
      );

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow('Invalid API key');
    });

    it('throws a rate-limit message for 429', async () => {
      fetchMock.mockResolvedValue(
        makeFetchResponse(429, { cod: 429, message: 'exceeded rate limit' })
      );

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow(
        'Too many requests'
      );
    });

    it('propagates the API error message for other non-ok statuses', async () => {
      fetchMock.mockResolvedValue(
        makeFetchResponse(500, { cod: 500, message: 'Internal server error' })
      );

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('falls back to generic message when API returns no message', async () => {
      fetchMock.mockResolvedValue(makeFetchResponse(503, { cod: 503, message: '' }));

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow(
        'Failed to fetch weather data'
      );
    });
  });

  // -------------------------------------------------------------------------
  // Network errors
  // -------------------------------------------------------------------------

  describe('network error handling', () => {
    it('re-throws Error instances from fetch directly after retries are exhausted', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow('Failed to fetch');
    });

    it('wraps non-Error rejections in a generic network error', async () => {
      fetchMock.mockRejectedValue('unexpected string error');

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow('Network error');
    });
  });

  // -------------------------------------------------------------------------
  // Retry with exponential backoff
  // -------------------------------------------------------------------------

  describe('retry with exponential backoff', () => {
    it('retries on network failure and succeeds on subsequent attempt', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      const result = await WeatherApiService.getWeatherByCity('London');

      expect(result).toEqual(mockWeatherData);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('retries up to 3 times before throwing', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow('Failed to fetch');

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('does not retry on HTTP 404 (client error)', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse(404, { cod: '404', message: 'city not found' })
      );

      await expect(WeatherApiService.getWeatherByCity('BadCity')).rejects.toThrow(
        'City "BadCity" not found'
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not retry on HTTP 401 (auth error)', async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse(401, { cod: 401, message: 'Invalid API key' })
      );

      await expect(WeatherApiService.getWeatherByCity('London')).rejects.toThrow('Invalid API key');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries on HTTP 500 (server error) and succeeds', async () => {
      fetchMock
        .mockResolvedValueOnce(makeFetchResponse(500, { cod: 500, message: 'Internal error' }))
        .mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      const result = await WeatherApiService.getWeatherByCity('London');

      expect(result).toEqual(mockWeatherData);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('retries on HTTP 429 (rate limit) and succeeds', async () => {
      fetchMock
        .mockResolvedValueOnce(makeFetchResponse(429, { cod: 429, message: 'rate limit' }))
        .mockResolvedValueOnce(makeFetchResponse(200, mockWeatherData));

      const result = await WeatherApiService.getWeatherByCity('London');

      expect(result).toEqual(mockWeatherData);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
