import { memo } from 'react';
import { AttachmentView } from './AttachmentView';
import type { Message, ReplyMessage } from './types';

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
const timeFormat = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
export const formatDate = (value: string) => dateFormat.format(new Date(value));
const formatTime = (value: string) => timeFormat.format(new Date(value));
export const formatDay = (value: string) => dayFormat.format(new Date(value));
export function dayKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
export function Initial({ name }: { name: string }) { return <>{name.trim().charAt(0).toUpperCase() || '#'}</>; }
function messageText(message: Pick<Message, 'text' | 'caption' | 'message_type' | 'is_deleted'>) { return message.text || message.caption || (message.is_deleted ? 'Повідомлення видалено' : `[${message.message_type}]`); }
function AvailableReplyContext({ message }: { message: ReplyMessage }) {
  return <aside className={`reply-context${message.is_outgoing ? ' outgoing' : ''}`}><span className="reply-author">{message.is_outgoing ? 'Ви' : message.sender_name}</span><p>{messageText(message)}</p>{message.attachments.map(file => <AttachmentView compact file={file} key={file.id} />)}</aside>;
}
function ReplyContext({ message }: { message: Message }) {
  if (message.reply_to) return <AvailableReplyContext message={message.reply_to} />;
  if (!message.has_reply && message.reply_to_telegram_message_id == null) return null;
  return <aside className="reply-context"><span className="reply-author">Відповідь на повідомлення</span><p>Оригінальне повідомлення недоступне</p></aside>;
}
export const MessageRow = memo(function MessageRow({ message, onImageLoad }: { message: Message; onImageLoad: () => void }) {
  return <div id={`message-${message.id}`} className={`message-row ${message.is_outgoing ? 'outgoing' : 'incoming'}`}>
    <span className="message-avatar"><Initial name={message.is_outgoing ? 'Ви' : message.sender_name} /></span>
    <article className={`message${message.is_deleted ? ' deleted' : ''}`}>
      {!message.is_outgoing && <span className="message-sender">{message.sender_name}</span>}
      <ReplyContext message={message} /><p>{messageText(message)}</p>
      <footer className="message-footer">{message.edited_at && <span className="edited">змін.</span>}<time>{formatTime(message.sent_at)}</time>{message.is_outgoing && <span className="status">✓✓</span>}</footer>
      {message.is_deleted && <em>Видалено в Telegram</em>}
      {message.attachments.map(file => <AttachmentView file={file} key={file.id} onImageLoad={onImageLoad} />)}
    </article>
  </div>;
});
