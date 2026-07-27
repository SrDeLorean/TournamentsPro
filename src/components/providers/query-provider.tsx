'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes: data is fresh
      gcTime: 15 * 60 * 1000,        // 15 minutes: garbage collection
      retry: 2,                       // Retry failed requests twice
      refetchOnWindowFocus: false,    // Don't refetch on tab switch
    },
  },
};

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
