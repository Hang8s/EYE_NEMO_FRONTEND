// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useArchiveMessages, MAX_MESSAGES } from './useArchiveMessages';
import type { Message } from '../types';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const chat = { id: 'chat', title: 'Chat', chat_type: 'private', updated_at: '' };
const message = (id: number): Message => ({ id: String(id), chat_id: 'chat', telegram_message_id: id, has_reply: false, text: String(id), message_type: 'text',
  sent_at: '2026-10-07T10:00:00Z', sender_name: 'Sender', is_outgoing: false, is_deleted: false, attachments: [] });

it('bounds retained pages, advances the older cursor and can return to the latest window', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const hook = renderHook(() => useArchiveMessages(() => {}));
  for (let page = 0; page < 12; page += 1) {
    const items = Array.from({ length: 50 }, (_, index) => message(1000 - page * 50 + index));
    await act(async () => { await hook.result.current.loadMessages(chat, async () => ({ items, next_cursor: `cursor-${page}` }), page > 0); });
  }
  expect(hook.result.current.messages).toHaveLength(MAX_MESSAGES);
  expect(hook.result.current.messageCursor).toBe('cursor-11');
  expect(hook.result.current.hasTrimmedNewer).toBe(true);
  expect(hook.result.current.messages.some(item => item.id === '1049')).toBe(false);
  await act(async () => { await hook.result.current.loadMessages(chat, async () => ({ items: [message(1049)], next_cursor: 'start' })); });
  expect(hook.result.current.messages.map(item => item.id)).toEqual(['1049']);
  expect(hook.result.current.hasTrimmedNewer).toBe(false);
});
