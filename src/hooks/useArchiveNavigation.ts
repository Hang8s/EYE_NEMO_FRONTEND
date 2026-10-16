import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Chat, Message, MessagePage } from '../types';
import type { HistoryAnchor } from '../MessageHistory';
import { clearMediaCache } from '../media-cache';
import { archive } from '../services/archive';
import { useArchiveChats } from './useArchiveChats';
import { useArchiveMessages } from './useArchiveMessages';

export function useArchiveNavigation() {
  const [active, setActive] = useState<Chat | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [scope, setScope] = useState<'chat' | 'all'>('all');
  const [searchChat, setSearchChat] = useState<Chat | null>(null);
  const submittedChat = useRef<string | undefined>(undefined);
  const submittedContext = useRef<Chat | null>(null);
  const snapshots = useRef(new Map<string, { page: MessagePage; anchor: HistoryAnchor | null; top: number; trimmed: boolean }>());
  const homeTop = useRef(0);
  const currentTarget = useRef<{ around?: string; at?: string } | undefined>(undefined);
  const [focusedMessage, setFocusedMessage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const chats = useArchiveChats(setError);
  const messages = useArchiveMessages(setError);
  useEffect(() => {
    window.Telegram?.WebApp.ready();
    window.Telegram?.WebApp.expand();
    return clearMediaCache;
  }, []);
  function remember() {
    if (!active) { homeTop.current = window.scrollY; return; }
    if (messages.isLoadingMessages || messages.isLoadingOlder || error) return;
    const key = active.chat_type === 'search' ? `search:${submittedQuery}:${submittedChat.current || ''}` : active.id;
    snapshots.current.delete(key);
    snapshots.current.set(key, { page: { items: messages.messages, next_cursor: messages.messageCursor }, anchor: messages.history.current?.capture() || null, top: window.scrollY, trimmed: messages.hasTrimmedNewer });
    if (snapshots.current.size > 8) snapshots.current.delete(snapshots.current.keys().next().value!);
  }
  function openChat(chat: Chat, target?: { around?: string; at?: string }, rememberCurrent = true) {
    if (rememberCurrent) remember();
    setActive(chat);
    currentTarget.current = target;
    setSearchChat(chat);
    setFocusedMessage(target?.around || null);
    const targeted = !!(target?.around || target?.at);
    const saved = target ? undefined : snapshots.current.get(chat.id);
    return messages.loadMessages(chat, signal => saved ? Promise.resolve(saved.page) : archive.messages(chat.id, null, signal, target), false,
      saved || (targeted ? { anchor: target?.around ? { id: target.around, top: 0, virtual: false } : null, top: 0, trimmed: true, date: target?.at } : undefined));
  }
  function runSearch(value = query.trim(), chatId = scope === 'chat' ? searchChat?.id : undefined, save = true) {
    if (!value) return;
    if (save) remember();
    setSubmittedQuery(value);
    submittedChat.current = chatId;
    submittedContext.current = searchChat;
    setFocusedMessage(null);
    const chat = { id: 'search', title: 'Результати пошуку', chat_type: 'search', updated_at: '' };
    setActive(chat);
    return messages.loadMessages(chat, signal => archive.search(value, signal, chatId));
  }
  async function openResult(message: Message) {
    const chat = chats.chats.find(chat => chat.id === message.chat_id) || { id: message.chat_id, title: message.chat_title || 'Чат', chat_type: 'private', updated_at: message.sent_at };
    await openChat(chat, { around: message.id });
  }
  function clearSearch() {
    setQuery('');
    setSubmittedQuery('');
    if (active?.chat_type === 'search' && searchChat) void openChat(searchChat);
    else if (active?.chat_type === 'search') returnHome();
  }
  function returnToSearch() {
    remember();
    const chat = { id: 'search', title: 'Результати пошуку', chat_type: 'search', updated_at: '' };
    const saved = snapshots.current.get(`search:${submittedQuery}:${submittedChat.current || ''}`);
    setActive(chat);
    setSearchChat(submittedContext.current);
    void messages.loadMessages(chat, signal => saved ? Promise.resolve(saved.page) : archive.search(submittedQuery, signal, submittedChat.current), false, saved);
  }
  function latest() {
    if (active && messages.hasTrimmedNewer) void openChat(active, {}, false);
    else messages.goToLatest();
  }
  function jumpToDate(value: string) {
    if (active && value) void openChat(active, { at: new Date(`${value}T00:00:00`).toISOString() });
  }
  function search(event: FormEvent) {
    event.preventDefault();
    void runSearch();
  }
  function returnHome() {
    remember();
    messages.resetMessages();
    setActive(null);
    setQuery('');
    setSubmittedQuery('');
    setSearchChat(null);
    setScope('all');
    setError('');
    requestAnimationFrame(() => window.scrollTo(0, homeTop.current));
  }
  function loadOlder() {
    if (!active || active.chat_type === 'search' || !messages.messageCursor) return;
    return messages.loadMessages(active, signal => archive.messages(active.id, messages.messageCursor, signal), true);
  }
  function retry() {
    if (!active) void chats.loadChats();
    else if (active.chat_type === 'search') void runSearch(submittedQuery, submittedChat.current, false);
    else void openChat(active, currentTarget.current, false);
  }
  return { ...chats, ...messages, active, query, setQuery, submittedQuery, error, openChat, search, returnHome, loadOlder, retry, scope, setScope, searchChat, clearSearch, openResult, latest, jumpToDate, focusedMessage, returnToSearch };
}
