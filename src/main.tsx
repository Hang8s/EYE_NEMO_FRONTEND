import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './chat.css';
import './reply-bookmark.css';

type Chat = { id: string; title: string; chat_type: string; updated_at: string; last_message_at?: string | null };
type Attachment = { id: string; type: string; file_name?: string; mime_type?: string; available: boolean; saved_by_reply: boolean };
type Message = { id: string; text?: string; caption?: string; message_type: string; sent_at: string; edited_at?: string; is_deleted: boolean; is_outgoing: boolean; sender_name: string; attachments: Attachment[]; has_reply?: boolean; reply_to_telegram_message_id?: number | null; reply_to?: ReplyMessage | null };
type ReplyMessage = Omit<Message, 'reply_to'>;

const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const headers = () => ({ 'X-Telegram-Init-Data': window.Telegram?.WebApp.initData || '' });
const apiUrl = (path: string) => new URL(path, `${base}/`).toString();
async function api<T>(path: string): Promise<T> { const response = await fetch(apiUrl(path), { headers: headers() }); if (!response.ok) throw new Error(response.status === 401 ? 'Відкрийте застосунок через Telegram.' : 'Не вдалося завантажити дані.'); return response.json() as Promise<T>; }

function isImage(file: Attachment) { return file.type === 'photo' || file.mime_type?.startsWith('image/') === true; }

