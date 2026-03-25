import type { WeatherData, WeatherApiError } from '../types';

/**
 * Weather API Service
 * Handles all communication with OpenWeatherMap API
 */

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string | undefined;
const API_URL =
  (import.meta.env.VITE_WEATHER_API_URL as string | undefined) ||
  'https://api.openweathermap.org/data/2.5';

export class WeatherApiService {
  /**
   * Fetches weather data for a given city
   * @param cityName - Name of the city to search for
   * @returns Promise with weather data
   * @throws Error if city not found or API request fails
   */
  static async getWeatherByCity(cityName: string): Promise<WeatherData> {
    if (!API_KEY) {
      throw new Error(
        'Weather API key is not configured. Please add VITE_WEATHER_API_KEY to your .env file'
      );
    }

    if (!cityName.trim()) {
      throw new Error('City name cannot be empty');
    }

    try {
      const response = await fetch(
        `${API_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) {
        const errorData = (await response.json()) as WeatherApiError;

        if (response.status === 404) {
          throw new Error(`City "${cityName}" not found. Please check the spelling and try again.`);
        }

        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }

        throw new Error(errorData.message || 'Failed to fetch weather data');
      }

      const data = (await response.json()) as WeatherData;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your internet connection.');
    }
  }
}
