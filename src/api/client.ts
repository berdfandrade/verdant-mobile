import axios, { create, isAxiosError, type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { API_URL } from '@/lib/config';
import type { ApiErrorBody, TokenPair } from './types';

/*
  Cliente HTTP da API.
  - Coloca o access token em todas as requisições
  - Em 401, troca o refresh token por um novo par (POST /login/refresh)
    e repete a requisição. Várias requisições que falham ao mesmo tempo
    esperam um único refresh.
  - Se o refresh falhar, avisa o app para deslogar.
*/

export interface TokenHandlers {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (tokens: TokenPair) => Promise<void> | void;
  onSessionExpired: () => Promise<void> | void;
}

// Rotas que nunca devem disparar refresh (evita loop)
const AUTH_ROUTES = ['/login', '/login/refresh', '/login/admin'];

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export function createApiClient(baseURL: string = API_URL) {
  const client: AxiosInstance = create({ baseURL, timeout: 15000 });

  let handlers: TokenHandlers | null = null;
  let refreshing: Promise<string | null> | null = null;

  const refreshTokens = async (): Promise<string | null> => {
    const refreshToken = handlers?.getRefreshToken();
    if (!refreshToken) return null;

    try {
      // Usa axios "puro" para não passar pelos interceptors
      const { data } = await axios.post<TokenPair>(
        `${baseURL}/login/refresh`,
        { refresh_token: refreshToken },
        { timeout: 15000 },
      );
      await handlers?.onTokensRefreshed(data);
      return data.access_token;
    } catch {
      return null;
    }
  };

  client.interceptors.request.use(config => {
    const token = handlers?.getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  client.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const isAuthRoute = AUTH_ROUTES.includes(original?.url ?? '');

      if (error.response?.status !== 401 || !original || original._retry || isAuthRoute || !handlers) {
        throw error;
      }

      original._retry = true;

      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });

      const newToken = await refreshing;

      if (!newToken) {
        await handlers.onSessionExpired();
        throw error;
      }

      original.headers.set('Authorization', `Bearer ${newToken}`);
      return client(original);
    },
  );

  return {
    client,
    setTokenHandlers(next: TokenHandlers | null) {
      handlers = next;
    },
  };
}

export const { client: api, setTokenHandlers } = createApiClient();

// Mensagens da API (em inglês) que o usuário vê com frequência
const API_MESSAGES_PT: Record<string, string> = {
  'Wrong email or password': 'E-mail ou senha incorretos.',
  'User is disabled': 'Esta conta está desativada.',
  'Email already registered': 'Este e-mail já está cadastrado.',
  'Invalid refresh token': 'Sua sessão expirou. Entre novamente.',
  'User location not found': 'Ative a localização para ver pessoas perto de você.',
  'You can not like yourself': 'Você não pode curtir o próprio perfil.',
  'This conversation is no longer active': 'Esta conversa foi encerrada.',
  'Internal server error': 'Erro no servidor. Tente novamente em instantes.',
};

const translate = (message: string) => API_MESSAGES_PT[message] ?? message;

// Mensagem amigável a partir de um erro da API (NestJS) ou de rede
export function getErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor.';
    const message = error.response.data?.message;
    if (Array.isArray(message)) return message[0] ? translate(message[0]) : fallback;
    if (typeof message === 'string') return translate(message);
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
