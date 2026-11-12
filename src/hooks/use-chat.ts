import { useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { conversationsApi, messagesApi } from '@/api/endpoints';
import type { Message } from '@/api/types';
import { flattenMessages, prependMessage, type MessagePages } from '@/lib/messages-cache';
import { queryKeys } from '@/lib/query-client';
import { connectSocket, SocketEvents } from '@/lib/socket';

const PAGE_SIZE = 30;

export function useChat(conversationId: string) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  // Histórico paginado (mais recentes primeiro)
  const query = useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam }) => conversationsApi.messages(conversationId, { limit: PAGE_SIZE, skip: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < PAGE_SIZE ? undefined : pages.reduce((total, page) => total + page.length, 0),
  });

  const addMessage = useCallback(
    (message: Message) => {
      queryClient.setQueryData<MessagePages>(queryKeys.messages(conversationId), data =>
        prependMessage(data, message),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
    [conversationId, queryClient],
  );

  // Entra na sala da conversa e escuta mensagens novas
  useEffect(() => {
    const socket = connectSocket();

    const join = () => {
      setConnected(true);
      socket.emit(SocketEvents.joinConversation, { conversationId });
    };
    const onDisconnect = () => setConnected(false);
    const onMessage = (message: Message) => {
      if (message.conversationId === conversationId) addMessage(message);
    };

    if (socket.connected) join();
    socket.on('connect', join);
    socket.on('disconnect', onDisconnect);
    socket.on(SocketEvents.newMessage, onMessage);

    return () => {
      socket.emit(SocketEvents.leaveConversation, { conversationId });
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socket.off(SocketEvents.newMessage, onMessage);
    };
  }, [conversationId, addMessage]);

  // Envia pelo socket; sem conexão, cai para o POST /messages
  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;

      const socket = connectSocket();
      if (socket.connected) {
        socket.emit(SocketEvents.sendMessage, { conversationId, content: text });
        return;
      }

      const message = await messagesApi.send(conversationId, text);
      addMessage(message);
    },
    [conversationId, addMessage],
  );

  return {
    messages: flattenMessages(query.data),
    isLoading: query.isLoading,
    error: query.error,
    loadOlder: () => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage(),
    isLoadingOlder: query.isFetchingNextPage,
    connected,
    send,
  };
}
