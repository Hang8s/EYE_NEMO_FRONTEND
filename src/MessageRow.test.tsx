// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MessageRow } from './MessageRow';
import type { Message, MessageVersion } from './types';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const revision = (id: string, kind: MessageVersion['kind'], text: string): MessageVersion => ({
  id, kind, text, message_type: 'text', observed_at: '2026-10-06T10:00:00Z',
  edited_at: kind === 'edit' ? '2026-10-06T10:01:00Z' : null, attachments: [],
});
const message = (versions?: MessageVersion[]): Message => ({ id: 'message', text: 'latest', message_type: 'text',
  sent_at: '2026-10-06T10:00:00Z', sender_name: 'Sender', is_outgoing: false, is_deleted: false, attachments: [], versions });

it('shows the original and all edits in sequence without repeating the latest text', () => {
  const view = render(<MessageRow message={message([revision('original', 'original', 'first'), revision('edit1', 'edit', 'second'), revision('edit2', 'edit', 'latest')])} onImageLoad={() => {}} />);
  const blocks = view.container.querySelectorAll('.message-version');
  expect([...blocks].map(block => block.querySelector('p')?.textContent)).toEqual(['first', 'second', 'latest']);
  expect(screen.getByText('Оригінал')).toBeTruthy();
  expect(screen.getAllByText(/Відредаговано ·/)).toHaveLength(2);
  expect(screen.getAllByText('latest')).toHaveLength(1);
});

it('marks an unknown original and preserves legacy snapshots without inventing edit dates', () => {
  render(<MessageRow message={message([revision('legacy', 'legacy', 'saved old text'), { ...revision('edit', 'edit', 'latest'), edited_at: null }])} onImageLoad={() => {}} />);
  expect(screen.getByText('Оригінал не отримано')).toBeTruthy();
  expect(screen.getByText(/Збережена версія · отримано/)).toBeTruthy();
  expect(screen.getByText('Відредаговано · час невідомий')).toBeTruthy();
});

it('renders each version own expired attachment and keeps unassigned historical media separate', () => {
  const view = render(<MessageRow message={{ ...message([
    { ...revision('original', 'original', 'old caption'), attachments: [{ id: 'old', type: 'document', file_name: 'old.pdf', available: false, saved_by_reply: false }] },
    { ...revision('edit', 'edit', 'new caption'), attachments: [{ id: 'new', type: 'document', file_name: 'new.pdf', available: false, saved_by_reply: false }] },
  ]), unversioned_attachments: [{ id: 'unknown', type: 'document', file_name: 'unknown.pdf', available: false, saved_by_reply: false }] }} onImageLoad={() => {}} />);
  const blocks = view.container.querySelectorAll('.message-version');
  expect(within(blocks[0] as HTMLElement).getByText(/old.pdf/)).toBeTruthy();
  expect(within(blocks[1] as HTMLElement).getByText(/new.pdf/)).toBeTruthy();
  expect(screen.getByText('Медіа з невідомою версією')).toBeTruthy();
  expect(screen.getByText(/unknown.pdf/)).toBeTruthy();
});

it('shows only the current target in a reply preview', () => {
  render(<MessageRow message={{ ...message([revision('reply', 'original', 'reply text')]), reply_to: {
    ...message([revision('old', 'original', 'old quoted text'), revision('new', 'edit', 'latest')]), text: 'current quoted text',
  } }} onImageLoad={() => {}} />);
  expect(screen.getByText('current quoted text')).toBeTruthy();
  expect(screen.queryByText('old quoted text')).toBeNull();
});

it('supports older APIs without versions', () => {
  render(<MessageRow message={message()} onImageLoad={() => {}} />);
  expect(screen.getByText('latest')).toBeTruthy();
  expect(screen.queryByText('Оригінал не отримано')).toBeNull();
});
