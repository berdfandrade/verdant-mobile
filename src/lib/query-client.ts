import { QueryClient } from '@tanstack/react-query';

import { getStatus } from '@/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Não insiste em erros do cliente (4xx): só em falhas de rede/servidor
      retry: (failureCount, error) => {
        const status = getStatus(error);
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

export const queryKeys = {
  me: ['me'] as const,
  feed: ['feed'] as const,
  matches: ['matches'] as const,
  received: ['likes-received'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (id: string) => ['messages', id] as const,
  locationSync: ['location-sync'] as const,
};
