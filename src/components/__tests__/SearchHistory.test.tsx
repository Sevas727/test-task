import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchHistory } from '../SearchHistory/SearchHistory';
import type { SearchHistoryItem } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeHistoryItem(overrides: Partial<SearchHistoryItem> = {}): SearchHistoryItem {
  return {
    id: 'london-1',
    cityName: 'London',
    country: 'GB',
    timestamp: Date.now(),
    weatherSnapshot: {
      temperature: 15.5,
      description: 'few clouds',
      icon: '02d',
      minTemp: 12.0,
      maxTemp: 18.0,
      windSpeed: 4.1,
      humidity: 76,
      feelsLike: 14.0,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let onItemClick: ReturnType<typeof vi.fn>;
let onItemRemove: ReturnType<typeof vi.fn>;

beforeEach(() => {
  onItemClick = vi.fn();
  onItemRemove = vi.fn();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchHistory', () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('empty state', () => {
    it('shows an empty message when history is empty', () => {
      render(<SearchHistory history={[]} onItemClick={onItemClick} onItemRemove={onItemRemove} />);

      expect(
        screen.getByText('No search history yet. Search for a city to get started!')
      ).toBeInTheDocument();
    });

    it('does not render the heading when empty', () => {
      render(<SearchHistory history={[]} onItemClick={onItemClick} onItemRemove={onItemRemove} />);

      expect(screen.queryByText('Search History')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Rendering history items
  // -------------------------------------------------------------------------

  describe('rendering items', () => {
    it('renders the "Search History" heading', () => {
      render(
        <SearchHistory
          history={[makeHistoryItem()]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      expect(screen.getByText('Search History')).toBeInTheDocument();
    });

    it('displays city name and country for each item', () => {
      const items = [
        makeHistoryItem({ id: '1', cityName: 'London', country: 'GB' }),
        makeHistoryItem({ id: '2', cityName: 'Paris', country: 'FR' }),
      ];

      render(
        <SearchHistory history={items} onItemClick={onItemClick} onItemRemove={onItemRemove} />
      );

      expect(screen.getByText('London, GB')).toBeInTheDocument();
      expect(screen.getByText('Paris, FR')).toBeInTheDocument();
    });

    it('displays the temperature for each item', () => {
      const items = [
        makeHistoryItem({
          id: '1',
          weatherSnapshot: { ...makeHistoryItem().weatherSnapshot, temperature: 22.7 },
        }),
      ];

      render(
        <SearchHistory history={items} onItemClick={onItemClick} onItemRemove={onItemRemove} />
      );

      expect(screen.getByText('23°C')).toBeInTheDocument();
    });

    it('displays the weather description', () => {
      render(
        <SearchHistory
          history={[makeHistoryItem()]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      expect(screen.getByText('few clouds')).toBeInTheDocument();
    });

    it('displays the weather icon', () => {
      render(
        <SearchHistory
          history={[makeHistoryItem()]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      const icon = screen.getByAltText('few clouds');
      expect(icon).toHaveAttribute('src', 'https://openweathermap.org/img/wn/02d.png');
    });

    it('displays a timestamp for each item', () => {
      render(
        <SearchHistory
          history={[makeHistoryItem({ timestamp: Date.now() })]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Sorting (newest first)
  // -------------------------------------------------------------------------

  describe('ordering', () => {
    it('renders items in the order provided (newest first from hook)', () => {
      const items = [
        makeHistoryItem({ id: '1', cityName: 'Paris' }),
        makeHistoryItem({ id: '2', cityName: 'London' }),
      ];

      render(
        <SearchHistory history={items} onItemClick={onItemClick} onItemRemove={onItemRemove} />
      );

      const buttons = screen.getAllByRole('button', { name: /View weather for/ });
      expect(buttons[0]).toHaveAccessibleName('View weather for Paris');
      expect(buttons[1]).toHaveAccessibleName('View weather for London');
    });
  });

  // -------------------------------------------------------------------------
  // Interactions
  // -------------------------------------------------------------------------

  describe('interactions', () => {
    it('calls onItemClick with city name when an item is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchHistory
          history={[makeHistoryItem()]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      await user.click(screen.getByRole('button', { name: 'View weather for London' }));

      expect(onItemClick).toHaveBeenCalledWith('London');
    });

    it('calls onItemRemove with item id when the remove button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchHistory
          history={[makeHistoryItem({ id: 'remove-me' })]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

      expect(onItemRemove).toHaveBeenCalledWith('remove-me');
    });

    it('does not trigger onItemClick when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SearchHistory
          history={[makeHistoryItem()]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Remove London from history' }));

      expect(onItemClick).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('accessibility', () => {
    it('has accessible labels on item click buttons', () => {
      render(
        <SearchHistory
          history={[makeHistoryItem()]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      expect(screen.getByRole('button', { name: 'View weather for London' })).toBeInTheDocument();
    });

    it('has accessible labels on remove buttons', () => {
      render(
        <SearchHistory
          history={[makeHistoryItem()]}
          onItemClick={onItemClick}
          onItemRemove={onItemRemove}
        />
      );

      expect(
        screen.getByRole('button', { name: 'Remove London from history' })
      ).toBeInTheDocument();
    });
  });
});
