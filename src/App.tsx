import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api, isAbort } from './api';
import { clearMediaCache } from './media-cache';
import { formatDate, Initial } from './MessageRow';
import { MessageHistory } from './MessageHistory';
import type { HistoryAnchor, HistoryHandle } from './MessageHistory';
import type { Chat, Message, Page } from './types';

function chatKind(type: string) { return type === 'private' ? 'Особистий чат' : type === 'group' ? 'Група' : type === 'channel' ? 'Канал' : 'Чат'; }
function unique<T extends { id: string }>(items: T[]): T[] { return [...new Map(items.map(item => [item.id, item])).values()]; }

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatCursor, setChatCursor] = useState<string | null>(null);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const messageRequest = useRef<AbortController | null>(null);
  const chatRequest = useRef<AbortController | null>(null);
  const history = useRef<HistoryHandle>(null);
  const scrollAction = useRef<'latest' | { height: number; top: number; anchor: HistoryAnchor | null } | null>(null);
  const followingLatest = useRef(true);
  const olderInFlight = useRef(false);
  const scrollToLatest = useCallback(() => {
    if (followingLatest.current) requestAnimationFrame(() => end.current?.scrollIntoView({ block: 'end' }));
  }, []);
  useLayoutEffect(() => {
    const action = scrollAction.current;
    if (!action) return;
    scrollAction.current = null;
    if (action === 'latest') scrollToLatest();
    else if (action.anchor) history.current?.restore(action.anchor);
    else window.scrollTo(0, action.top + document.documentElement.scrollHeight - action.height);
  }, [messages, scrollToLatest]);
  useEffect(() => {
    const onScroll = () => { followingLatest.current = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 160; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  async function loadChats(cursor: string | null = null) {
    chatRequest.current?.abort();
    const controller = new AbortController(); chatRequest.current = controller;
    setError(''); setIsLoadingChats(true);
    try {
      const page = await api<Page<Chat>>(`/mini-api/chats${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, controller.signal);
      if (controller.signal.aborted) return;
      setChats(current => cursor ? unique([...current, ...page.items]) : page.items);
      setChatCursor(page.next_cursor || null);
    } catch (cause) { if (!isAbort(cause) && !controller.signal.aborted) setError((cause as Error).message); }
    finally { if (!controller.signal.aborted) setIsLoadingChats(false); }
  }
  useEffect(() => {
    window.Telegram?.WebApp.ready(); window.Telegram?.WebApp.expand(); void loadChats();
    return () => { messageRequest.current?.abort(); chatRequest.current?.abort(); clearMediaCache(); };
  }, []);
  async function loadMessages(chat: Chat, path: string, older = false) {
    if (older && olderInFlight.current) return;
    messageRequest.current?.abort();
    const controller = new AbortController(); messageRequest.current = controller;
    olderInFlight.current = older; setError('');
    if (older) setIsLoadingOlder(true);
    else { setActive(chat); setMessages([]); setMessageCursor(null); setIsLoadingMessages(true); setIsLoadingOlder(false); followingLatest.current = true; }
    try {
      const page = await api<Page<Message>>(path, controller.signal);
      if (controller.signal.aborted) return;
      scrollAction.current = older ? { height: document.documentElement.scrollHeight, top: window.scrollY, anchor: history.current?.capture() || null } : chat.chat_type === 'search' ? null : 'latest';
      if (older) followingLatest.current = false;
      setMessages(current => older ? unique([...page.items, ...current]) : page.items);
      setMessageCursor(page.next_cursor || null);
    } catch (cause) { if (!isAbort(cause) && !controller.signal.aborted) setError((cause as Error).message); }
    finally { if (!controller.signal.aborted) { setIsLoadingMessages(false); setIsLoadingOlder(false); olderInFlight.current = false; } }
  }
  function openChat(chat: Chat) { return loadMessages(chat, `/mini-api/chats/${chat.id}/messages`); }
  function runSearch(value = query.trim()) {
    if (!value) return;
    setSubmittedQuery(value);
    return loadMessages({ id: 'search', title: 'Результати пошуку', chat_type: 'search', updated_at: '' }, `/mini-api/search?q=${encodeURIComponent(value)}`);
  }
  function search(event: FormEvent) { event.preventDefault(); void runSearch(); }
  function returnHome() {
    messageRequest.current?.abort(); olderInFlight.current = false; scrollAction.current = null;
    setActive(null); setMessages([]); setMessageCursor(null); setIsLoadingMessages(false); setIsLoadingOlder(false); setQuery(''); setSubmittedQuery(''); setError('');
  }
  const retry = () => active ? active.chat_type === 'search' ? void runSearch(submittedQuery) : void openChat(active) : void loadChats();
  const subtitle = active?.chat_type === 'search' ? `За запитом «${submittedQuery}»` : active ? chatKind(active.chat_type) : `${chats.length}${chatCursor ? '+' : ''} чатів в архіві`;
  return <main className="app-shell">
    <header className="topbar"><div className="brand-row"><button className="back-button" type="button" aria-label="До списку чатів" onClick={returnHome} disabled={!active}>‹</button><div className="page-title"><span className="eyebrow">EYE NEMO · АРХІВ</span><strong>{active?.title || 'Ваші чати'}</strong><small>{subtitle}</small></div></div><form className="search" onSubmit={search}><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Пошук у всіх повідомленнях" aria-label="Пошук повідомлень" /></form></header>
    {error && <section className="notice error"><span>!</span><div>{error}<button type="button" onClick={retry}>Спробувати ще раз</button></div></section>}
    {!active ? <section className="content">
      {isLoadingChats && !chats.length ? <Loading label="Завантажуємо чати…" /> : chats.length ? <><div className="chat-list">{chats.map(chat => <button className="chat-card" key={chat.id} type="button" onClick={() => void openChat(chat)}><span className="chat-avatar"><Initial name={chat.title} /></span><span className="chat-copy"><strong>{chat.title}</strong><small>{chatKind(chat.chat_type)}</small></span>{chat.last_message_at && <time className="chat-date">{formatDate(chat.last_message_at)}</time>}</button>)}</div>{chatCursor && <button className="load-more" type="button" disabled={isLoadingChats} onClick={() => void loadChats(chatCursor)}>{isLoadingChats ? 'Завантажуємо…' : 'Ще чати'}</button>}</> : <Empty icon="▣" title="Архів поки порожній" text="Щойно збережені чати з’являться тут." />}
    </section> : <section className="content chat-view">
      {isLoadingMessages ? <Loading label="Завантажуємо повідомлення…" /> : messages.length ? <>
        {messageCursor && active.chat_type !== 'search' && <button className="load-more" type="button" disabled={isLoadingOlder} onClick={() => void loadMessages(active, `/mini-api/chats/${active.id}/messages?cursor=${encodeURIComponent(messageCursor)}`, true)}>{isLoadingOlder ? 'Завантажуємо…' : 'Старіші повідомлення'}</button>}
        <MessageHistory messages={messages} onImageLoad={scrollToLatest} ref={history} />
        <div className="archive-composer" aria-label="Архів тільки для читання"><span className="lock">⌑</span><span>Архів повідомлень — лише перегляд</span><small>read-only</small></div><div ref={end} />
      </> : <Empty icon="⌕" title="Нічого не знайдено" text="У цьому чаті ще немає збережених повідомлень." />}
    </section>}
  </main>;
}
function Loading({ label }: { label: string }) { return <div className="loading"><span className="spinner" /><p>{label}</p></div>; }
function Empty({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="empty"><span>{icon}</span><h2>{title}</h2><p>{text}</p></div>; }
