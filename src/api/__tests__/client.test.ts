import axios, { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

import { createApiClient, getErrorMessage, type TokenHandlers } from '../client';

const BASE = 'http://api.test';

// Adapter falso: responde 401 para tokens "expirados" e 200 para o token novo
function fakeAdapter(validToken: string, seenAuth: unknown[]): jest.MockedFunction<AxiosAdapter> {
  return jest.fn(async (config: InternalAxiosRequestConfig) => {
    const auth = config.headers.get('Authorization');
    seenAuth.push(auth);
    if (auth === `Bearer ${validToken}`) {
      return { data: { ok: true, url: config.url }, status: 200, statusText: 'OK', headers: {}, config };
    }
    const response = { data: { statusCode: 401, message: 'Unauthorized' }, status: 401, statusText: 'Unauthorized', headers: {}, config };
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response);
  });
}

function setup({ refreshOk = true } = {}) {
  let access = 'expired-token';
  let refresh: string | null = 'refresh-1';

  const handlers: jest.Mocked<TokenHandlers> = {
    getAccessToken: jest.fn(() => access),
    getRefreshToken: jest.fn(() => refresh),
    onTokensRefreshed: jest.fn(async (tokens: { access_token: string; refresh_token: string }) => {
      access = tokens.access_token;
      refresh = tokens.refresh_token;
    }),
    onSessionExpired: jest.fn(async () => {
      refresh = null;
    }),
  };

  const refreshSpy = jest.spyOn(axios, 'post').mockImplementation(async () => {
    if (!refreshOk) throw new Error('refresh falhou');
    return { data: { access_token: 'new-token', refresh_token: 'refresh-2' } };
  });

  const { client, setTokenHandlers } = createApiClient(BASE);
  const seenAuth: unknown[] = [];
  const adapter = fakeAdapter('new-token', seenAuth);
  client.defaults.adapter = adapter;
  setTokenHandlers(handlers);

  return { client, handlers, refreshSpy, seenAuth };
}

afterEach(() => jest.restoreAllMocks());

describe('🔁 cliente HTTP', () => {
  it('envia o access token no header', async () => {
    const { client, seenAuth } = setup();
    await client.get('/users/me');

    // 1ª tentativa com o token antigo, 2ª (depois do refresh) com o novo
    expect(seenAuth).toEqual(['Bearer expired-token', 'Bearer new-token']);
  });

  it('em 401 troca o refresh token e repete a requisição', async () => {
    const { client, handlers, refreshSpy } = setup();

    const response = await client.get('/users/me');

    expect(response.status).toBe(200);
    expect(refreshSpy).toHaveBeenCalledWith(`${BASE}/login/refresh`, { refresh_token: 'refresh-1' }, expect.anything());
    expect(handlers.onTokensRefreshed).toHaveBeenCalledWith({ access_token: 'new-token', refresh_token: 'refresh-2' });
    expect(handlers.onSessionExpired).not.toHaveBeenCalled();
  });

  it('faz um único refresh para várias requisições que falham juntas', async () => {
    const { client, refreshSpy } = setup();

    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);

    expect(results.map(r => r.status)).toEqual([200, 200, 200]);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('desloga quando o refresh falha', async () => {
    const { client, handlers } = setup({ refreshOk: false });

    await expect(client.get('/users/me')).rejects.toBeInstanceOf(AxiosError);
    expect(handlers.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('não tenta refresh no próprio login', async () => {
    const { client, refreshSpy } = setup();

    await expect(client.post('/login', { email: 'a@b.com', password: 'x' })).rejects.toBeInstanceOf(AxiosError);
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});

describe('🧾 getErrorMessage', () => {
  const axiosError = (data: unknown, status = 400) => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    return new AxiosError('fail', 'ERR', config, null, { data, status, statusText: '', headers: {}, config });
  };

  it('traduz mensagens conhecidas da API', () => {
    expect(getErrorMessage(axiosError({ message: 'Email already registered' }, 409))).toBe('Este e-mail já está cadastrado.');
    expect(getErrorMessage(axiosError({ message: 'Wrong email or password' }, 401))).toBe('E-mail ou senha incorretos.');
  });

  it('mantém mensagens desconhecidas da API', () => {
    expect(getErrorMessage(axiosError({ message: 'Something new' }))).toBe('Something new');
  });

  it('usa a primeira mensagem de validação', () => {
    expect(getErrorMessage(axiosError({ message: ['email must be an email', 'outra'] }))).toBe('email must be an email');
  });

  it('avisa quando não há resposta (sem rede)', () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    expect(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK', config))).toBe('Não foi possível conectar ao servidor.');
  });
});
