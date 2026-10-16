// @vitest-environment jsdom
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AttachmentView, mediaFileName } from './AttachmentView';
import { MessageRow } from './MessageRow';
import { mediaBlob } from './media-cache';
import type { Attachment } from './types';

vi.mock('./media-cache', () => ({ mediaBlob: vi.fn() }));
const file: Attachment = { id: 'voice', type: 'voice', available: true, saved_by_reply: false };

beforeEach(() => {
  vi.mocked(mediaBlob).mockResolvedValue(new Blob(['voice'], { type: 'audio/ogg' }));
  URL.createObjectURL = vi.fn(() => 'blob:voice');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks(); });

async function openVoice(attachment = file, compact = false) {
  const view = render(<AttachmentView file={attachment} compact={compact} />);
  expect(mediaBlob).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Прослухати голосове' }));
  const audio = await screen.findByLabelText<HTMLAudioElement>('Голосове повідомлення');
  return { view, audio };
}

it.each([false, true])('loads voice on demand and plays inline (compact=%s)', async compact => {
  const { audio } = await openVoice({ ...file, saved_by_reply: true }, compact);
  expect(audio.tagName).toBe('AUDIO');
  expect(audio.controls).toBe(true);
  expect(audio.autoplay).toBe(false);
  expect(audio.getAttribute('src')).toBe('blob:voice');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByText('Збережено reply')).toBeTruthy();
  const download = screen.getByRole('link', { name: '↓ Скачати' });
  expect(download.getAttribute('href')).toBe('blob:voice');
  expect(download.getAttribute('download')).toBe('voice.ogg');
  expect(mediaBlob).toHaveBeenCalledTimes(1);
});

it.each([[undefined, 'voice.ogg'], ['audio/mpeg', 'voice.mp3'], ['audio/mp4', 'voice.m4a'], ['audio/webm', 'voice.webm'], ['audio/ogg; codecs=opus', 'voice.ogg']])('uses the MIME filename fallback (%s)', (mime_type, name) => {
  expect(mediaFileName({ ...file, mime_type })).toBe(name);
});

it('preserves a supplied filename', async () => {
  await openVoice({ ...file, file_name: 'recording.ogg' });
  expect(screen.getByRole('link').getAttribute('download')).toBe('recording.ogg');
});

it.each(['', 'application/octet-stream'])('supplies the legacy voice MIME without changing bytes (%s)', async type => {
  const original = new Blob(['voice'], { type });
  vi.mocked(mediaBlob).mockResolvedValue(original);
  await openVoice();
  const playable = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
  expect(playable.type).toBe('audio/ogg');
  expect(playable.size).toBe(original.size);
});

it('keeps download available after a playback error', async () => {
  const { audio } = await openVoice();
  fireEvent.error(audio);
  expect(screen.getByRole('alert').textContent).toContain('Не вдалося відтворити голосове');
  expect(screen.getByRole('link').getAttribute('href')).toBe('blob:voice');
  expect(audio.pause).toHaveBeenCalled();
  expect(audio.hasAttribute('src')).toBe(false);
});

it('releases playback and object URL on unmount', async () => {
  const { view, audio } = await openVoice();
  view.unmount();
  expect(audio.pause).toHaveBeenCalled();
  expect(audio.hasAttribute('src')).toBe(false);
  expect(audio.load).toHaveBeenCalled();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:voice');
});

it('stops playback at expiry', async () => {
  vi.useFakeTimers();
  render(<AttachmentView file={{ ...file, expires_at: new Date(Date.now() + 1000).toISOString() }} />);
  fireEvent.click(screen.getByRole('button'));
  await act(async () => {});
  const audio = screen.getByLabelText('Голосове повідомлення');
  act(() => { vi.advanceTimersByTime(1000); });
  expect(screen.queryByLabelText('Голосове повідомлення')).toBeNull();
  expect(screen.getByText('Строк зберігання завершено')).toBeTruthy();
  expect(audio.hasAttribute('src')).toBe(false);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:voice');
});

it.each([false, true])('does not download unavailable or expired voice (%s)', async expired => {
  render(<AttachmentView file={{ ...file, available: expired, expires_at: expired ? new Date(Date.now() - 1000).toISOString() : undefined }} />);
  await act(async () => {});
  expect(screen.queryByRole('button')).toBeNull();
  expect(mediaBlob).not.toHaveBeenCalled();
});

it('reports a download failure', async () => {
  vi.mocked(mediaBlob).mockRejectedValue(new Error('unavailable'));
  render(<AttachmentView file={file} />);
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText('Файл недоступний')).toBeTruthy();
  expect(screen.queryByLabelText('Голосове повідомлення')).toBeNull();
});

it('ignores repeated loading clicks and aborts when unmounted', async () => {
  vi.mocked(mediaBlob).mockImplementation(() => new Promise(() => {}));
  const view = render(<AttachmentView file={file} />);
  const button = screen.getByRole('button');
  button.focus();
  fireEvent.click(button);
  fireEvent.click(button);
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect(document.activeElement).toBe(button);
  expect(mediaBlob).toHaveBeenCalledTimes(1);
  const signal = vi.mocked(mediaBlob).mock.calls[0][1];
  view.unmount();
  expect(signal.aborted).toBe(true);
});

it('restores the audio source under Strict Mode', async () => {
  render(<StrictMode><AttachmentView file={file} /></StrictMode>);
  fireEvent.click(screen.getByRole('button'));
  const audio = await screen.findByLabelText('Голосове повідомлення');
  expect(audio.getAttribute('src')).toBe('blob:voice');
});

it('keeps regular audio attachments as files', async () => {
  render(<AttachmentView file={{ ...file, type: 'audio', mime_type: 'audio/mpeg' }} />);
  fireEvent.click(screen.getByRole('button'));
  await screen.findByRole('link');
  expect(screen.queryByLabelText('Голосове повідомлення')).toBeNull();
});

it('plays voice from a message version and reports loaded metadata to history', async () => {
  const onImageLoad = vi.fn();
  render(<MessageRow message={{
    id: 'message', chat_id: 'chat', telegram_message_id: 1, has_reply: false,
    message_type: 'voice', sent_at: '2026-10-06T10:00:00Z', sender_name: 'Sender',
    is_outgoing: false, is_deleted: false, attachments: [],
    versions: [{ id: 'original', kind: 'original', message_type: 'voice', observed_at: '2026-10-06T10:00:00Z', attachments: [file] }],
  }} onImageLoad={onImageLoad} />);
  const details = screen.getByText('Історія змін · 1').closest('details')!;
  details.open = true;
  fireEvent(details, new Event('toggle'));
  fireEvent.click(screen.getByRole('button', { name: 'Прослухати голосове' }));
  const audio = await screen.findByLabelText('Голосове повідомлення');
  expect(audio.closest('.message-version')).toBeTruthy();
  fireEvent.loadedMetadata(audio);
  expect(onImageLoad).toHaveBeenCalledOnce();
});
