import type { Message } from '@/api/types';

import { flattenMessages, prependMessage, type MessagePages } from '../messages-cache';

const message = (id: string, content = id): Message => ({
  _id: id,
  sender: 'me',
  conversationId: 'c1',
  content,
  sentAt: '2026-06-15T12:00:00.000Z',
});

const pages = (...groups: Message[][]): MessagePages => ({
  pages: groups,
  pageParams: groups.map((_, index) => index * 30),
});

describe('💬 cache de mensagens', () => {
  it('coloca a mensagem nova no topo da primeira página', () => {
    const data = pages([message('2'), message('1')], [message('0')]);
    const result = prependMessage(data, message('3'));

    expect(flattenMessages(result).map(m => m._id)).toEqual(['3', '2', '1', '0']);
  });

  it('ignora mensagem repetida (chegou pelo socket e pelo HTTP)', () => {
    const data = pages([message('2'), message('1')]);
    expect(prependMessage(data, message('1'))).toBe(data);
  });

  it('não cria cache que ainda não existe', () => {
    expect(prependMessage(undefined, message('1'))).toBeUndefined();
  });

  it('flatten retorna lista vazia sem dados', () => {
    expect(flattenMessages(undefined)).toEqual([]);
  });
});
