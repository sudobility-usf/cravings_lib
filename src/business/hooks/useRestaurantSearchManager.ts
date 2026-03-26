import { useEffect, useMemo } from 'react';
import type { NetworkClient, Optional } from '@sudobility/cravings_types';
import {
  type Restaurant,
  useRestaurantSearch,
} from '@sudobility/cravings_client';
import { useRestaurantSearchStore } from '../stores/restaurantSearchStore';

/**
 * Configuration for the {@link useRestaurantSearchManager} hook.
 *
 * @example
 * ```typescript
 * const config: UseRestaurantSearchManagerConfig = {
 *   baseUrl: 'https://api.example.com',
 *   networkClient: myNetworkClient,
 *   location: 'San Francisco',
 *   dish: 'tacos',
 * };
 * ```
 */
export interface UseRestaurantSearchManagerConfig {
  /** The base URL of the Cravings API server. */
  baseUrl: string;
  /** A {@link NetworkClient} implementation for HTTP requests. */
  networkClient: NetworkClient;
  /** The location to search near (e.g., "San Francisco"). */
  location: string;
  /** The dish to search for (e.g., "tacos"). */
  dish: string;
  /**
   * Whether the query should execute.
   * @defaultValue `true`
   */
  enabled?: boolean;
}

/**
 * Return type for the {@link useRestaurantSearchManager} hook.
 */
export interface UseRestaurantSearchManagerReturn {
  /**
   * The list of matching restaurants.
   * Prefers fresh server data; falls back to cached data while loading.
   */
  restaurants: Restaurant[];
  /** Whether the query is currently in flight. */
  isLoading: boolean;
  /** An error message if the query failed, or `null` if no error. */
  error: Optional<string>;
  /**
   * Whether the displayed data is from the client-side cache rather than
   * a fresh server response.
   */
  isCached: boolean;
  /** Manually triggers a refetch. */
  search: () => void;
}

/**
 * Unified business logic hook that combines {@link useRestaurantSearch} with
 * Zustand caching into a single interface for UI layers.
 *
 * Orchestrates:
 * - **Data fetching** via `useRestaurantSearch` from `@sudobility/cravings_client`
 * - **Client-side caching** via `useRestaurantSearchStore` (keyed by `"location:dish"`)
 * - **Cache fallback** — shows cached results while waiting for the server
 *
 * This is the hook consumed by `cravings_app_rn`.
 *
 * @param config - The hook configuration (see {@link UseRestaurantSearchManagerConfig})
 * @returns An object with data, state, and a search trigger (see {@link UseRestaurantSearchManagerReturn})
 *
 * @example
 * ```typescript
 * import { useRestaurantSearchManager } from '@sudobility/cravings_lib';
 *
 * function SearchScreen() {
 *   const { restaurants, isLoading, error, isCached, search } =
 *     useRestaurantSearchManager({
 *       baseUrl: 'https://api.example.com',
 *       networkClient,
 *       location: 'San Francisco',
 *       dish: 'tacos',
 *     });
 *
 *   if (isLoading) return <ActivityIndicator />;
 *   if (error) return <Text>{error}</Text>;
 *   return <FlatList data={restaurants} />;
 * }
 * ```
 */
export const useRestaurantSearchManager = ({
  baseUrl,
  networkClient,
  location,
  dish,
  enabled = true,
}: UseRestaurantSearchManagerConfig): UseRestaurantSearchManagerReturn => {
  const cacheKey = `${location}:${dish}`;

  const {
    restaurants: clientRestaurants,
    isLoading,
    error,
    refetch,
  } = useRestaurantSearch({ networkClient, baseUrl, location, dish, enabled });

  const setRestaurants = useRestaurantSearchStore(
    state => state.setRestaurants
  );
  const getRestaurants = useRestaurantSearchStore(
    state => state.getRestaurants
  );

  const cachedRestaurants = getRestaurants(cacheKey);

  useEffect(() => {
    if (clientRestaurants.length > 0) {
      setRestaurants(cacheKey, clientRestaurants);
    }
  }, [clientRestaurants, cacheKey, setRestaurants]);

  return useMemo(
    () => ({
      restaurants:
        clientRestaurants.length > 0
          ? clientRestaurants
          : (cachedRestaurants ?? []),
      isLoading,
      error,
      isCached:
        clientRestaurants.length === 0 && (cachedRestaurants?.length ?? 0) > 0,
      search: refetch,
    }),
    [clientRestaurants, cachedRestaurants, isLoading, error, refetch]
  );
};
