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

it('retries the submitted search even when the input has changed', async () => {
  const fetch = vi.fn((url: string) => Promise.resolve(url.includes('/search')
    ? { ok: false, status: 503 }
    : response([chat('a')])));
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  await screen.findByText('Chat a');
  const input = screen.getByLabelText('Пошук повідомлень');
  fireEvent.change(input, { target: { value: ' original & query ' } });
  fireEvent.submit(input.closest('form')!);
  await screen.findByText('Спробувати ще раз');
  fireEvent.change(input, { target: { value: 'changed' } });
  fetch.mockImplementation((url: string) => Promise.resolve(url.includes('/search')
    ? response([message('found')])
    : response([chat('a')])));
  fireEvent.click(screen.getByText('Спробувати ще раз'));
  await screen.findByText('Message found');
  const searches = fetch.mock.calls.filter(([url]) => url.includes('/search'));
  expect(searches).toHaveLength(2);
  expect(searches[0][0]).toBe(searches[1][0]);
  expect(new URL(searches[1][0]).searchParams.get('q')).toBe('original & query');
  fireEvent.click(screen.getByLabelText('До списку чатів'));
  expect((input as HTMLInputElement).value).toBe('');
  expect(screen.getByText('Chat a')).toBeTruthy();
});

it('aborts an active message request on unmount', async () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal('fetch', vi.fn((url: string, options: RequestInit) => {
    if (url.includes('/chats/a/')) {
      signal = options.signal as AbortSignal;
      return new Promise(() => {});
    }
    return Promise.resolve(response([chat('a')]));
  }));
  const view = render(<App />);
  fireEvent.click(await screen.findByText('Chat a'));
  expect(signal?.aborted).toBe(false);
  view.unmount();
  expect(signal?.aborted).toBe(true);
});

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
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'https://store.private.blob.vercel-storage.com/file', direct: true, valid_until: null }), blob: async () => new Blob(['document']) });
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

it('scopes search to the selected chat, highlights results and opens their context', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
  const found = { ...message('found'), chat_id: 'a', chat_title: 'Chat a', text: 'A needle in history', match_text: 'A needle in history' };
  const fetch = vi.fn((url: string) => Promise.resolve(url.includes('/search') ? response([found]) : url.includes('/messages') ? response([found]) : response([chat('a')])));
  vi.stubGlobal('fetch', fetch);
  const view = render(<App />);
  fireEvent.click(await screen.findByText('Chat a'));
  await screen.findByText('A needle in history');
  fireEvent.click(screen.getByText('У цьому чаті'));
  fireEvent.change(screen.getByLabelText('Пошук повідомлень'), { target: { value: 'needle' } });
  fireEvent.click(screen.getByText('Знайти'));
  fireEvent.click(await screen.findByText('Відкрити в розмові →'));
  await waitFor(() => expect(view.container.querySelector('.focused-message')?.getAttribute('data-message-id')).toBe('found'));
  const searchUrl = new URL(fetch.mock.calls.find(([url]) => url.includes('/search'))![0]);
  expect(searchUrl.searchParams.get('chat_id')).toBe('a');
  expect(fetch.mock.calls.some(([url]) => new URL(url).searchParams.get('around') === 'found')).toBe(true);
  fireEvent.click(screen.getByText('До результатів пошуку'));
  expect(await screen.findByText('Відкрити в розмові →')).toBeTruthy();
  expect(view.container.querySelector('mark')?.textContent).toBe('needle');
  fireEvent.click(screen.getByText('У всьому архіві'));
  fireEvent.click(screen.getByText('Знайти'));
  await waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.includes('/search'))).toHaveLength(2));
  const searches = fetch.mock.calls.filter(([url]) => url.includes('/search'));
  expect(new URL(searches[1][0]).searchParams.has('chat_id')).toBe(false);
});

