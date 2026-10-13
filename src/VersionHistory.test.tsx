// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MessageRow } from './MessageRow';
import type { Message } from './types';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const message: Message = { id: 'message', chat_id: 'chat', telegram_message_id: 1, has_reply: false, text: 'current text', message_type: 'text',
  sent_at: '2026-10-07T10:00:00Z', sender_name: 'Sender', is_outgoing: false, is_deleted: false, attachments: [], version_count: 61, has_original: true };
const version = (id: string, text: string) => ({ id, kind: 'edit', text, observed_at: '2026-10-07T10:00:00Z', attachments: [] });

it('loads history only after opening and replaces each page instead of accumulating text', async () => {
  const fetch = vi.fn((url: string) => Promise.resolve({ ok: true, json: async () => ({ items: [version(url.includes('cursor=next') ? 'second' : 'first', url.includes('cursor=next') ? 'older page gone' : 'first history page')],
    next_cursor: url.includes('cursor=next') ? null : 'next', version_count: 61, has_original: true, current_version_id: 'current' }) }));
  vi.stubGlobal('fetch', fetch);
  const view = render(<MessageRow message={message} onImageLoad={() => {}} />);
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByText('current text')).toBeTruthy();
  const details = view.container.querySelector('details')!;
  details.open = true;
  fireEvent(details, new Event('toggle'));
  await screen.findByText('first history page');
  fireEvent.click(screen.getByText('Наступні версії'));
  await screen.findByText('older page gone');
  expect(screen.queryByText('first history page')).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByText('На початок історії'));
  await screen.findByText('first history page');
  details.open = false;
  fireEvent(details, new Event('toggle'));
  await waitFor(() => expect(screen.queryByText('first history page')).toBeNull());
});
