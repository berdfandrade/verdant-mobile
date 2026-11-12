import { authApi } from '@/api/endpoints';

import { useAuth } from '../auth';

// Armazenamento em memória no lugar do SecureStore
const mockMemory = new Map<string, string>();
jest.mock('@/lib/storage', () => ({
  storage: {
    get: jest.fn(async (key: string) => mockMemory.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => void mockMemory.set(key, value)),
    remove: jest.fn(async (key: string) => void mockMemory.delete(key)),
  },
}));

jest.mock('@/api/endpoints', () => ({
  authApi: { login: jest.fn(), logout: jest.fn() },
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

beforeEach(() => {
  mockMemory.clear();
  jest.clearAllMocks();
  useAuth.setState({ status: 'loading', accessToken: null, refreshToken: null, userId: null });
});

describe('🔐 sessão', () => {
  it('sem tokens salvos, começa deslogado', async () => {
    await useAuth.getState().bootstrap();
    expect(useAuth.getState().status).toBe('signedOut');
  });

  it('login salva os tokens e entra', async () => {
    mockedAuthApi.login.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 'user-1', email: 'bernardo@example.com' },
    });

    await useAuth.getState().signIn({ email: 'bernardo@example.com', password: 'securePass123' });

    expect(useAuth.getState()).toMatchObject({ status: 'signedIn', accessToken: 'access', userId: 'user-1' });
    expect(mockMemory.get('verdant.refreshToken')).toBe('refresh');
  });

  it('restaura a sessão salva ao abrir o app', async () => {
    mockMemory.set('verdant.accessToken', 'access');
    mockMemory.set('verdant.refreshToken', 'refresh');
    mockMemory.set('verdant.userId', 'user-1');

    await useAuth.getState().bootstrap();

    expect(useAuth.getState()).toMatchObject({ status: 'signedIn', userId: 'user-1' });
  });

  it('logout avisa a API e limpa tudo, mesmo se a API falhar', async () => {
    mockMemory.set('verdant.accessToken', 'access');
    mockMemory.set('verdant.refreshToken', 'refresh');
    mockMemory.set('verdant.userId', 'user-1');
    await useAuth.getState().bootstrap();
    mockedAuthApi.logout.mockRejectedValue(new Error('offline'));

    await useAuth.getState().signOut();

    expect(mockedAuthApi.logout).toHaveBeenCalled();
    expect(useAuth.getState().status).toBe('signedOut');
    expect(mockMemory.size).toBe(0);
  });

  it('setTokens troca o par de tokens (refresh)', async () => {
    await useAuth.getState().setTokens({ access_token: 'a2', refresh_token: 'r2' });
    expect(useAuth.getState()).toMatchObject({ accessToken: 'a2', refreshToken: 'r2' });
    expect(mockMemory.get('verdant.accessToken')).toBe('a2');
  });
});
