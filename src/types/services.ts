/**
 * Service interfaces for Dependency Inversion.
 * Hooks accept these interfaces as parameters, enabling easy testing and swapping.
 */

import type { WeatherData, SearchHistoryItem } from './weather';

/** Contract for the weather API client */
export interface IWeatherApiService {
  /** Fetches current weather data for the given city name */
  getWeatherByCity(cityName: string): Promise<WeatherData>;
}

/** Contract for the search history persistence layer */
export interface IStorageService {
  /** Returns all stored history items, newest first */
  getSearchHistory(): SearchHistoryItem[];
  /** Persists a new item (deduplicates by city name) */
  addToHistory(item: SearchHistoryItem): void;
  /** Removes a single item by its unique id */
  removeFromHistory(id: string): void;
  /** Clears all history items from storage */
  clearHistory(): void;
}
