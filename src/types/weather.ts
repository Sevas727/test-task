/**
 * Weather API Response Types
 */

export interface WeatherData {
  id: number;
  name: string;
  sys: {
    country: string;
  };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  timezone: number;
}

export interface WeatherSnapshot {
  temperature: number;
  description: string;
  icon: string;
  minTemp: number;
  maxTemp: number;
  windSpeed: number;
  humidity: number;
  feelsLike: number;
}

export interface SearchHistoryItem {
  id: string;
  cityName: string;
  country: string;
  timestamp: number;
  weatherSnapshot: WeatherSnapshot;
}

export interface WeatherApiError {
  cod: string | number;
  message: string;
}
