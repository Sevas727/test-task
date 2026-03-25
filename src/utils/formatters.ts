/**
 * Utility functions for formatting data
 */

/**
 * Formats a timestamp into a human-readable relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

  return date.toLocaleDateString();
};

/**
 * Converts temperature from Kelvin to Celsius
 */
export const kelvinToCelsius = (kelvin: number): number => {
  return Math.round(kelvin - 273.15);
};

/**
 * Converts temperature from Celsius to Fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9) / 5 + 32);
};

/**
 * Returns the OpenWeatherMap icon URL for a given icon code
 */
export const getWeatherIconUrl = (icon: string, size: 'small' | 'large' = 'small'): string => {
  const suffix = size === 'large' ? '@2x' : '';
  return `https://openweathermap.org/img/wn/${icon}${suffix}.png`;
};

/**
 * Formats wind speed
 */
export const formatWindSpeed = (speed: number, unit: 'metric' | 'imperial' = 'metric'): string => {
  if (unit === 'imperial') {
    return `${Math.round(speed * 2.237)} mph`;
  }
  return `${Math.round(speed)} m/s`;
};
