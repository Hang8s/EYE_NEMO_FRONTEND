import { formatDate, Initial } from './MessageRow';
import { MessageHistory } from './MessageHistory';
import { useArchiveNavigation } from './hooks/useArchiveNavigation';

function chatKind(type: string) { return type === 'private' ? 'Особистий чат' : type === 'group' ? 'Група' : type === 'channel' ? 'Канал' : 'Чат'; }

export default function App() {
  const {
    chats, active, messages, chatCursor, messageCursor, query, setQuery, submittedQuery,
    isLoadingChats, isLoadingMessages, isLoadingOlder, error, end, history,
    scrollToLatest, loadChats, openChat, search, returnHome, loadOlder, retry,
  } = useArchiveNavigation();
  const subtitle = active?.chat_type === 'search' ? `За запитом «${submittedQuery}»` : active ? chatKind(active.chat_type) : `${chats.length}${chatCursor ? '+' : ''} чатів в архіві`;
  return <main className="app-shell">
    <header className="topbar"><div className="brand-row"><button className="back-button" type="button" aria-label="До списку чатів" onClick={returnHome} disabled={!active}>‹</button><div className="page-title"><span className="eyebrow">EYE NEMO · АРХІВ</span><strong>{active?.title || 'Ваші чати'}</strong><small>{subtitle}</small></div></div><form className="search" onSubmit={search}><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Пошук у всіх повідомленнях" aria-label="Пошук повідомлень" /></form></header>
    {error && <section className="notice error"><span>!</span><div>{error}<button type="button" onClick={retry}>Спробувати ще раз</button></div></section>}
    {!active ? <section className="content">
      {isLoadingChats && !chats.length ? <Loading label="Завантажуємо чати…" /> : chats.length ? <><div className="chat-list">{chats.map(chat => <button className="chat-card" key={chat.id} type="button" onClick={() => void openChat(chat)}><span className="chat-avatar"><Initial name={chat.title} /></span><span className="chat-copy"><strong>{chat.title}</strong><small>{chatKind(chat.chat_type)}</small></span>{chat.last_message_at && <time className="chat-date">{formatDate(chat.last_message_at)}</time>}</button>)}</div>{chatCursor && <button className="load-more" type="button" disabled={isLoadingChats} onClick={() => void loadChats(chatCursor)}>{isLoadingChats ? 'Завантажуємо…' : 'Ще чати'}</button>}</> : <Empty icon="▣" title="Архів поки порожній" text="Щойно збережені чати з’являться тут." />}
    </section> : <section className="content chat-view">
      {isLoadingMessages ? <Loading label="Завантажуємо повідомлення…" /> : messages.length ? <>
        {messageCursor && active.chat_type !== 'search' && <button className="load-more" type="button" disabled={isLoadingOlder} onClick={() => void loadOlder()}>{isLoadingOlder ? 'Завантажуємо…' : 'Старіші повідомлення'}</button>}
        <MessageHistory messages={messages} onImageLoad={scrollToLatest} ref={history} />
        <div className="archive-composer" aria-label="Архів тільки для читання"><span className="lock">⌑</span><span>Архів повідомлень — лише перегляд</span><small>read-only</small></div><div ref={end} />
      </> : <Empty icon="⌕" title="Нічого не знайдено" text="У цьому чаті ще немає збережених повідомлень." />}
    </section>}
  </main>;
}
function Loading({ label }: { label: string }) { return <div className="loading"><span className="spinner" /><p>{label}</p></div>; }
function Empty({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="empty"><span>{icon}</span><h2>{title}</h2><p>{text}</p></div>; }
