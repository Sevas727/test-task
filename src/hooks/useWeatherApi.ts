import { useState } from 'react';
import { WeatherApiService } from '../services';
import type { WeatherData } from '../types';

/**
 * Custom hook for weather API operations
 * Handles loading states, errors, and data fetching
 */
export const useWeatherApi = () => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (cityName: string) => {
    setLoading(true);
    setError(null);

    try {
      const weatherData = await WeatherApiService.getWeatherByCity(cityName);
      setData(weatherData);
      return weatherData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    data,
    loading,
    error,
    fetchWeather,
    clearError,
  };
};
