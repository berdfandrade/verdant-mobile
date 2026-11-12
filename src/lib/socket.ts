import { io, type Socket } from 'socket.io-client';

import { usersApi } from '@/api/endpoints';
import { API_URL } from '@/lib/config';
import { useAuth } from '@/store/auth';

/*
  Uma conexão Socket.IO para a sessão inteira.
  O token é lido a cada (re)conexão, então funciona depois de um refresh.
*/

let socket: Socket | null = null;
let authRetries = 0;
const MAX_AUTH_RETRIES = 2;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(API_URL, {
    transports: ['websocket'],
    autoConnect: false,
    auth: cb => cb({ token: useAuth.getState().accessToken }),
  });

  socket.on('connect', () => {
    authRetries = 0;
  });

  // O servidor derruba o socket quando o token é inválido/expirado.
  // Uma chamada HTTP autenticada dispara o refresh; depois reconecta.
  socket.on('auth_error', async () => {
    if (authRetries >= MAX_AUTH_RETRIES) return;
    authRetries++;
    try {
      await usersApi.me();
      socket?.connect();
    } catch {
      // refresh falhou: o cliente HTTP já deslogou o usuário
    }
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}

// Eventos do gateway (verdant-nest/src/chat/chat.gateway.ts)
export const SocketEvents = {
  joinConversation: 'join_conversation',
  leaveConversation: 'leave_conversation',
  sendMessage: 'send_message',
  newMessage: 'new_message',
  notification: 'notification',
  sendMessageError: 'send_message_error',
} as const;
