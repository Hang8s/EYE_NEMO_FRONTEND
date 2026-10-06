import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Chat } from '../types';
import { clearMediaCache } from '../media-cache';
import { archive } from '../services/archive';
import { useArchiveChats } from './useArchiveChats';
import { useArchiveMessages } from './useArchiveMessages';

export function useArchiveNavigation() {
  const [active, setActive] = useState<Chat | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [error, setError] = useState('');
  const chats = useArchiveChats(setError);
  const messages = useArchiveMessages(setError);
  useEffect(() => {
    window.Telegram?.WebApp.ready();
    window.Telegram?.WebApp.expand();
    return clearMediaCache;
  }, []);
  function openChat(chat: Chat) {
    setActive(chat);
    return messages.loadMessages(chat, signal => archive.messages(chat.id, null, signal));
  }
  function runSearch(value = query.trim()) {
    if (!value) return;
    setSubmittedQuery(value);
    const chat = { id: 'search', title: 'Результати пошуку', chat_type: 'search', updated_at: '' };
    setActive(chat);
    return messages.loadMessages(chat, signal => archive.search(value, signal));
  }
  function search(event: FormEvent) {
    event.preventDefault();
    void runSearch();
  }
  function returnHome() {
    messages.resetMessages();
    setActive(null);
    setQuery('');
    setSubmittedQuery('');
    setError('');
  }
  function loadOlder() {
    if (!active || active.chat_type === 'search' || !messages.messageCursor) return;
    return messages.loadMessages(active, signal => archive.messages(active.id, messages.messageCursor, signal), true);
  }
  function retry() {
    if (!active) void chats.loadChats();
    else if (active.chat_type === 'search') void runSearch(submittedQuery);
    else void openChat(active);
  }
  return { ...chats, ...messages, active, query, setQuery, submittedQuery, error, openChat, search, returnHome, loadOlder, retry };
}
