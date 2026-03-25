/**
 * Application configuration helpers.
 *
 * Env vars are read through functions so that Vitest can mock this module
 * cleanly without fighting Vite's static `import.meta.env` replacement.
 */

export const getWeatherApiKey = (): string | undefined =>
  (import.meta.env.VITE_WEATHER_API_KEY as string | undefined) || undefined;

export const getWeatherApiUrl = (): string =>
  (import.meta.env.VITE_WEATHER_API_URL as string | undefined) ||
  'https://api.openweathermap.org/data/2.5';
