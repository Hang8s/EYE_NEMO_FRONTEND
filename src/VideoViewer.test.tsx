// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AttachmentView } from './AttachmentView';
import { mediaBlob } from './media-cache';
import type { Attachment } from './types';
import { StrictMode } from 'react';
import { MediaViewer } from './MediaViewer';

vi.mock('./media-cache', () => ({ mediaBlob: vi.fn() }));
const file: Attachment = { id: 'video', type: 'video', available: true, saved_by_reply: false };

beforeEach(() => {
  vi.mocked(mediaBlob).mockResolvedValue(new Blob(['video'], { type: 'video/mp4' }));
  URL.createObjectURL = vi.fn(() => 'blob:video');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open'); } });
});

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks(); });

async function openVideo(attachment = file, compact = false) {
  const view = render(<AttachmentView file={attachment} compact={compact} />);
  expect(mediaBlob).not.toHaveBeenCalled();
  const trigger = screen.getByRole('button', { name: 'Відкрити відео повністю' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Перегляд відео' });
  return { view, trigger, dialog };
}

it.each([
  ['video', undefined, 'video.mp4'],
  ['video_note', undefined, 'video_note.mp4'],
  ['animation', 'video/mp4', 'animation.mp4'],
  ['document', 'video/webm', 'video.webm'],
])('opens %s on demand with native controls and downloads the same bytes', async (type, mime_type, name) => {
  const { dialog, trigger } = await openVideo({ ...file, type: type!, mime_type });
  const video = dialog.querySelector('video')!;
  expect(video.controls).toBe(true);
  expect(video.playsInline).toBe(true);
  expect(video.autoplay).toBe(false);
  expect(video.getAttribute('src')).toBe('blob:video');
  const download = screen.getByRole('link', { name: '↓ Скачати' });
  expect(download.getAttribute('href')).toBe('blob:video');
  expect(download.getAttribute('download')).toBe(name);
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  video.dispatchEvent(tab);
  expect(tab.defaultPrevented).toBe(false);
  fireEvent.click(video);
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Закрити відео' }));
  expect(video.pause).toHaveBeenCalled();
  expect(video.hasAttribute('src')).toBe(false);
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(mediaBlob).toHaveBeenCalledTimes(1);
});

it('supports compact reply cards and preserves filenames and the bookmark badge', async () => {
  await openVideo({ ...file, file_name: 'holiday.mp4', saved_by_reply: true }, true);
  expect(screen.getByText('Збережено reply')).toBeTruthy();
  expect(screen.getByRole('link').getAttribute('download')).toBe('holiday.mp4');
});

it.each(['escape', 'background'])('closes via %s and restores scroll and focus', async method => {
  document.body.style.overflow = 'auto';
  const { trigger, dialog } = await openVideo();
  expect(document.body.style.overflow).toBe('hidden');
  if (method === 'escape') fireEvent(dialog, new Event('cancel', { cancelable: true, bubbles: true }));
  else fireEvent.click(dialog);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.body.style.overflow).toBe('auto');
  expect(document.activeElement).toBe(trigger);
  document.body.style.overflow = '';
});

it('keeps download available when the video codec cannot be played', async () => {
  const { dialog } = await openVideo();
  fireEvent.error(dialog.querySelector('video')!);
  expect(screen.getByRole('alert').textContent).toContain('Не вдалося показати відео');
  expect(screen.getByRole('link').getAttribute('href')).toBe('blob:video');
});

it('closes and releases resources at expiry', async () => {
  vi.useFakeTimers();
  const view = render(<AttachmentView file={{ ...file, expires_at: new Date(Date.now() + 10_000).toISOString() }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Відкрити відео повністю' }));
  await act(async () => {});
  const video = screen.getByRole('dialog').querySelector('video')!;
  act(() => { vi.advanceTimersByTime(10_000); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(view.getByText('Строк зберігання завершено')).toBeTruthy();
  expect(video.pause).toHaveBeenCalled();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:video');
});

it('stops playback and releases the URL on unmount', async () => {
  const { view, dialog } = await openVideo();
  const video = dialog.querySelector('video')!;
  view.unmount();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(video.pause).toHaveBeenCalled();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:video');
});

it.each([false, true])('does not fetch unavailable or expired video (expired=%s)', async expired => {
  render(<AttachmentView file={{ ...file, available: expired, expires_at: expired ? new Date(Date.now() - 1000).toISOString() : undefined }} />);
  await act(async () => {});
  expect(screen.queryByRole('button')).toBeNull();
  expect(mediaBlob).not.toHaveBeenCalled();
});

it('reports download failure without opening the viewer', async () => {
  vi.mocked(mediaBlob).mockRejectedValue(new Error('unavailable'));
  render(<AttachmentView file={file} />);
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText('Файл недоступний')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('aborts an unfinished download when the card unmounts', async () => {
  vi.mocked(mediaBlob).mockImplementation(() => new Promise(() => {}));
  const view = render(<AttachmentView file={file} />);
  fireEvent.click(screen.getByRole('button'));
  const signal = vi.mocked(mediaBlob).mock.calls[0][1];
  view.unmount();
  expect(signal.aborted).toBe(true);
});

it('keeps focus on the loading card and ignores repeated clicks', async () => {
  let finish!: (blob: Blob) => void;
  vi.mocked(mediaBlob).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<AttachmentView file={file} />);
  const trigger = screen.getByRole('button');
  trigger.focus();
  fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-disabled')).toBe('true');
  expect(trigger.hasAttribute('disabled')).toBe(false);
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);
  expect(mediaBlob).toHaveBeenCalledTimes(1);
  await act(async () => { finish(new Blob(['video'])); });
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Закрити відео' }));
  expect(document.activeElement).toBe(trigger);
});

it.each(['image/gif', undefined])('opens GIF animations as images without automatic downloading (%s)', async mime_type => {
  render(<AttachmentView file={{ ...file, type: 'animation', mime_type, file_name: 'reaction.gif' }} />);
  expect(mediaBlob).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Відкрити анімацію повністю' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog.querySelector('img')).toBeTruthy();
  expect(dialog.querySelector('video')).toBeNull();
  expect(screen.getByRole('link').getAttribute('download')).toBe('reaction.gif');
});

it('retains the video source when Strict Mode replays effects', () => {
  render(<StrictMode><MediaViewer video url="blob:video" fileName="video.mp4" onClose={() => {}} /></StrictMode>);
  expect(screen.getByRole('dialog').querySelector('video')?.getAttribute('src')).toBe('blob:video');
});
