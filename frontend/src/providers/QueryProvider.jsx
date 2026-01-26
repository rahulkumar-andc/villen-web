import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * Create React Query client with optimized settings
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: how long data is fresh before refetch
        staleTime: 1000 * 60 * 5, // 5 minutes

        // GC time (formerly cacheTime): how long to keep unused data in cache
        gcTime: 1000 * 60 * 10, // 10 minutes

        // Retry failed requests
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (except 408, 429)
          if (error.status >= 400 && error.status < 500) {
            if (error.status === 408 || error.status === 429) {
              return failureCount < 3;
            }
            return false;
          }

          // Retry on 5xx and network errors up to 3 times
          return failureCount < 3;
        },

        // Exponential backoff for retries
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus
        refetchOnWindowFocus: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: 'stale',

        // Don't refetch on reconnect if data is fresh
        refetchOnReconnect: 'stale',
      },

      mutations: {
        // Retry mutations less aggressively
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
};

/**
 * QueryClientProvider wrapper component
 */
export const QueryProvider = ({ children }) => {
  const [queryClient] = React.useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
