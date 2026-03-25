/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchHistory } from '../useSearchHistory';
import type { WeatherData, SearchHistoryItem } from '../../types';

// ---------------------------------------------------------------------------
// Mock StorageService so tests are isolated from real localStorage
// ---------------------------------------------------------------------------

vi.mock('../../services', () => {
  let store: SearchHistoryItem[] = [];

  return {
    StorageService: {
      getSearchHistory: vi.fn(() => store),
      addToHistory: vi.fn((item: SearchHistoryItem) => {
        store = [
          item,
          ...store.filter((h) => h.cityName.toLowerCase() !== item.cityName.toLowerCase()),
        ];
      }),
      removeFromHistory: vi.fn((id: string) => {
        store = store.filter((h) => h.id !== id);
      }),
      clearHistory: vi.fn(() => {
        store = [];
      }),
      _setStore(items: SearchHistoryItem[]) {
        store = items;
      },
    },
  };
});

import { StorageService } from '../../services';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockWeatherData: WeatherData = {
  id: 2643743,
  name: 'London',
  sys: { country: 'GB' },
  main: {
    temp: 15.5,
    feels_like: 14.0,
    temp_min: 12.0,
    temp_max: 18.0,
    pressure: 1013,
    humidity: 76,
  },
  weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: '02d' }],
  wind: { speed: 4.1, deg: 230 },
  clouds: { all: 20 },
  dt: 1700000000,
  timezone: 3600,
};

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

// Access mock-internal helper to pre-populate the store
const mockStorage = StorageService as unknown as { _setStore(items: SearchHistoryItem[]): void };

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockStorage._setStore([]);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSearchHistory', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('initialises history from StorageService', () => {
      const existing = [makeHistoryItem()];
      mockStorage._setStore(existing);

      const { result } = renderHook(() => useSearchHistory());

      expect(result.current.history).toEqual(existing);
    });

    it('starts with an empty array when storage is empty', () => {
      const { result } = renderHook(() => useSearchHistory());

      expect(result.current.history).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // addToHistory
  // -------------------------------------------------------------------------

  describe('addToHistory', () => {
    it('creates a SearchHistoryItem from WeatherData and adds it', () => {
      const { result } = renderHook(() => useSearchHistory());

      act(() => {
        result.current.addToHistory(mockWeatherData);
      });

      expect(StorageService.addToHistory).toHaveBeenCalledTimes(1);

      const addedItem = vi.mocked(StorageService.addToHistory).mock.calls[0][0];
      expect(addedItem.cityName).toBe('London');
      expect(addedItem.country).toBe('GB');
      expect(addedItem.weatherSnapshot.temperature).toBe(15.5);
      expect(addedItem.weatherSnapshot.description).toBe('few clouds');
      expect(addedItem.weatherSnapshot.icon).toBe('02d');
      expect(addedItem.weatherSnapshot.humidity).toBe(76);
    });

    it('updates the React state after adding', () => {
      const { result } = renderHook(() => useSearchHistory());

      act(() => {
        result.current.addToHistory(mockWeatherData);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].cityName).toBe('London');
    });

    it('generates a unique ID containing the weather ID and a timestamp', () => {
      const { result } = renderHook(() => useSearchHistory());

      act(() => {
        result.current.addToHistory(mockWeatherData);
      });

      const addedItem = vi.mocked(StorageService.addToHistory).mock.calls[0][0];
      expect(addedItem.id).toContain(String(mockWeatherData.id));
    });
  });

  // -------------------------------------------------------------------------
  // removeFromHistory
  // -------------------------------------------------------------------------

  describe('removeFromHistory', () => {
    it('removes an item and returns it', () => {
      const item = makeHistoryItem({ id: 'remove-me' });
      mockStorage._setStore([item]);

      const { result } = renderHook(() => useSearchHistory());

      let removed: SearchHistoryItem | null = null;
      act(() => {
        removed = result.current.removeFromHistory('remove-me');
      });

      expect(removed).toEqual(item);
      expect(StorageService.removeFromHistory).toHaveBeenCalledWith('remove-me');
      expect(result.current.history).toHaveLength(0);
    });

    it('returns null when the item does not exist', () => {
      const { result } = renderHook(() => useSearchHistory());

      let removed: SearchHistoryItem | null = null;
      act(() => {
        removed = result.current.removeFromHistory('non-existent');
      });

      expect(removed).toBeNull();
      expect(StorageService.removeFromHistory).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // restoreToHistory
  // -------------------------------------------------------------------------

  describe('restoreToHistory', () => {
    it('restores a previously removed item via StorageService', () => {
      const item = makeHistoryItem({ id: 'restored-item' });
      const { result } = renderHook(() => useSearchHistory());

      act(() => {
        result.current.restoreToHistory(item);
      });

      expect(StorageService.addToHistory).toHaveBeenCalledWith(item);
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].id).toBe('restored-item');
    });
  });

  // -------------------------------------------------------------------------
  // clearHistory
  // -------------------------------------------------------------------------

  describe('clearHistory', () => {
    it('clears all history items', () => {
      mockStorage._setStore([makeHistoryItem()]);

      const { result } = renderHook(() => useSearchHistory());
      expect(result.current.history).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(StorageService.clearHistory).toHaveBeenCalled();
      expect(result.current.history).toEqual([]);
    });
  });
});
