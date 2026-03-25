import type { WeatherData, WeatherApiError } from '../types';
import { getWeatherApiKey, getWeatherApiUrl } from '../config';

/**
 * Weather API Service
 * Handles all communication with OpenWeatherMap API
 *
 * Features:
 * - Type-safe API client
 * - In-memory request caching (5-minute TTL)
 * - Comprehensive error handling (network, 404, 401, 429)
 */

/** Cache TTL: 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000;

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

/**
 * Weather API Service
 * Responsible solely for fetching and caching weather data.
 */
export class WeatherApiService {
  /**
   * Fetches weather data for a given city.
   * Returns a cached result if the entry is still fresh.
   *
   * @param cityName - Name of the city to search for
   * @returns Promise with weather data
   * @throws Error if city not found, API key missing, or request fails
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

    try {
      const response = await fetch(
        `${apiUrl}/weather?q=${encodeURIComponent(cityName.trim())}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        const errorData = (await response.json()) as WeatherApiError;
        WeatherApiService._throwHttpError(response.status, cityName, errorData);
      }

      const data = (await response.json()) as WeatherData;

      // Store in cache
      cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your internet connection.');
    }
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
   * Extracted to keep `getWeatherByCity` readable and unit-testable.
   */
  private static _throwHttpError(
    status: number,
    cityName: string,
    errorData: WeatherApiError
  ): never {
    switch (status) {
      case 401:
        throw new Error('Invalid API key. Please check your VITE_WEATHER_API_KEY configuration.');
      case 404:
        throw new Error(`City "${cityName}" not found. Please check the spelling and try again.`);
      case 429:
        throw new Error('Too many requests. Please try again later.');
      default:
        throw new Error(errorData.message || 'Failed to fetch weather data');
    }
  }
}
