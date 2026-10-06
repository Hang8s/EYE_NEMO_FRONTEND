// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AttachmentView } from './AttachmentView';
import { mediaBlob } from './media-cache';
import type { Attachment } from './types';

vi.mock('./media-cache', () => ({ mediaBlob: vi.fn() }));
const file: Attachment = { id: 'photo', type: 'photo', available: true, saved_by_reply: false, file_name: 'holiday.jpg' };

beforeEach(() => {
  vi.mocked(mediaBlob).mockResolvedValue(new Blob(['photo'], { type: 'image/jpeg' }));
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
  // jsdom does not implement the browser's top layer or native dialog focus trap.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open'); } });
});

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); document.body.style.overflow = ''; document.documentElement.style.overflow = ''; });

async function openPhoto(attachment = file, compact = false) {
  const view = render(<AttachmentView file={attachment} compact={compact} />);
  const trigger = await screen.findByRole('button', { name: 'Відкрити фото повністю' });
  trigger.focus();
  fireEvent.click(trigger);
  return { view, trigger, dialog: screen.getByRole('dialog', { name: 'Перегляд фото' }) };
}

it('opens a portal and downloads the loaded photo without fetching it again', async () => {
  const { view, dialog } = await openPhoto();
  expect(view.container.contains(dialog)).toBe(false);
  expect(dialog.parentElement).toBe(document.body);
  const download = screen.getByRole('link', { name: '↓ Скачати' });
  expect(download.getAttribute('href')).toBe('blob:photo');
  expect(download.getAttribute('download')).toBe('holiday.jpg');
  expect(mediaBlob).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
  expect(document.activeElement).toBe(download);
  fireEvent.keyDown(download, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрити фото' }));
  fireEvent.click(dialog.querySelector('img')!);
  expect(screen.getByRole('dialog')).toBeTruthy();
});

it.each(['button', 'escape', 'background'])('closes with %s and restores focus and scroll styles', async method => {
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'scroll';
  const { trigger, dialog } = await openPhoto();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрити фото' }));
  expect(document.body.style.overflow).toBe('hidden');
  expect(document.documentElement.style.overflow).toBe('hidden');
  if (method === 'button') fireEvent.click(screen.getByRole('button', { name: 'Закрити фото' }));
  else if (method === 'escape') fireEvent(dialog, new Event('cancel', { cancelable: true, bubbles: true }));
  else fireEvent.click(dialog);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(document.body.style.overflow).toBe('auto');
  expect(document.documentElement.style.overflow).toBe('scroll');
});

it('opens reply thumbnails and uses the default download filename', async () => {
  await openPhoto({ ...file, file_name: undefined, saved_by_reply: true }, true);
  expect(screen.getByRole('link').getAttribute('download')).toBe('photo.jpg');
  expect(screen.getByText('Збережено reply')).toBeTruthy();
});

it('shows a display error while keeping download and close available', async () => {
  const { dialog } = await openPhoto();
  fireEvent.error(dialog.querySelector('img')!);
  expect(screen.getByRole('alert').textContent).toContain('Не вдалося показати фото');
  expect(screen.getByRole('link').getAttribute('href')).toBe('blob:photo');
  fireEvent.click(screen.getByRole('button', { name: 'Закрити фото' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('closes when storage expires and releases the object URL', async () => {
  vi.useFakeTimers();
  const expires = Date.now() + 10_000;
  const view = render(<AttachmentView file={{ ...file, expires_at: new Date(expires).toISOString() }} />);
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: 'Відкрити фото повністю' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  act(() => { vi.advanceTimersByTime(10_000); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(view.getByText('Строк зберігання завершено')).toBeTruthy();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
});

it('does not open unavailable photos and closes on unmount', async () => {
  const unavailable = render(<AttachmentView file={{ ...file, available: false }} />);
  expect(screen.queryByRole('button', { name: 'Відкрити фото повністю' })).toBeNull();
  expect(mediaBlob).not.toHaveBeenCalled();
  unavailable.unmount();
  const { view } = await openPhoto();
  view.unmount();
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.body.style.overflow).toBe('');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
});
