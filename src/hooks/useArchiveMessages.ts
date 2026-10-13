import { useEffect, useRef, useState } from 'react';
import { isAbort } from '../api';
import { unique } from '../services/archive';
import type { Chat, Message, MessagePage, SearchResults } from '../types';
import { useHistoryScroll } from './useHistoryScroll';

export const MAX_MESSAGES = 500;

export function useArchiveMessages(setError: (error: string) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasTrimmedNewer, setHasTrimmedNewer] = useState(false);
  const visible = useRef<Message[]>([]);
  const messageRequest = useRef<AbortController | null>(null);
  const olderInFlight = useRef(false);
  const scroll = useHistoryScroll(messages);
  useEffect(() => () => messageRequest.current?.abort(), []);
  async function loadMessages(
    chat: Chat,
    request: (signal: AbortSignal) => Promise<MessagePage | SearchResults>,
    older = false,
  ) {
    if (older && olderInFlight.current) return;
    messageRequest.current?.abort();
    const controller = new AbortController();
    messageRequest.current = controller;
    olderInFlight.current = older;
    setError('');
    if (older) setIsLoadingOlder(true);
    else {
      setMessages([]);
      visible.current = [];
      setHasTrimmedNewer(false);
      setMessageCursor(null);
      setIsLoadingMessages(true);
      setIsLoadingOlder(false);
      scroll.resetScroll();
    }
    try {
      const page = await request(controller.signal);
      if (controller.signal.aborted) return;
      scroll.prepareScroll(older, chat.chat_type === 'search');
      const combined = older ? unique([...page.items, ...visible.current]) : page.items;
      const bounded = older ? combined.slice(0, MAX_MESSAGES) : combined.slice(-MAX_MESSAGES);
      if (older && combined.length > MAX_MESSAGES) setHasTrimmedNewer(true);
      visible.current = bounded;
      setMessages(bounded);
      setMessageCursor('next_cursor' in page ? page.next_cursor || null : null);
    } catch (cause) {
      if (!isAbort(cause) && !controller.signal.aborted) setError((cause as Error).message);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMessages(false);
        setIsLoadingOlder(false);
        olderInFlight.current = false;
      }
    }
  }
  function resetMessages() {
    messageRequest.current?.abort();
    olderInFlight.current = false;
    scroll.resetScroll();
    setMessages([]);
    visible.current = [];
    setHasTrimmedNewer(false);
    setMessageCursor(null);
    setIsLoadingMessages(false);
    setIsLoadingOlder(false);
  }
  return { messages, messageCursor, isLoadingMessages, isLoadingOlder, hasTrimmedNewer, loadMessages, resetMessages, ...scroll };
}
