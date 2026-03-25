import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatRelativeTime,
  kelvinToCelsius,
  celsiusToFahrenheit,
  getWeatherIconUrl,
  formatWindSpeed,
} from '../formatters';

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------

describe('formatRelativeTime', () => {
  it('returns "Just now" for timestamps less than 1 minute ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now)).toBe('Just now');
    expect(formatRelativeTime(now - 30_000)).toBe('Just now');
  });

  it('returns minutes ago for timestamps 1-59 minutes ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60_000)).toBe('1m ago');
    expect(formatRelativeTime(now - 30 * 60_000)).toBe('30m ago');
    expect(formatRelativeTime(now - 59 * 60_000)).toBe('59m ago');
  });

  it('returns hours ago for timestamps 1-23 hours ago', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60 * 60_000)).toBe('1h ago');
    expect(formatRelativeTime(now - 12 * 60 * 60_000)).toBe('12h ago');
    expect(formatRelativeTime(now - 23 * 60 * 60_000)).toBe('23h ago');
  });

  it('returns a formatted date for timestamps 24+ hours ago', () => {
    const oldDate = new Date('2023-01-15T12:00:00').getTime();
    const result = formatRelativeTime(oldDate);
    // Should be a locale date string, not a relative time
    expect(result).not.toContain('ago');
    expect(result).not.toBe('Just now');
  });
});

// ---------------------------------------------------------------------------
// kelvinToCelsius
// ---------------------------------------------------------------------------

describe('kelvinToCelsius', () => {
  it('converts 273.15K to 0°C', () => {
    expect(kelvinToCelsius(273.15)).toBe(0);
  });

  it('converts 300K to 27°C (rounded)', () => {
    expect(kelvinToCelsius(300)).toBe(27);
  });

  it('converts 0K to -273°C (rounded)', () => {
    expect(kelvinToCelsius(0)).toBe(-273);
  });
});

// ---------------------------------------------------------------------------
// celsiusToFahrenheit
// ---------------------------------------------------------------------------

describe('celsiusToFahrenheit', () => {
  it('converts 0°C to 32°F', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
  });

  it('converts 100°C to 212°F', () => {
    expect(celsiusToFahrenheit(100)).toBe(212);
  });

  it('converts -40°C to -40°F', () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });
});

// ---------------------------------------------------------------------------
// getWeatherIconUrl
// ---------------------------------------------------------------------------

describe('getWeatherIconUrl', () => {
  it('returns a small icon URL by default', () => {
    expect(getWeatherIconUrl('02d')).toBe('https://openweathermap.org/img/wn/02d.png');
  });

  it('returns a large icon URL when size is "large"', () => {
    expect(getWeatherIconUrl('02d', 'large')).toBe('https://openweathermap.org/img/wn/02d@2x.png');
  });
});

// ---------------------------------------------------------------------------
// formatWindSpeed
// ---------------------------------------------------------------------------

describe('formatWindSpeed', () => {
  it('formats metric wind speed in m/s by default', () => {
    expect(formatWindSpeed(4.1)).toBe('4 m/s');
  });

  it('formats imperial wind speed in mph', () => {
    expect(formatWindSpeed(4.1, 'imperial')).toBe('9 mph');
  });

  it('rounds values', () => {
    expect(formatWindSpeed(3.7)).toBe('4 m/s');
    expect(formatWindSpeed(3.2)).toBe('3 m/s');
  });
});
