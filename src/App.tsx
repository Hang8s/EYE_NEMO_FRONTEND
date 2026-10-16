import { useState } from 'react';
import { formatDate, Initial } from './MessageRow';
import { MessageHistory } from './MessageHistory';
import { SearchResults } from './SearchResults';
import { useArchiveNavigation } from './hooks/useArchiveNavigation';

function chatKind(type: string) { return type === 'private' ? 'Особистий чат' : type === 'group' ? 'Група' : type === 'channel' ? 'Канал' : 'Чат'; }
export function shortDate(value: string, now = new Date()) {
  const date = new Date(value);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return 'сьогодні';
  if (date.toDateString() === yesterday.toDateString()) return 'вчора';
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}) }).format(date);
}
export default function App() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const nav = useArchiveNavigation();
  const { chats, active, messages, chatCursor, messageCursor, query, setQuery, submittedQuery,
    isLoadingChats, isLoadingMessages, isLoadingOlder, error, end, history,
    scrollToLatest, loadChats, openChat, search, returnHome, loadOlder, retry } = nav;
  const isSearch = active?.chat_type === 'search';
  const subtitle = isSearch ? (submittedQuery ? `За запитом «${submittedQuery}»` : 'За вибраними фільтрами') : active ? chatKind(active.chat_type) : `${chats.length}${chatCursor ? '+' : ''} чатів в архіві`;
  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-row">
        <button className="back-button" type="button" aria-label="До списку чатів" onClick={returnHome} disabled={!active}>‹</button>
        <div className="page-title"><span className="eyebrow">EYE NEMO</span><strong>{active?.title || 'Ваші чати'}</strong><small>{subtitle}</small></div>
        {active && !isSearch && <button type="button" className="calendar-toggle" aria-label="Відкрити календар" aria-expanded={calendarOpen} onClick={() => setCalendarOpen(value => !value)}>▦</button>}
        <span className="archive-badge">Архів · лише перегляд</span>
      </div>
      <form className="search" role="search" onSubmit={search}>
        <input type="search" maxLength={300} value={query} onChange={event => setQuery(event.target.value)} placeholder={nav.scope === 'chat' ? 'Пошук у цьому чаті' : 'Пошук у всьому архіві'} aria-label="Пошук повідомлень" />
        {query && <button className="clear-search" type="button" aria-label="Очистити пошук" onClick={nav.clearSearch}>×</button>}
        <button className="search-submit" type="submit" disabled={!query.trim() && !Object.keys(nav.filters).length}>Знайти</button>
      </form>
      {active && !isSearch && calendarOpen && <form className="date-jump" onSubmit={event => { event.preventDefault(); const value = new FormData(event.currentTarget).get('date'); if (value) { nav.jumpToDate(String(value)); setCalendarOpen(false); } }}>
        <label htmlFor="history-date">Перейти до дати</label><input id="history-date" name="date" type="date" required /><button type="submit">Перейти</button>
      </form>}
    </header>
      <div className="search-scope" role="group" aria-label="Область пошуку">
        <button type="button" aria-pressed={nav.scope === 'chat'} disabled={!nav.searchChat} onClick={() => nav.setScope('chat')}>У цьому чаті</button>
        <button type="button" aria-pressed={nav.scope === 'all'} onClick={() => nav.setScope('all')}>У всьому архіві</button>
      </div>

    <div className="quick-filters" role="group" aria-label="Швидкі фільтри">
      {([['content_type', 'photo', 'Фото'], ['content_type', 'video', 'Відео'], ['content_type', 'document', 'Файли'], ['edited', 'true', 'Редаговані'], ['deleted', 'true', 'Видалені']] as const).map(([key, value, label]) => <button key={value + key} type="button" aria-pressed={nav.filters[key] === value} onClick={() => nav.toggleFilter(key, value)}>{label}</button>)}
    </div>
    {error && <section className="notice error" role="alert"><span>!</span><div>{error}<button type="button" onClick={retry}>Спробувати ще раз</button></div></section>}
    {active && !isSearch && nav.hasSearch && <button className="load-more" type="button" onClick={nav.returnToSearch}>До результатів пошуку</button>}
    {!active ? <section className="content">
      <label className="chat-name-filter">Назва чату<input type="search" value={nav.chatQuery} onChange={event => nav.setChatQuery(event.target.value)} placeholder="Знайти чат за назвою" /></label>
      {isLoadingChats && !chats.length ? <Loading label="Завантажуємо чати…" /> : chats.length ? <>
        <div className="chat-list">{chats.map(chat => <button className="chat-card" key={chat.id} type="button" onClick={() => void openChat(chat)}>
          <span className="chat-avatar"><Initial name={chat.title} /></span><span className="chat-copy"><strong>{chat.title}</strong><span className="chat-preview">{chat.last_message_preview || 'Немає збережених повідомлень'}</span><small>{chatKind(chat.chat_type)}</small></span>
          {chat.last_message_at && <time dateTime={chat.last_message_at} title={formatDate(chat.last_message_at)} className="chat-date">{shortDate(chat.last_message_at)}</time>}
        </button>)}</div>
        {chatCursor && <button className="load-more" type="button" disabled={isLoadingChats} onClick={() => void loadChats(chatCursor)}>{isLoadingChats ? 'Завантажуємо…' : 'Ще чати'}</button>}
      </> : <Empty title={nav.chatQuery ? 'Чатів не знайдено' : 'Архів поки порожній'} text={nav.chatQuery ? 'Спробуйте іншу назву.' : 'Щойно збережені чати з’являться тут.'} />}
    </section> : <section className="content chat-view" aria-busy={isLoadingMessages}>
      {isLoadingMessages ? <Loading label="Завантажуємо повідомлення…" /> : messages.length ? isSearch ?
        <SearchResults messages={messages} query={submittedQuery} onOpen={nav.openResult} /> : <>
          {messageCursor && <button className="load-more" type="button" disabled={isLoadingOlder} onClick={() => void loadOlder()}>{isLoadingOlder ? 'Завантажуємо…' : 'Старіші повідомлення'}</button>}
          <MessageHistory messages={messages} onImageLoad={scrollToLatest} ref={history} focusedMessage={nav.focusedMessage} />
          <div ref={end} />
        </> : isSearch ? <Empty title={submittedQuery ? `За запитом “${submittedQuery}” нічого не знайдено` : 'За вибраними фільтрами нічого не знайдено'} text="Спробуйте інші слова або змініть область пошуку."><button className="load-more" type="button" onClick={nav.clearSearch}>Очистити пошук</button></Empty> : <Empty title="У чаті ще немає повідомлень" text="Збережені повідомлення з’являться тут." />}
      {!isSearch && !isLoadingMessages && messages.length > 0 && (nav.awayFromLatest || nav.hasTrimmedNewer) && <button className="to-latest" type="button" onClick={nav.latest}>↓ До останніх</button>}
    </section>}
  </main>;
}
function Loading({ label }: { label: string }) { return <div className="loading" role="status"><span className="spinner" /><p>{label}</p></div>; }
function Empty({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) { return <div className="empty" role="status"><span aria-hidden="true">⌕</span><h2>{title}</h2><p>{text}</p>{children}</div>; }
