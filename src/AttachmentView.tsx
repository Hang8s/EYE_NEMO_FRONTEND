import { useCallback, useEffect, useRef, useState } from 'react';
import { MediaViewer } from './MediaViewer';
import { isAbort } from './api';
import { mediaBlob } from './media-cache';
import type { Attachment } from './types';

export function isImage(file: Attachment) { return file.type === 'photo' || file.mime_type?.startsWith('image/') === true || (file.type === 'animation' && file.file_name?.toLowerCase().endsWith('.gif') === true); }
export function isVideo(file: Attachment) { return file.mime_type?.startsWith('video/') === true || file.type === 'video' || file.type === 'video_note' || (file.type === 'animation' && !isImage(file)); }

export function mediaFileName(file: Attachment) {
  if (file.file_name) return file.file_name;
  if (isVideo(file)) {
    const extension = ({ 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/ogg': 'ogv' } as Record<string, string>)[file.mime_type || ''] || 'mp4';
    return `${file.type === 'document' ? 'video' : file.type}.${extension}`;
  }
  return file.type === 'animation' ? 'animation.gif' : 'photo.jpg';
}

export function AttachmentView({ file, compact = false, onImageLoad }: { file: Attachment; compact?: boolean; onImageLoad?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [expired, setExpired] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const closeViewer = useCallback(() => setViewerOpen(false), []);
  const element = useRef<HTMLDivElement>(null);
  const image = isImage(file);
  const video = isVideo(file);
  const manualMedia = video || file.type === 'animation';
  const automatic = image && !manualMedia && file.type !== 'document';
  useEffect(() => {
    if (!automatic || !file.available) return;
    if (!('IntersectionObserver' in window)) { setRequested(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setRequested(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    if (element.current) observer.observe(element.current);
    return () => observer.disconnect();
  }, [automatic, file.available]);
  useEffect(() => {
    if (!file.expires_at) return;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      const remaining = Date.parse(file.expires_at!) - Date.now();
      if (remaining <= 0) setExpired(true);
      else timer = setTimeout(check, Math.min(remaining, 2_147_483_647));
    };
    check();
    return () => clearTimeout(timer);
  }, [file.expires_at]);
  useEffect(() => {
    if (!requested || !file.available || expired) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    void mediaBlob(file, controller.signal).then(blob => {
      if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    }).catch(error => { if (!isAbort(error)) setFailed(true); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [requested, file.available, file.id, file.expires_at, expired]);
  const badge = file.saved_by_reply ? <b className="reply-saved-badge">Збережено reply</b> : null;
  const name = file.file_name || file.type;
  return <div ref={element}>
    {!file.available || failed || expired ? <div className="attachment unavailable"><span>−</span>{name}<small>{expired ? 'Строк зберігання завершено' : 'Файл недоступний'}</small>{badge}</div>
      : manualMedia ? <button className="attachment" type="button" aria-label={video ? 'Відкрити відео повністю' : 'Відкрити анімацію повністю'} onClick={() => { if (requested && !url) return; setRequested(true); setViewerOpen(true); }} aria-disabled={requested && !url} aria-busy={requested && !url}><span>{requested && !url ? '…' : '▶'}</span>{name}<small>{requested && !url ? 'Завантажуємо файл' : video ? 'Переглянути відео' : 'Переглянути анімацію'}</small>{badge}</button>
        : !url ? <button className="attachment" type="button" onClick={() => setRequested(true)} disabled={requested}><span>{requested ? '…' : '↓'}</span>{name}<small>{requested ? 'Завантажуємо файл' : 'Завантажити файл'}</small>{badge}</button>
        : image ? <button className="attachment attachment-image" type="button" onClick={() => setViewerOpen(true)} aria-label="Відкрити фото повністю"><img onLoad={onImageLoad} style={{ width: compact ? '100%' : undefined, maxWidth: compact ? 180 : '100%', maxHeight: compact ? 130 : 420, objectFit: compact ? 'cover' : 'contain' }} src={url} alt={file.file_name || 'Фото'} />{badge}</button>
          : <a className="attachment" href={url} download={file.file_name} target="_blank" rel="noreferrer"><span>↗</span>{name}<small>Відкрити файл</small>{badge}</a>}
    {viewerOpen && url && (image || video) && file.available && !failed && !expired && <MediaViewer url={url} fileName={mediaFileName(file)} video={video} onClose={closeViewer} />}
  </div>;
}
