import { create } from 'zustand';
import type { Restaurant } from '@sudobility/cravings_client';

/**
 * Default cache expiration time in milliseconds (10 minutes).
 */
export const RESTAURANT_SEARCH_CACHE_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * A single cache entry for a restaurant search result.
 */
export interface RestaurantSearchCacheEntry {
  /** The cached list of restaurants for this search. */
  restaurants: Restaurant[];
  /** Unix timestamp (in milliseconds) when this entry was cached. */
  cachedAt: number;
}

/**
 * State shape and actions for the restaurant search Zustand store.
 *
 * Cache entries are keyed by `"location:dish"` for per-search isolation.
 * In-memory only — data is lost on page refresh or app restart.
 */
export interface RestaurantSearchStoreState {
  /** Internal cache map keyed by `"location:dish"`. */
  cache: Record<string, RestaurantSearchCacheEntry>;

  /**
   * Sets (replaces) the cached restaurants for a given search key.
   *
   * @param key - The cache key (`"location:dish"`)
   * @param restaurants - The list of restaurants to cache
   */
  setRestaurants: (key: string, restaurants: Restaurant[]) => void;

  /**
   * Retrieves cached restaurants for a given search key.
   * Returns `undefined` if missing or expired.
   *
   * @param key - The cache key (`"location:dish"`)
   * @param maxAge - Maximum cache age in milliseconds
   */
  getRestaurants: (key: string, maxAge?: number) => Restaurant[] | undefined;

  /** Clears the entire cache. */
  clearAll: () => void;
}

/**
 * Zustand store providing per-search client-side caching for restaurant results.
 *
 * Keyed by `"location:dish"` string. In-memory only.
 */
export const useRestaurantSearchStore = create<RestaurantSearchStoreState>(
  (set, get) => ({
    cache: {},

    setRestaurants: (key, restaurants) =>
      set(state => ({
        cache: {
          ...state.cache,
          [key]: { restaurants, cachedAt: Date.now() },
        },
      })),

    getRestaurants: (key, maxAge = RESTAURANT_SEARCH_CACHE_EXPIRATION_MS) => {
      const entry = get().cache[key];
      if (!entry) return undefined;
      if (Date.now() - entry.cachedAt > maxAge) return undefined;
      return entry.restaurants;
    },

    clearAll: () => set({ cache: {} }),
  })
);
