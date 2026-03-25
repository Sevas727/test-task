import { useState } from 'react';
import { StorageService } from '../services';
import type { SearchHistoryItem, WeatherData } from '../types';

/**
 * Custom hook for managing search history
 * Handles CRUD operations and localStorage sync
 */
export const useSearchHistory = () => {
  // Initialize state with lazy initialization to avoid effect
  const [history, setHistory] = useState<SearchHistoryItem[]>(() =>
    StorageService.getSearchHistory()
  );

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

    StorageService.addToHistory(newItem);
    setHistory(StorageService.getSearchHistory());
  };

  const removeFromHistory = (id: string): SearchHistoryItem | null => {
    const itemToRemove = history.find((item) => item.id === id);
    if (itemToRemove) {
      StorageService.removeFromHistory(id);
      setHistory(StorageService.getSearchHistory());
      return itemToRemove;
    }
    return null;
  };

  const restoreToHistory = (item: SearchHistoryItem) => {
    StorageService.addToHistory(item);
    setHistory(StorageService.getSearchHistory());
  };

  const clearHistory = () => {
    StorageService.clearHistory();
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
