import { create } from 'zustand';

import { setTokenHandlers } from '@/api/client';
import { authApi } from '@/api/endpoints';
import type { Credentials, TokenPair } from '@/api/types';
import { storage } from '@/lib/storage';

/*
  Sessão do usuário.
  status:
    - 'loading'  : lendo tokens salvos (app abrindo)
    - 'signedOut': sem sessão -> telas de login/cadastro
    - 'signedIn' : logado -> abas do app
*/

const KEYS = {
  access: 'verdant.accessToken',
  refresh: 'verdant.refreshToken',
  userId: 'verdant.userId',
} as const;

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: Status;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  bootstrap: () => Promise<void>;
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  setTokens: (tokens: TokenPair) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  accessToken: null,
  refreshToken: null,
  userId: null,

  bootstrap: async () => {
    const [accessToken, refreshToken, userId] = await Promise.all([
      storage.get(KEYS.access),
      storage.get(KEYS.refresh),
      storage.get(KEYS.userId),
    ]);

    if (accessToken && refreshToken && userId) {
      set({ accessToken, refreshToken, userId, status: 'signedIn' });
    } else {
      set({ status: 'signedOut' });
    }
  },

  signIn: async credentials => {
    const { access_token, refresh_token, user } = await authApi.login(credentials);

    await Promise.all([
      storage.set(KEYS.access, access_token),
      storage.set(KEYS.refresh, refresh_token),
      storage.set(KEYS.userId, user.id),
    ]);

    set({ accessToken: access_token, refreshToken: refresh_token, userId: user.id, status: 'signedIn' });
  },

  signOut: async () => {
    // Avisa a API (invalida o refresh token); se falhar, desloga mesmo assim
    if (get().status === 'signedIn') {
      await authApi.logout().catch(() => undefined);
    }
    await clearSession();
  },

  setTokens: async ({ access_token, refresh_token }) => {
    await Promise.all([storage.set(KEYS.access, access_token), storage.set(KEYS.refresh, refresh_token)]);
    set({ accessToken: access_token, refreshToken: refresh_token });
  },
}));

async function clearSession() {
  await Promise.all([storage.remove(KEYS.access), storage.remove(KEYS.refresh), storage.remove(KEYS.userId)]);
  useAuth.setState({ accessToken: null, refreshToken: null, userId: null, status: 'signedOut' });
}

// Conecta o cliente HTTP à sessão (token atual, refresh e logout automático)
setTokenHandlers({
  getAccessToken: () => useAuth.getState().accessToken,
  getRefreshToken: () => useAuth.getState().refreshToken,
  onTokensRefreshed: tokens => useAuth.getState().setTokens(tokens),
  onSessionExpired: clearSession,
});
