import { api } from '../api';
import type { ChatPage, MessagePage, SearchResults } from '../types';

export const archive = {
  chats: (cursor: string | null, signal: AbortSignal) =>
    api<ChatPage>(`/mini-api/chats${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, signal),
  messages: (chatId: string, cursor: string | null, signal: AbortSignal) =>
    api<MessagePage>(`/mini-api/chats/${chatId}/messages${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, signal),
  search: (query: string, signal: AbortSignal) =>
    api<SearchResults>(`/mini-api/search?q=${encodeURIComponent(query)}`, signal),
};

export function unique<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map(item => [item.id, item])).values()];
}
