// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MessageHistory } from './MessageHistory';
import type { Message } from './types';

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
  const view = render(<MessageHistory messages={messages} onImageLoad={() => {}} />);
  await waitFor(() => {
    const count = view.container.querySelectorAll('.message-row').length;
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(50);
  });
  expect(view.container.querySelector('[data-history-count]')?.getAttribute('data-history-count')).toBe('1000');
});
