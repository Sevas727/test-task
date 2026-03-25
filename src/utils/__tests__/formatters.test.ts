import { describe, it, expect } from 'vitest';
import { getWeatherIconUrl } from '../formatters';

describe('getWeatherIconUrl', () => {
  it('returns a small icon URL by default', () => {
    expect(getWeatherIconUrl('02d')).toBe('https://openweathermap.org/img/wn/02d.png');
  });

  it('returns a large icon URL when size is "large"', () => {
    expect(getWeatherIconUrl('02d', 'large')).toBe('https://openweathermap.org/img/wn/02d@2x.png');
  });
});
