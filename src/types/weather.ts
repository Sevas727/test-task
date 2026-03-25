/**
 * Weather API Response Types
 *
 * These types mirror the OpenWeatherMap Current Weather API response structure.
 * @see https://openweathermap.org/current
 */

/** Full response from the OpenWeatherMap /weather endpoint */
export interface WeatherData {
  /** Internal city ID from OpenWeatherMap */
  id: number;
  /** City name */
  name: string;
  sys: {
    /** ISO 3166-1 alpha-2 country code (e.g. "GB", "UA") */
    country: string;
  };
  main: {
    /** Current temperature in metric units (Celsius) */
    temp: number;
    /** Perceived temperature */
    feels_like: number;
    /** Daily minimum temperature */
    temp_min: number;
    /** Daily maximum temperature */
    temp_max: number;
    /** Atmospheric pressure in hPa */
    pressure: number;
    /** Humidity percentage (0-100) */
    humidity: number;
  };
  weather: Array<{
    /** Weather condition id */
    id: number;
    /** Group of weather parameters (e.g. "Rain", "Snow", "Clouds") */
    main: string;
    /** Human-readable description (e.g. "light rain") */
    description: string;
    /** Icon code for OpenWeatherMap icon URL */
    icon: string;
  }>;
  wind: {
    /** Wind speed in m/s (metric) */
    speed: number;
    /** Wind direction in degrees */
    deg: number;
  };
  clouds: {
    /** Cloudiness percentage (0-100) */
    all: number;
  };
  /** Unix timestamp of data calculation (UTC) */
  dt: number;
  /** Timezone offset from UTC in seconds */
  timezone: number;
}

/** Lightweight weather snapshot stored in search history */
export interface WeatherSnapshot {
  /** Temperature in Celsius */
  temperature: number;
  /** Weather description (e.g. "broken clouds") */
  description: string;
  /** OpenWeatherMap icon code */
  icon: string;
  /** Daily minimum temperature */
  minTemp: number;
  /** Daily maximum temperature */
  maxTemp: number;
  /** Wind speed in m/s */
  windSpeed: number;
  /** Humidity percentage */
  humidity: number;
  /** Feels-like temperature */
  feelsLike: number;
}

/** A single entry in the search history list */
export interface SearchHistoryItem {
  /** Unique identifier (UUID) */
  id: string;
  /** City name as entered by the user */
  cityName: string;
  /** ISO country code from the API response */
  country: string;
  /** Unix timestamp (ms) of when this search was performed */
  timestamp: number;
  /** Weather data captured at search time */
  weatherSnapshot: WeatherSnapshot;
}

/** Error response shape from the OpenWeatherMap API */
export interface WeatherApiError {
  /** HTTP status code (number or string depending on endpoint) */
  cod: string | number;
  /** Error description from the API */
  message: string;
}
