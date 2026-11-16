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
  // Tudo de dates começa com 'dates': invalidar ['dates'] atualiza calendário, lista e convites
  dates: ['dates'] as const,
  datesList: (from?: string, to?: string) => ['dates', 'list', from ?? null, to ?? null] as const,
  dateInvites: ['dates', 'invites'] as const,
  locationSync: ['location-sync'] as const,
};
