import { api } from '../api';
import type { ChatPage, MessagePage, SearchResults } from '../types';

export const archive = {
  chats: (cursor: string | null, signal: AbortSignal, query = '') =>
    api<ChatPage>(`/mini-api/chats?${new URLSearchParams({ ...(cursor ? { cursor } : {}), ...(query ? { q: query } : {}) })}`, signal),
  messages: (chatId: string, cursor: string | null, signal: AbortSignal, target?: { around?: string; at?: string }) => {
    const params = new URLSearchParams(cursor ? { cursor } : target as Record<string, string>);
    return api<MessagePage>(`/mini-api/chats/${chatId}/messages?${params}`, signal);
  },
  search: (query: string, signal: AbortSignal, chatId?: string, filters: Record<string, string> = {}) =>
    api<SearchResults>(`/mini-api/search?q=${encodeURIComponent(query)}${chatId ? `&chat_id=${encodeURIComponent(chatId)}` : ''}&${new URLSearchParams(filters)}`, signal),
};

export function unique<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map(item => [item.id, item])).values()];
}
