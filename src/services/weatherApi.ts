import type { WeatherData, WeatherApiError } from '../types';
import { getWeatherApiKey, getWeatherApiUrl } from '../config';

/**
 * Weather API Service
 * Handles all communication with OpenWeatherMap API
 *
 * Features:
 * - Type-safe API client
 * - In-memory request caching (5-minute TTL)
 * - Retry with exponential backoff for transient failures
 * - Comprehensive error handling (network, 404, 401, 429)
 */

/** Cache TTL: 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}

/** In-memory cache keyed by normalised city name */
const cache = new Map<string, CacheEntry>();

/**
 * Returns a stable cache key for a city name.
 * Lowercased + trimmed so "London" and "london" share the same entry.
 */
const getCacheKey = (cityName: string): string => cityName.trim().toLowerCase();

/** HTTP status codes that should not be retried (client errors except 429) */
const isClientError = (status: number): boolean => status >= 400 && status < 500 && status !== 429;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Weather API Service
 * Responsible solely for fetching and caching weather data.
 */
export class WeatherApiService {
  /**
   * Fetches weather data for a given city.
   * Returns a cached result if the entry is still fresh.
   * Retries transient failures (network errors, 5xx, 429) with exponential backoff.
   *
   * @param cityName - Name of the city to search for
   * @returns Promise with weather data
   * @throws Error if city not found, API key missing, or request fails after retries
   */
  static async getWeatherByCity(cityName: string): Promise<WeatherData> {
    const apiKey = getWeatherApiKey();
    const apiUrl = getWeatherApiUrl();

    if (!apiKey) {
      throw new Error(
        'Weather API key is not configured. Please add VITE_WEATHER_API_KEY to your .env file'
      );
    }

    if (!cityName.trim()) {
      throw new Error('City name cannot be empty');
    }

    const cacheKey = getCacheKey(cityName);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const url = `${apiUrl}/weather?q=${encodeURIComponent(cityName.trim())}&appid=${apiKey}&units=metric`;

    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = (await response.json()) as WeatherApiError;

          // Don't retry client errors (except 429)
          if (isClientError(response.status)) {
            WeatherApiService._throwHttpError(response.status, cityName, errorData);
          }

          // Retryable server error or 429
          lastError = WeatherApiService._makeHttpError(response.status, cityName, errorData);

          if (attempt < MAX_RETRIES - 1) {
            await delay(BASE_DELAY_MS * Math.pow(2, attempt));
            continue;
          }

          throw lastError;
        }

        const data = (await response.json()) as WeatherData;

        // Store in cache
        cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });

        return data;
      } catch (error) {
        lastError = error;

        // Don't retry known non-retryable errors
        if (error instanceof Error && isClientError(WeatherApiService._getStatusFromError(error))) {
          throw error;
        }

        if (attempt < MAX_RETRIES - 1) {
          await delay(BASE_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('Network error. Please check your internet connection.');
  }

  /**
   * Clears the in-memory cache.
   * Useful in tests or when the user explicitly wants fresh data.
   */
  static clearCache(): void {
    cache.clear();
  }

  /**
   * Maps HTTP error status codes to user-friendly Error instances.
   */
  private static _throwHttpError(
    status: number,
    cityName: string,
    errorData: WeatherApiError
  ): never {
    throw WeatherApiService._makeHttpError(status, cityName, errorData);
  }

  /**
   * Creates an Error for an HTTP error status without throwing.
   */
  private static _makeHttpError(
    status: number,
    cityName: string,
    errorData: WeatherApiError
  ): Error {
    switch (status) {
      case 401:
        return new Error('Invalid API key. Please check your VITE_WEATHER_API_KEY configuration.');
      case 404:
        return new Error(`City "${cityName}" not found. Please check the spelling and try again.`);
      case 429:
        return new Error('Too many requests. Please try again later.');
      default:
        return new Error(errorData.message || 'Failed to fetch weather data');
    }
  }

  /** Extract status code hint from error message for retry decision */
  private static _getStatusFromError(error: Error): number {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Invalid API key')) return 401;
    return 0;
  }
}
