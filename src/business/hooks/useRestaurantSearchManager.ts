import { useMemo } from 'react';
import type { NetworkClient, Optional } from '@sudobility/cravings_types';
import type { Restaurant } from '@sudobility/cravings_client';
import { useRestaurantSearch } from '@sudobility/cravings_client';

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

  /**
   * A {@link NetworkClient} implementation for HTTP requests.
   * Injected to allow different fetch implementations per platform (web vs React Native).
   */
  networkClient: NetworkClient;

  /** The location to search near (e.g., "San Francisco"). */
  location: string;

  /** The dish to search for (e.g., "tacos"). */
  dish: string;

  /**
   * Whether the search query should execute.
   * Defaults to `true`. Set to `false` to defer execution until the user triggers a search.
   *
   * @defaultValue `true`
   */
  enabled?: boolean;
}

/**
 * Return type for the {@link useRestaurantSearchManager} hook.
 */
export interface UseRestaurantSearchManagerReturn {
  /** The list of matching restaurants, or an empty array if not yet loaded. */
  restaurants: Restaurant[];

  /** Whether the search query is currently loading. */
  isLoading: boolean;

  /**
   * An error message if the search failed, or `null` if no error.
   */
  error: Optional<string>;

  /** Function to manually trigger a refetch of the search results. */
  refetch: () => void;
}

/**
 * Business logic hook that wraps the cravings_client `useRestaurantSearch` hook
 * into a unified interface for UI layers.
 *
 * This is the primary search hook consumed by `cravings_app` and `cravings_app_rn`.
 * It orchestrates:
 * - **Data fetching** via the TanStack Query hook from `@sudobility/cravings_client`
 * - **Query gating** -- only executes when `enabled` is `true` and both `location` and `dish` are non-empty
 * - **Error propagation** -- surfaces errors so the UI can display feedback
 *
 * @param config - The hook configuration (see {@link UseRestaurantSearchManagerConfig})
 * @returns An object with restaurant data, loading/error state, and refetch (see {@link UseRestaurantSearchManagerReturn})
 *
 * @example
 * ```typescript
 * import { useRestaurantSearchManager } from '@sudobility/cravings_lib';
 *
 * function SearchScreen() {
 *   const { restaurants, isLoading, error, refetch } = useRestaurantSearchManager({
 *     baseUrl: 'https://api.example.com',
 *     networkClient,
 *     location: 'San Francisco',
 *     dish: 'tacos',
 *   });
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <ErrorMessage message={error} />;
 *   return <RestaurantList items={restaurants} />;
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
  const {
    restaurants,
    isLoading,
    error,
    refetch,
  } = useRestaurantSearch({
    networkClient,
    baseUrl,
    location,
    dish,
    enabled,
  });

  return useMemo(
    () => ({
      restaurants,
      isLoading,
      error,
      refetch,
    }),
    [restaurants, isLoading, error, refetch]
  );
};
