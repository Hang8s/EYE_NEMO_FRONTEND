import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { dayKey, formatDay, MessageRow } from './MessageRow';
import type { Message } from './types';

export type HistoryAnchor = { id: string; top: number; virtual: boolean };
export type HistoryHandle = { capture: () => HistoryAnchor | null; restore: (anchor: HistoryAnchor) => void };
type Props = { messages: Message[]; onImageLoad: () => void };
export const VIRTUAL_THRESHOLD = 100;
const estimateHeight = () => 90;

function contents(messages: Message[], index: number, onImageLoad: () => void) {
  const message = messages[index];
  return <>{(index === 0 || dayKey(messages[index - 1].sent_at) !== dayKey(message.sent_at)) && <div className="day-divider">{formatDay(message.sent_at)}</div>}<MessageRow message={message} onImageLoad={onImageLoad} /></>;
}

export const MessageHistory = forwardRef<HistoryHandle, Props>(function MessageHistory(props, ref) {
  return props.messages.length > VIRTUAL_THRESHOLD ? <VirtualHistory {...props} ref={ref} /> : <PlainHistory {...props} ref={ref} />;
});

function capture(root: HTMLDivElement | null, virtual: boolean): HistoryAnchor | null {
  const cutoff = document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0;
  const nodes = root?.querySelectorAll<HTMLElement>('[data-message-id]');
  const node = nodes && [...nodes].find(item => item.getBoundingClientRect().bottom > cutoff);
  return node ? { id: node.dataset.messageId!, top: node.getBoundingClientRect().top, virtual } : null;
}

const PlainHistory = forwardRef<HistoryHandle, Props>(function PlainHistory({ messages, onImageLoad }, ref) {
  const root = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    capture: () => capture(root.current, false),
    restore: anchor => {
      const node = root.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(anchor.id)}"]`);
      if (node) window.scrollTo(0, window.scrollY + node.getBoundingClientRect().top - anchor.top);
    },
  }), []);
  return <div className="message-stream" ref={root} data-history-count={messages.length}>
    {messages.map((message, index) => <div className="history-item" data-message-id={message.id} key={message.id}>{contents(messages, index, onImageLoad)}</div>)}
  </div>;
});

const VirtualHistory = forwardRef<HistoryHandle, Props>(function VirtualHistory({ messages, onImageLoad }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const [margin, setMargin] = useState(0);
  const itemKey = useCallback((index: number) => messages[index].id, [messages]);
  const virtual = useWindowVirtualizer({
    count: messages.length, estimateSize: estimateHeight, overscan: 6,
    getItemKey: itemKey,
    scrollMargin: margin, anchorTo: 'end', followOnAppend: false,
    initialOffset: () => window.scrollY,
  });
  useLayoutEffect(() => {
    const measure = () => { if (root.current) setMargin(root.current.getBoundingClientRect().top + window.scrollY); };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [messages.length]);
  useImperativeHandle(ref, () => ({
    capture: () => capture(root.current, true),
    restore: anchor => {
      // Existing virtual lists preserve keyed anchors internally. Handle only the
      // transition from a short plain list to a long virtual list here.
      if (anchor.virtual) return;
      const index = messages.findIndex(message => message.id === anchor.id);
      if (index < 0) return;
      virtual.scrollToIndex(index, { align: 'start' });
      requestAnimationFrame(() => {
        const node = root.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(anchor.id)}"]`);
        if (node) window.scrollTo(0, window.scrollY + node.getBoundingClientRect().top - anchor.top);
      });
    },
  }), [messages, virtual]);
  return <div className="virtual-history" ref={root} data-history-count={messages.length} style={{ height: virtual.getTotalSize(), position: 'relative', overflowAnchor: 'none' }}>
    {virtual.getVirtualItems().map(item => <div key={item.key} data-index={item.index} data-message-id={messages[item.index].id} ref={virtual.measureElement} className="history-item" style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start - margin}px)`, paddingBottom: 8 }}>{contents(messages, item.index, onImageLoad)}</div>)}
  </div>;
});
