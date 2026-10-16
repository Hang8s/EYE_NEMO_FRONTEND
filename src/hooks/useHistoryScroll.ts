import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { HistoryAnchor, HistoryHandle } from '../MessageHistory';
import type { Message } from '../types';

export function useHistoryScroll(messages: Message[]) {
  const end = useRef<HTMLDivElement>(null);
  const history = useRef<HistoryHandle>(null);
  const scrollAction = useRef<'latest' | { height: number; top: number; anchor: HistoryAnchor | null } | null>(null);
  const frame = useRef<number | null>(null);
  const followingLatest = useRef(true);
  const [awayFromLatest, setAwayFromLatest] = useState(false);
  const scrollToLatest = useCallback(() => {
    if (followingLatest.current) {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        if (followingLatest.current) end.current?.scrollIntoView({ block: 'end' });
      });
    }
  }, []);
  useLayoutEffect(() => {
    const action = scrollAction.current;
    if (!action) return;
    scrollAction.current = null;
    if (action === 'latest') scrollToLatest();
    else if (action.anchor) history.current?.restore(action.anchor);
    else window.scrollTo(0, action.height === -1 ? action.top : action.top + document.documentElement.scrollHeight - action.height);
  }, [messages, scrollToLatest]);
  useEffect(() => {
    const onScroll = () => {
      followingLatest.current = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 160;
      setAwayFromLatest(!followingLatest.current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const resetScroll = useCallback(() => {
    scrollAction.current = null;
    followingLatest.current = true;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  const prepareScroll = (older: boolean, isSearch: boolean) => {
    scrollAction.current = older
      ? { height: document.documentElement.scrollHeight, top: window.scrollY, anchor: history.current?.capture() || null }
      : isSearch ? { height: -1, top: 0, anchor: null } : 'latest';
    if (older) followingLatest.current = false;
  };
  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);
  function restoreScroll(anchor: HistoryAnchor | null, top = 0) {
    followingLatest.current = false;
    scrollAction.current = { height: -1, top, anchor };
  }
  function goToLatest() {
    followingLatest.current = true;
    setAwayFromLatest(false);
    scrollToLatest();
  }
  return { end, history, scrollToLatest, resetScroll, prepareScroll, restoreScroll, awayFromLatest, goToLatest };
}
