import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-client';
import { connectSocket, disconnectSocket, SocketEvents } from '@/lib/socket';

// Mantém o socket ligado enquanto o usuário está logado e atualiza a lista de conversas
export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = connectSocket();

    const onNotification = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    };

    socket.on(SocketEvents.notification, onNotification);

    return () => {
      socket.off(SocketEvents.notification, onNotification);
      disconnectSocket();
    };
  }, [queryClient]);
}
