// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MessageHistory } from './MessageHistory';
import type { Message } from './types';
import { createRef } from 'react';
import type { HistoryHandle } from './MessageHistory';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('renders a bounded window of a thousand variable-height messages', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.dataset.index !== undefined ? 80 + Number(this.dataset.index) % 3 * 20 : parseFloat(this.style.height) || 0;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const height = this.dataset.index ? 80 + Number(this.dataset.index) % 3 * 20 : 0;
    return { top: 0, bottom: height, left: 0, right: 700, width: 700, height, x: 0, y: 0, toJSON() {} };
  });
  const messages: Message[] = Array.from({ length: 1000 }, (_, index) => ({ id: String(index), text: `Message ${index}`, sent_at: '2026-01-01T00:00:00Z', message_type: 'text', sender_name: 'Sender', is_outgoing: false, is_deleted: false, attachments: [] }));
  messages.forEach(message => {
    message.versions = [
      { id: `${message.id}-original`, kind: 'original', text: `Original ${message.id}`, observed_at: message.sent_at, attachments: [] },
      { id: `${message.id}-edit`, kind: 'edit', text: message.text, edited_at: '2026-01-01T00:01:00Z', observed_at: '2026-01-01T00:01:01Z', attachments: [] },
    ];
  });
  const view = render(<MessageHistory messages={messages} onImageLoad={() => {}} />);
  await waitFor(() => {
    const count = view.container.querySelectorAll('.message-row').length;
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(50);
    expect(view.container.querySelectorAll('.message-version').length).toBe(count * 2);
  });
  expect(view.container.querySelector('[data-history-count]')?.getAttribute('data-history-count')).toBe('1000');
});

it('restores the same message anchor when expanded version history changes its position', () => {
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  let top = 20;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    top, bottom: top + 220, left: 0, right: 700, width: 700, height: 220, x: 0, y: top, toJSON() {},
  }));
  const message: Message = { id: 'anchor', text: 'latest', sent_at: '2026-01-01T00:00:00Z', message_type: 'text', sender_name: 'Sender', is_outgoing: false, is_deleted: false, attachments: [], versions: [
    { id: 'original', kind: 'original', text: 'first', observed_at: '2026-01-01T00:00:00Z', attachments: [] },
    { id: 'edit', kind: 'edit', text: 'latest', edited_at: '2026-01-01T00:01:00Z', observed_at: '2026-01-01T00:01:01Z', attachments: [] },
  ] };
  const ref = createRef<HistoryHandle>();
  const view = render(<MessageHistory ref={ref} messages={[message]} onImageLoad={() => {}} />);
  const anchor = ref.current!.capture()!;
  expect(anchor.id).toBe('anchor');
  top = 90;
  view.rerender(<MessageHistory ref={ref} messages={[{ ...message, versions: [...message.versions!, { id: 'edit2', kind: 'edit', text: 'new edit', edited_at: '2026-01-01T00:02:00Z', observed_at: '2026-01-01T00:02:01Z', attachments: [] }] }]} onImageLoad={() => {}} />);
  ref.current!.restore(anchor);
  expect(scroll).toHaveBeenCalledWith(0, window.scrollY + 70);
});
