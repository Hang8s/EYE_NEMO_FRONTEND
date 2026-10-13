import { useEffect, useState } from 'react';
import { api, isAbort } from './api';
import { AttachmentView } from './AttachmentView';
import type { VersionPage } from './types';

const dateFormat = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });

export function VersionHistory({ id, onImageLoad }: { id: string; onImageLoad: () => void }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [page, setPage] = useState<VersionPage>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setPage(undefined);
    api<VersionPage>(`/mini-api/messages/${id}/versions?limit=30${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, controller.signal)
      .then(result => { if (!controller.signal.aborted) setPage(result); })
      .catch(cause => { if (!controller.signal.aborted && !isAbort(cause)) setError((cause as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, cursor, retry]);
  return <div className="message-versions" aria-busy={loading}>
    {loading && <p role="status">Завантажуємо історію…</p>}
    {error && <div role="alert">{error}<button type="button" onClick={() => setRetry(value => value + 1)}>Спробувати ще раз</button></div>}
    {page && <>
      {!page.has_original && <span className="missing-original">Оригінал не отримано</span>}
      {page.items.map(version => <section className="message-version" key={version.id} data-version-id={version.id}>
        <span className="version-label">{version.kind === 'original' ? 'Оригінал' : version.kind === 'legacy' ? 'Збережена версія' : 'Відредаговано'} · {version.kind === 'edit' && !version.edited_at ? `час невідомий · отримано ${dateFormat.format(new Date(version.observed_at))}` : dateFormat.format(new Date(version.edited_at || version.observed_at))}</span>
        <p>{version.text || version.caption || `[${version.message_type || 'unknown'}]`}</p>
        {version.attachments.map(file => <AttachmentView key={file.id} file={file} onImageLoad={onImageLoad} />)}
      </section>)}
      {page.next_cursor && <button type="button" className="load-more" onClick={() => setCursor(page.next_cursor!)}>Наступні версії</button>}
    </>}
    {cursor && <button type="button" className="load-more" onClick={() => setCursor(null)}>На початок історії</button>}
  </div>;
}
