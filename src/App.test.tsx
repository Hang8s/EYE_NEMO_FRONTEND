// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';
import { AttachmentView } from './AttachmentView';
import { clearMediaCache } from './media-cache';

afterEach(() => { cleanup(); clearMediaCache(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const response = (items: unknown[], next_cursor: string | null = null) => ({ ok: true, json: async () => ({ items, next_cursor }) });
const chat = (id: string) => ({ id, title: `Chat ${id}`, chat_type: 'private', updated_at: '2026-01-01T00:00:00Z' });
const message = (id: string) => ({ id, text: `Message ${id}`, sent_at: '2026-01-01T00:00:00Z', sender_name: 'Sender', message_type: 'text', is_deleted: false, is_outgoing: false, attachments: [] });

it('ignores a slow response after switching to another chat', async () => {
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { callback(); return 1; });
  Element.prototype.scrollIntoView = vi.fn();
  let finish!: (value: unknown) => void;
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/chats/a/')) return new Promise(resolve => { finish = resolve; });
    if (url.includes('/chats/b/')) return Promise.resolve(response([message('b')]));
    return Promise.resolve(response([chat('a'), chat('b')]));
  }));
  render(<App />);
  fireEvent.click(await screen.findByText('Chat a'));
  fireEvent.click(screen.getByLabelText('До списку чатів'));
  fireEvent.click(screen.getByText('Chat b'));
  expect(await screen.findByText('Message b')).toBeTruthy();
  await act(async () => { finish(response([message('a')])); });
  expect(screen.queryByText('Message a')).toBeNull();
  expect(screen.getByText('Message b')).toBeTruthy();
});

it('loads older messages without duplicating records or jumping to the bottom', async () => {
  const scroll = vi.fn(); vi.stubGlobal('scrollTo', scroll);
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('cursor=') ? response([message('old'), message('new')]) : url.includes('/chats/a/') ? response([message('new')], 'cursor') : response([chat('a')]))));
  render(<App />);
  fireEvent.click(await screen.findByText('Chat a'));
  await screen.findByText('Message new');
  fireEvent.click(screen.getByText('Старіші повідомлення'));
  await screen.findByText('Message old');
  expect(screen.getAllByText('Message new')).toHaveLength(1);
  expect(scroll).toHaveBeenCalled();
});

it('downloads documents only on click and releases object URLs', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['document']) });
  vi.stubGlobal('fetch', fetch);
  const create = vi.fn().mockReturnValue('blob:document');
  const revoke = vi.fn();
  URL.createObjectURL = create; URL.revokeObjectURL = revoke;
  const view = render(<AttachmentView file={{ id: 'doc', type: 'document', file_name: 'report.pdf', available: true, saved_by_reply: false }} />);
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(screen.getByRole('link').getAttribute('href')).toBe('blob:document'));
  view.unmount();
  expect(revoke).toHaveBeenCalledWith('blob:document');
});

it('does not automatically download image documents', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  render(<AttachmentView file={{ id: 'png', type: 'document', mime_type: 'image/png', available: true, saved_by_reply: false }} />);
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('button')).toBeTruthy();
});
it('shows expired files without fetching their bytes', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  render(<AttachmentView file={{ id: 'expired', type: 'photo', available: true, saved_by_reply: false, expires_at: new Date(Date.now() - 1000).toISOString() }} />);
  expect(screen.getByText('Строк зберігання завершено')).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});
