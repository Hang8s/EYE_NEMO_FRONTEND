import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Chat = { id: string; title: string; chat_type: string; updated_at: string };
type Attachment = { id: string; type: string; file_name?: string; mime_type?: string; available: boolean };
type Message = { id: string; text?: string; caption?: string; message_type: string; sent_at: string; edited_at?: string; is_deleted: boolean; attachments: Attachment[] };
// Temporary local development tunnel. Configure VITE_API_BASE_URL in Vercel for production.
const base = import.meta.env.VITE_API_BASE_URL || 'https://eye-nemo-hang8s-20261002.loca.lt';
const headers = () => ({ 'X-Telegram-Init-Data': window.Telegram?.WebApp.initData || '' });
async function api<T>(path: string): Promise<T> { const response = await fetch(`${base}${path}`, { headers: headers() }); if (!response.ok) throw new Error(response.status === 401 ? 'Відкрийте застосунок через Telegram.' : 'Не вдалося завантажити дані.'); return response.json() as Promise<T>; }
function App() {
  const [chats, setChats] = useState<Chat[]>([]); const [active, setActive] = useState<Chat | null>(null); const [messages, setMessages] = useState<Message[]>([]); const [query, setQuery] = useState(''); const [error, setError] = useState('');
  useEffect(() => { window.Telegram?.WebApp.ready(); window.Telegram?.WebApp.expand(); api<{items: Chat[]}>('/mini-api/chats').then(x => setChats(x.items)).catch(x => setError(x.message)); }, []);
  async function openChat(chat: Chat) { setActive(chat); setMessages([]); setError(''); try { setMessages((await api<{items: Message[]}>(`/mini-api/chats/${chat.id}/messages`)).items); } catch (x) { setError((x as Error).message); } }
  async function search(value: string) { setQuery(value); if (!value.trim()) return; try { const result = await api<{items: Message[]}>(`/mini-api/search?q=${encodeURIComponent(value)}`); setActive({ id: '', title: `Пошук: ${value}`, chat_type: 'search', updated_at: '' }); setMessages(result.items); } catch (x) { setError((x as Error).message); } }
  return <main><header><button onClick={() => { setActive(null); setQuery(''); }}>Архів</button><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search(query)} placeholder="Пошук повідомлень" /></header>{error && <p className="error">{error}</p>}{!active ? <section>{chats.map(chat => <button className="chat" key={chat.id} onClick={() => openChat(chat)}><strong>{chat.title}</strong><small>{chat.chat_type}</small></button>)}{!chats.length && !error && <p>Чатів ще немає.</p>}</section> : <section><h1>{active.title}</h1>{messages.map(message => <article className={message.is_deleted ? 'deleted' : ''} key={message.id}><small>{new Date(message.sent_at).toLocaleString('uk-UA')}{message.edited_at ? ' · змінено' : ''}</small><p>{message.text || message.caption || `[${message.message_type}]`}</p>{message.is_deleted && <em>Видалено в Telegram</em>}{message.attachments?.map(file => <a key={file.id} href={`${base}/mini-api/media/${file.id}`} target="_blank" rel="noreferrer">{file.available ? `Відкрити: ${file.file_name || file.type}` : `${file.file_name || file.type} (не збережено)`}</a>)}</article>)}{!messages.length && <p>Повідомлень не знайдено.</p>}</section>}</main>;
}
createRoot(document.getElementById('root')!).render(<App />);
