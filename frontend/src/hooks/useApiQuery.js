import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import logger from '../utils/logger';

/**
 * Custom hook for API queries with React Query
 * Handles caching, retries, and error handling automatically
 */
export const useApiQuery = (
  queryKey,
  url,
  options = {}
) => {
  const defaultOptions = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  };

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await apiClient.get(url);
        return response.data;
      } catch (error) {
        logger.error(`Query failed for ${url}:`, error);
        throw error;
      }
    },
    ...defaultOptions,
  });
};

/**
 * Custom hook for API mutations (POST, PUT, DELETE, PATCH)
 * Handles optimistic updates and cache invalidation
 */
export const useApiMutation = (
  mutationFn,
  options = {}
) => {
  const queryClient = useQueryClient();

  const defaultOptions = {
    onSuccess: (data, variables, context) => {
      // Invalidate relevant queries after successful mutation
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      logger.info('Mutation successful', { data });

      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      logger.error('Mutation failed:', error);

      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options,
  };

  return useMutation({
    mutationFn,
    ...defaultOptions,
  });
};

/**
 * Predefined hook for GET requests
 */
export const useGet = (url, queryKey, options) => {
  return useApiQuery(queryKey || [url], url, options);
};

/**
 * Predefined hook for POST requests
 */
export const usePost = (url, options = {}) => {
  return useApiMutation(
    (data) => apiClient.post(url, data),
    options
  );
};

/**
 * Predefined hook for PUT requests
 */
export const usePut = (url, options = {}) => {
  return useApiMutation(
    (data) => apiClient.put(url, data),
    options
  );
};

/**
 * Predefined hook for PATCH requests
 */
export const usePatch = (url, options = {}) => {
  return useApiMutation(
    (data) => apiClient.patch(url, data),
    options
  );
};

/**
 * Predefined hook for DELETE requests
 */
export const useDelete = (url, options = {}) => {
  return useApiMutation(
    () => apiClient.delete(url),
    options
  );
};
