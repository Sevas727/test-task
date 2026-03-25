import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService } from '../storage';
import type { SearchHistoryItem } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'weather-app-history';

function makeHistoryItem(overrides: Partial<SearchHistoryItem> = {}): SearchHistoryItem {
  return {
    id: '2643743-1700000000000',
    cityName: 'London',
    country: 'GB',
    timestamp: 1700000000000,
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
// Mock localStorage — jsdom in Vitest 4.x doesn't always provide a usable
// Storage implementation, so we supply our own minimal in-memory version.
// ---------------------------------------------------------------------------

let store: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  store = {};
  localStorageMock.getItem.mockImplementation((key: string) => store[key] ?? null);
  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    store[key] = value;
  });
  localStorageMock.removeItem.mockImplementation((key: string) => {
    delete store[key];
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StorageService', () => {
  // -------------------------------------------------------------------------
  // getSearchHistory
  // -------------------------------------------------------------------------

  describe('getSearchHistory', () => {
    it('returns an empty array when localStorage is empty', () => {
      expect(StorageService.getSearchHistory()).toEqual([]);
    });

    it('returns stored history items', () => {
      const items = [makeHistoryItem()];
      store[STORAGE_KEY] = JSON.stringify(items);

      expect(StorageService.getSearchHistory()).toEqual(items);
    });

    it('returns an empty array when stored JSON is invalid', () => {
      store[STORAGE_KEY] = 'not-valid-json';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(StorageService.getSearchHistory()).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // saveSearchHistory
  // -------------------------------------------------------------------------

  describe('saveSearchHistory', () => {
    it('saves history items to localStorage', () => {
      const items = [makeHistoryItem()];
      StorageService.saveSearchHistory(items);

      expect(JSON.parse(store[STORAGE_KEY])).toEqual(items);
    });

    it('limits stored items to a maximum of 10', () => {
      const items = Array.from({ length: 15 }, (_, i) =>
        makeHistoryItem({ id: `item-${i}`, cityName: `City${i}` })
      );

      StorageService.saveSearchHistory(items);

      const stored = JSON.parse(store[STORAGE_KEY]) as SearchHistoryItem[];
      expect(stored).toHaveLength(10);
      expect(stored[0].id).toBe('item-0');
      expect(stored[9].id).toBe('item-9');
    });

    it('handles localStorage write errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      StorageService.saveSearchHistory([makeHistoryItem()]);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save search history:', expect.any(Error));
    });
  });

  // -------------------------------------------------------------------------
  // addToHistory
  // -------------------------------------------------------------------------

  describe('addToHistory', () => {
    it('adds a new item to an empty history', () => {
      const item = makeHistoryItem();
      StorageService.addToHistory(item);

      const stored = StorageService.getSearchHistory();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual(item);
    });

    it('prepends new items (newest first)', () => {
      const london = makeHistoryItem({ id: 'london-1', cityName: 'London' });
      const paris = makeHistoryItem({ id: 'paris-1', cityName: 'Paris' });

      StorageService.addToHistory(london);
      StorageService.addToHistory(paris);

      const stored = StorageService.getSearchHistory();
      expect(stored[0].cityName).toBe('Paris');
      expect(stored[1].cityName).toBe('London');
    });

    it('deduplicates cities case-insensitively', () => {
      const london1 = makeHistoryItem({ id: 'london-1', cityName: 'London', timestamp: 1000 });
      const london2 = makeHistoryItem({ id: 'london-2', cityName: 'london', timestamp: 2000 });

      StorageService.addToHistory(london1);
      StorageService.addToHistory(london2);

      const stored = StorageService.getSearchHistory();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('london-2');
    });

    it('moves a re-searched city to the top of the list', () => {
      const london = makeHistoryItem({ id: 'london-1', cityName: 'London' });
      const paris = makeHistoryItem({ id: 'paris-1', cityName: 'Paris' });
      const londonAgain = makeHistoryItem({ id: 'london-2', cityName: 'London' });

      StorageService.addToHistory(london);
      StorageService.addToHistory(paris);
      StorageService.addToHistory(londonAgain);

      const stored = StorageService.getSearchHistory();
      expect(stored).toHaveLength(2);
      expect(stored[0].cityName).toBe('London');
      expect(stored[1].cityName).toBe('Paris');
    });
  });

  // -------------------------------------------------------------------------
  // removeFromHistory
  // -------------------------------------------------------------------------

  describe('removeFromHistory', () => {
    it('removes an item by ID', () => {
      const item = makeHistoryItem({ id: 'to-remove' });
      StorageService.addToHistory(item);

      StorageService.removeFromHistory('to-remove');

      expect(StorageService.getSearchHistory()).toEqual([]);
    });

    it('does nothing when ID does not exist', () => {
      const item = makeHistoryItem();
      StorageService.addToHistory(item);

      StorageService.removeFromHistory('non-existent');

      expect(StorageService.getSearchHistory()).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // clearHistory
  // -------------------------------------------------------------------------

  describe('clearHistory', () => {
    it('removes all history from localStorage', () => {
      StorageService.addToHistory(makeHistoryItem());
      StorageService.clearHistory();

      expect(store[STORAGE_KEY]).toBeUndefined();
      expect(StorageService.getSearchHistory()).toEqual([]);
    });

    it('handles localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('SecurityError');
      });

      StorageService.clearHistory();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear search history:', expect.any(Error));
    });
  });
});
