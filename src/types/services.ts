import type { WeatherData, SearchHistoryItem } from './weather';

export interface IWeatherApiService {
  getWeatherByCity(cityName: string): Promise<WeatherData>;
}

export interface IStorageService {
  getSearchHistory(): SearchHistoryItem[];
  addToHistory(item: SearchHistoryItem): void;
  removeFromHistory(id: string): void;
  clearHistory(): void;
}
