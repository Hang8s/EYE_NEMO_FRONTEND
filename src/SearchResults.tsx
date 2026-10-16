import { Fragment } from 'react';
import { formatDate } from './MessageRow';
import type { Message } from './types';

export function Highlight({ text, query }: { text: string; query: string }) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escaped) return <>{text}</>;
  return <>{text.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>)}</>;
}
export function SearchResults({ messages, query, onOpen }: { messages: Message[]; query: string; onOpen: (message: Message) => void }) {
  return <div className="search-results"><p className="result-count" role="status">Знайдено: {messages.length}{messages.length >= 50 ? ' · показано перші збіги' : ''}</p>{messages.map(message => {
    const text = message.match_text || message.text || message.caption || `[${message.message_type}]`;
    const position = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    const start = Math.max(0, position - 90);
    const snippet = text.slice(start, Math.max(start + 260, position + query.length));
    return <button className="search-result" key={message.id} type="button" onClick={() => onOpen(message)}>
      <strong>{message.chat_title || 'Чат'}</strong><time dateTime={message.sent_at}>{formatDate(message.sent_at)}</time>
      <span className="result-author">{message.is_outgoing ? 'Ви' : message.sender_name}</span>
      <p>{start > 0 && '…'}<Highlight text={snippet} query={query} />{start + snippet.length < text.length && '…'}</p><small>Відкрити в розмові →</small>
    </button>;
  })}</div>;
}
