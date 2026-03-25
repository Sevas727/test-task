import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherCardSkeleton } from '../WeatherCard/WeatherCardSkeleton';

describe('WeatherCardSkeleton', () => {
  it('renders a loading skeleton with aria-busy', () => {
    render(<WeatherCardSkeleton />);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading weather data');
  });

  it('renders pulse-animated placeholder blocks', () => {
    const { container } = render(<WeatherCardSkeleton />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('matches the WeatherCard layout dimensions', () => {
    const { container } = render(<WeatherCardSkeleton />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg', 'p-6', 'w-full', 'max-w-md');
  });
});
