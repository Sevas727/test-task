import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherCard } from '../WeatherCard/WeatherCard';
import type { WeatherData } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockWeatherData: WeatherData = {
  id: 2643743,
  name: 'London',
  sys: { country: 'GB' },
  main: {
    temp: 15.5,
    feels_like: 13.8,
    temp_min: 12.3,
    temp_max: 18.7,
    pressure: 1013,
    humidity: 76,
  },
  weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
  wind: { speed: 4.1, deg: 230 },
  clouds: { all: 20 },
  dt: 1700000000,
  timezone: 3600,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WeatherCard', () => {
  // -------------------------------------------------------------------------
  // Location display
  // -------------------------------------------------------------------------

  describe('location', () => {
    it('displays city name and country', () => {
      render(<WeatherCard data={mockWeatherData} />);

      expect(screen.getByText('London, GB')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Main weather info
  // -------------------------------------------------------------------------

  describe('main weather info', () => {
    it('displays the current temperature rounded to nearest integer', () => {
      render(<WeatherCard data={mockWeatherData} />);

      expect(screen.getByText('16°C')).toBeInTheDocument();
    });

    it('displays the weather description', () => {
      render(<WeatherCard data={mockWeatherData} />);

      expect(screen.getByText('few clouds')).toBeInTheDocument();
    });

    it('displays the weather icon with alt text', () => {
      render(<WeatherCard data={mockWeatherData} />);

      const icon = screen.getByAltText('few clouds');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', 'https://openweathermap.org/img/wn/02d@2x.png');
    });
  });

  // -------------------------------------------------------------------------
  // Additional weather details
  // -------------------------------------------------------------------------

  describe('additional details', () => {
    it('displays feels like temperature', () => {
      render(<WeatherCard data={mockWeatherData} />);

      expect(screen.getByText('Feels like')).toBeInTheDocument();
      expect(screen.getByText('14°C')).toBeInTheDocument();
    });

    it('displays humidity percentage', () => {
      render(<WeatherCard data={mockWeatherData} />);

      expect(screen.getByText('Humidity')).toBeInTheDocument();
      expect(screen.getByText('76%')).toBeInTheDocument();
    });

    it('displays min and max temperatures', () => {
      render(<WeatherCard data={mockWeatherData} />);

      expect(screen.getByText('Min / Max')).toBeInTheDocument();
      expect(screen.getByText('12° / 19°')).toBeInTheDocument();
    });

    it('displays wind speed', () => {
      render(<WeatherCard data={mockWeatherData} />);

      expect(screen.getByText('Wind Speed')).toBeInTheDocument();
      expect(screen.getByText('4.1 m/s')).toBeInTheDocument();
    });
  });
});
