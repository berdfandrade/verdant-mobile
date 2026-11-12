import type { InfiniteData } from '@tanstack/react-query';

import type { Message } from '@/api/types';

export type MessagePages = InfiniteData<Message[]>;

/*
  Coloca uma mensagem nova no topo da primeira página (as páginas vêm
  da mais recente para a mais antiga). Ignora duplicadas (mesmo _id),
  que acontecem quando a mensagem chega pelo socket e pela resposta HTTP.
*/
export function prependMessage(data: MessagePages | undefined, message: Message): MessagePages | undefined {
  if (!data) return data;

  const exists = data.pages.some(page => page.some(m => m._id === message._id));
  if (exists) return data;

  const [first = [], ...rest] = data.pages;
  return { ...data, pages: [[message, ...first], ...rest] };
}

export function flattenMessages(data: MessagePages | undefined): Message[] {
  return data?.pages.flat() ?? [];
}