it('offers an explicit empty-search state and clears it', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(url.includes('/search') ? response([]) : response([chat('a')]))));
  render(<App />);
  await screen.findByText('Chat a');
  fireEvent.change(screen.getByLabelText('Пошук повідомлень'), { target: { value: 'missing' } });
  fireEvent.click(screen.getByText('Знайти'));
  expect(await screen.findByText('За запитом “missing” нічого не знайдено')).toBeTruthy();
  fireEvent.click(screen.getByText('Очистити пошук'));
  expect((screen.getByLabelText('Пошук повідомлень') as HTMLInputElement).value).toBe('');
  expect(screen.getByText('Chat a')).toBeTruthy();
});

it('restores an older history window after returning to the chat list', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
  const fetch = vi.fn((url: string) => Promise.resolve(url.includes('cursor=') ? response([message('old')]) : url.includes('/messages') ? response([message('new')], 'older') : response([chat('a')])));
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  fireEvent.click(await screen.findByText('Chat a'));
  fireEvent.click(await screen.findByText('Старіші повідомлення'));
  await screen.findByText('Message old');
  const count = fetch.mock.calls.length;
  fireEvent.click(screen.getByLabelText('До списку чатів'));
  fireEvent.click(screen.getByText('Chat a'));
  expect(await screen.findByText('Message old')).toBeTruthy();
  expect(screen.getByText('Message new')).toBeTruthy();
  expect(fetch.mock.calls).toHaveLength(count);
});

it('jumps to a date and can load the latest messages again', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
  const fetch = vi.fn((url: string) => Promise.resolve(url.includes('/messages') ? response([message('new')]) : response([chat('a')])));
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  fireEvent.click(await screen.findByText('Chat a'));
  await screen.findByText('Message new');
  expect(screen.queryByLabelText('Перейти до дати')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Відкрити календар' }));
  fireEvent.change(screen.getByLabelText('Перейти до дати'), { target: { value: '2026-01-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Перейти' }));
  fireEvent.click(await screen.findByText('↓ До останніх'));
  await waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.includes('/messages'))).toHaveLength(3));
  const requests = fetch.mock.calls.filter(([url]) => url.includes('/messages'));
  expect(new URL(requests[1][0]).searchParams.has('at')).toBe(true);
  expect(new URL(requests[2][0]).searchParams.has('at')).toBe(false);
});

it('defaults to chat scope and combines quick filters without a text query', async () => {
  vi.stubGlobal('scrollTo', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
  const fetch = vi.fn((url: string) => Promise.resolve(url.includes('/search') ? response([]) : url.includes('/messages') ? response([message('one')]) : response([chat('a')])));
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  fireEvent.click(await screen.findByText('Chat a'));
  expect(screen.getByText('У цьому чаті').getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Фото' }));
  await screen.findByText('За вибраними фільтрами нічого не знайдено');
  fireEvent.click(screen.getByRole('button', { name: 'Редаговані' }));
  await waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.includes('/search'))).toHaveLength(2));
  const url = new URL(fetch.mock.calls.filter(([url]) => url.includes('/search'))[1][0]);
  expect(url.searchParams.get('chat_id')).toBe('a');
  expect(url.searchParams.get('content_type')).toBe('photo');
  expect(url.searchParams.get('edited')).toBe('true');
});

it('filters chat names on the server separately from message text', async () => {
  const fetch = vi.fn((url: string) => Promise.resolve(response(new URL(url).searchParams.get('q') === 'missing' ? [] : [chat('a')])));
  vi.stubGlobal('fetch', fetch);
  render(<App />);
  await screen.findByText('Chat a');
  fireEvent.change(screen.getByLabelText('Назва чату'), { target: { value: 'missing' } });
  await screen.findByText('Чатів не знайдено');
  await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('/chats?') && new URL(url).searchParams.get('q') === 'missing')).toBe(true));
  expect(fetch.mock.calls.some(([url]) => url.includes('/search'))).toBe(false);
});
