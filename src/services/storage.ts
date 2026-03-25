import type { SearchHistoryItem } from '../types';

/**
 * Local Storage Service
 * Handles all localStorage operations with type safety
 */

const STORAGE_KEY = 'weather-app-history';
const MAX_HISTORY_ITEMS = 10;

export class StorageService {
  /**
   * Retrieves search history from localStorage
   * @returns Array of search history items
   */
  static getSearchHistory(): SearchHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as SearchHistoryItem[];
    } catch (error) {
      console.error('Failed to retrieve search history:', error);
      return [];
    }
  }

  /**
   * Saves search history to localStorage
   * @param history - Array of search history items to save
   */
  static saveSearchHistory(history: SearchHistoryItem[]): void {
    try {
      // Limit history to MAX_HISTORY_ITEMS
      const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Adds a new item to search history
   * @param item - Search history item to add
   */
  static addToHistory(item: SearchHistoryItem): void {
    const history = this.getSearchHistory();

    // Remove duplicate city if exists (case-insensitive)
    const filteredHistory = history.filter(
      (h) => h.cityName.toLowerCase() !== item.cityName.toLowerCase()
    );

    // Add new item at the beginning
    const newHistory = [item, ...filteredHistory];

    this.saveSearchHistory(newHistory);
  }

  /**
   * Removes an item from search history by ID
   * @param id - ID of the item to remove
   */
  static removeFromHistory(id: string): void {
    const history = this.getSearchHistory();
    const newHistory = history.filter((item) => item.id !== id);
    this.saveSearchHistory(newHistory);
  }

  /**
   * Clears all search history
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }
}
