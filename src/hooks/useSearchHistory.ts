import { useState } from 'react';
import { StorageService } from '../services';
import type { SearchHistoryItem, WeatherData, IStorageService } from '../types';

/**
 * Custom hook for managing search history
 * Handles CRUD operations and localStorage sync
 * Accepts an optional storage service for dependency injection (defaults to StorageService)
 */
export const useSearchHistory = (storage: IStorageService = StorageService) => {
  // Initialize state with lazy initialization to avoid effect
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => storage.getSearchHistory());

  const addToHistory = (weatherData: WeatherData) => {
    const newItem: SearchHistoryItem = {
      id: `${weatherData.id}-${Date.now()}`,
      cityName: weatherData.name,
      country: weatherData.sys.country,
      timestamp: Date.now(),
      weatherSnapshot: {
        temperature: weatherData.main.temp,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        minTemp: weatherData.main.temp_min,
        maxTemp: weatherData.main.temp_max,
        windSpeed: weatherData.wind.speed,
        humidity: weatherData.main.humidity,
        feelsLike: weatherData.main.feels_like,
      },
    };

    storage.addToHistory(newItem);
    setHistory(storage.getSearchHistory());
  };

  const removeFromHistory = (id: string): SearchHistoryItem | null => {
    const itemToRemove = history.find((item) => item.id === id);
    if (itemToRemove) {
      storage.removeFromHistory(id);
      setHistory(storage.getSearchHistory());
      return itemToRemove;
    }
    return null;
  };

  const restoreToHistory = (item: SearchHistoryItem) => {
    storage.addToHistory(item);
    setHistory(storage.getSearchHistory());
  };

  const clearHistory = () => {
    storage.clearHistory();
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    restoreToHistory,
    clearHistory,
  };
};