function AttachmentView({ file, compact = false, onImageLoad }: { file: Attachment; compact?: boolean; onImageLoad?: () => void }) {
  const [url, setUrl] = useState<string | null>(null); const [failed, setFailed] = useState(false);
  const badge = file.saved_by_reply ? <b className="reply-saved-badge">Збережено reply</b> : null;
  useEffect(() => { if (!file.available) return; const controller = new AbortController(); let objectUrl: string | null = null; void fetch(apiUrl(`/mini-api/media/${file.id}`), { headers: headers(), signal: controller.signal }).then(response => { if (!response.ok) throw new Error('Media unavailable'); return response.blob(); }).then(blob => { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }).catch(error => { if (error.name !== 'AbortError') setFailed(true); }); return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [file.available, file.id]);
  if (!file.available || failed) return <div className="attachment unavailable"><span>−</span>{file.file_name || file.type}<small>Файл недоступний</small>{badge}</div>;
  if (!url) return <div className="attachment"><span>…</span>{file.file_name || file.type}<small>Завантажуємо файл</small>{badge}</div>;
  if (isImage(file)) return <a className="attachment attachment-image" href={url} target="_blank" rel="noreferrer" title="Відкрити фото повністю" style={{ display: 'block', width: compact ? '100%' : undefined, maxWidth: compact ? 180 : undefined, padding: 0, background: 'transparent' }}><img onLoad={onImageLoad} style={{ display: 'block', width: compact ? '100%' : undefined, maxWidth: '100%', maxHeight: compact ? 130 : 420, margin: 'auto', borderRadius: compact ? 6 : 8, objectFit: compact ? 'cover' : 'contain' }} src={url} alt={file.file_name || 'Фото'} />{badge}</a>;
  return <a className="attachment" href={url} target="_blank" rel="noreferrer" title="Відкрити файл"><span>↗</span>{file.file_name || file.type}<small>Відкрити файл</small>{badge}</a>;
}
function formatDate(value: string) { return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function formatTime(value: string) { return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function formatDay(value: string) { return new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value)); }
function dayKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function chatKind(type: string) { return type === 'private' ? 'Особистий чат' : type === 'group' ? 'Група' : type === 'channel' ? 'Канал' : 'Чат'; }
function messageText(message: Pick<Message, 'text' | 'caption' | 'message_type' | 'is_deleted'>) { return message.text || message.caption || (message.is_deleted ? 'Повідомлення видалено' : `[${message.message_type}]`); }
function ReplyContext({ message }: { message: Message }) {
  const original = message.reply_to;
  if (original) return <AvailableReplyContext message={original} />;
  if (!message.has_reply && message.reply_to_telegram_message_id == null) return null;
  return <aside className="reply-context"><span className="reply-author">Відповідь на повідомлення</span><p>Оригінальне повідомлення недоступне</p></aside>;
}
function AvailableReplyContext({ message }: { message: ReplyMessage }) {
  const images = message.attachments.filter(isImage);
  const otherAttachments = message.attachments.filter(file => !isImage(file));
  return <aside className={`reply-context${message.is_outgoing ? ' outgoing' : ''}`}><span className="reply-author">{message.is_outgoing ? 'Ви' : message.sender_name}</span><p>{messageText(message)}</p>{images.map(file => <AttachmentView compact file={file} key={file.id} />)}{otherAttachments.map(file => <AttachmentView compact file={file} key={file.id} />)}</aside>;
}
function Initial({ name }: { name: string }) { return <>{name.trim().charAt(0).toUpperCase() || '#'}</>; }

function App() {
  const [chats, setChats] = useState<Chat[]>([]); const [active, setActive] = useState<Chat | null>(null); const [messages, setMessages] = useState<Message[]>([]); const [query, setQuery] = useState(''); const [submittedQuery, setSubmittedQuery] = useState(''); const [isLoadingChats, setIsLoadingChats] = useState(true); const [isLoadingMessages, setIsLoadingMessages] = useState(false); const [error, setError] = useState(''); const messagesEndRef = useRef<HTMLDivElement>(null);
  const subtitle = useMemo(() => active?.chat_type === 'search' ? `За запитом «${submittedQuery}»` : active ? chatKind(active.chat_type) : `${chats.length} чатів в архіві`, [active, chats.length, submittedQuery]);
  const scrollToLatest = () => requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ block: 'end' }));
  async function loadChats() { setError(''); setIsLoadingChats(true); try { setChats((await api<{ items: Chat[] }>('/mini-api/chats')).items); } catch (cause) { setError((cause as Error).message); } finally { setIsLoadingChats(false); } }
  useEffect(() => { window.Telegram?.WebApp.ready(); window.Telegram?.WebApp.expand(); void loadChats(); }, []);
  useEffect(() => { if (active?.chat_type !== 'search' && !isLoadingMessages && messages.length) scrollToLatest(); }, [active?.chat_type, isLoadingMessages, messages.length]);
  async function openChat(chat: Chat) { setActive(chat); setMessages([]); setError(''); setIsLoadingMessages(true); try { setMessages((await api<{ items: Message[] }>(`/mini-api/chats/${chat.id}/messages`)).items); } catch (cause) { setError((cause as Error).message); } finally { setIsLoadingMessages(false); } }
  async function runSearch(value = query.trim()) { if (!value) return; setSubmittedQuery(value); setActive({ id: '', title: 'Результати пошуку', chat_type: 'search', updated_at: '' }); setMessages([]); setError(''); setIsLoadingMessages(true); try { setMessages((await api<{ items: Message[] }>(`/mini-api/search?q=${encodeURIComponent(value)}`)).items); } catch (cause) { setError((cause as Error).message); } finally { setIsLoadingMessages(false); } }
  function search(event: FormEvent) { event.preventDefault(); void runSearch(); }
  function returnHome() { setActive(null); setMessages([]); setQuery(''); setSubmittedQuery(''); setError(''); }
  const retry = active ? () => active.chat_type === 'search' ? void runSearch(submittedQuery) : void openChat(active) : () => void loadChats();
  return <main className="app-shell"><header className="topbar"><div className="brand-row"><button className="back-button" type="button" aria-label="До списку чатів" onClick={returnHome} disabled={!active}>‹</button><div className="page-title"><span className="eyebrow">EYE NEMO · АРХІВ</span><strong>{active?.title || 'Ваші чати'}</strong><small>{subtitle}</small></div></div><form className="search" onSubmit={search}><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Пошук у всіх повідомленнях" aria-label="Пошук повідомлень" /></form></header>{error && <section className="notice error"><span>!</span><div>{error}<button type="button" onClick={retry}>Спробувати ще раз</button></div></section>}{!active ? <section className="content">{isLoadingChats ? <Loading label="Завантажуємо чати…" /> : chats.length ? <div className="chat-list">{chats.map(chat => <button className="chat-card" key={chat.id} type="button" onClick={() => void openChat(chat)}><span className="chat-avatar"><Initial name={chat.title} /></span><span className="chat-copy"><strong>{chat.title}</strong><small>{chatKind(chat.chat_type)}</small></span>{chat.last_message_at && <time className="chat-date">{formatDate(chat.last_message_at)}</time>}</button>)}</div> : <Empty icon="▣" title="Архів поки порожній" text="Щойно збережені чати з’являться тут." />}</section> : <section className="content chat-view">{isLoadingMessages ? <Loading label="Завантажуємо повідомлення…" /> : messages.length ? <><div className="message-stream">{messages.map((message, index) => <Fragment key={message.id}>{(index === 0 || dayKey(messages[index - 1].sent_at) !== dayKey(message.sent_at)) && <div className="day-divider">{formatDay(message.sent_at)}</div>}<div className={`message-row ${message.is_outgoing ? 'outgoing' : 'incoming'}`}><span className="message-avatar"><Initial name={message.is_outgoing ? 'Ви' : message.sender_name} /></span><article className={`message${message.is_deleted ? ' deleted' : ''}`}>{!message.is_outgoing && <span className="message-sender">{message.sender_name}</span>}<ReplyContext message={message} /><p>{messageText(message)}</p><footer className="message-footer">{message.edited_at && <span className="edited">змін.</span>}<time>{formatTime(message.sent_at)}</time>{message.is_outgoing && <span className="status">✓✓</span>}</footer>{message.is_deleted && <em>Видалено в Telegram</em>}{message.attachments?.map(file => <AttachmentView file={file} key={file.id} onImageLoad={scrollToLatest} />)}</article></div></Fragment>)}</div><div className="archive-composer" aria-label="Архів тільки для читання"><span className="lock">⌑</span><span>Архів повідомлень — лише перегляд</span><small>read-only</small></div><div ref={messagesEndRef} /></> : <Empty icon="⌕" title="Нічого не знайдено" text="У цьому чаті ще немає збережених повідомлень." />}</section>}</main>;
}
function Loading({ label }: { label: string }) { return <div className="loading"><span className="spinner" /><p>{label}</p></div>; }
function Empty({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="empty"><span>{icon}</span><h2>{title}</h2><p>{text}</p></div>; }
createRoot(document.getElementById('root')!).render(<App />);
