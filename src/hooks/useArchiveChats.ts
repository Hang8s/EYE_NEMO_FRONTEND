import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbort } from '../api';
import { archive, unique } from '../services/archive';
import type { Chat } from '../types';

export function useArchiveChats(setError: (error: string) => void) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatCursor, setChatCursor] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const chatRequest = useRef<AbortController | null>(null);
  const loadChats = useCallback(async (cursor: string | null = null) => {
    chatRequest.current?.abort();
    const controller = new AbortController();
    chatRequest.current = controller;
    setError('');
    setIsLoadingChats(true);
    try {
      const page = await archive.chats(cursor, controller.signal);
      if (controller.signal.aborted) return;
      setChats(current => cursor ? unique([...current, ...page.items]) : page.items);
      setChatCursor(page.next_cursor || null);
    } catch (cause) {
      if (!isAbort(cause) && !controller.signal.aborted) setError((cause as Error).message);
    } finally {
      if (!controller.signal.aborted) setIsLoadingChats(false);
    }
  }, [setError]);
  useEffect(() => {
    void loadChats();
    return () => chatRequest.current?.abort();
  }, [loadChats]);
  return { chats, chatCursor, isLoadingChats, loadChats };
}
