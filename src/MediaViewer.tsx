import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './photo-viewer.css';

type Props = { url: string; fileName: string; onClose: () => void; video?: boolean };

export function MediaViewer({ url, fileName, onClose, video = false }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const downloadLink = useRef<HTMLAnchorElement>(null);
  const [failed, setFailed] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const label = video ? 'відео' : 'фото';

  useLayoutEffect(() => {
    const node = dialog.current!;
    const media = player.current;
    // Strict Mode replays effects after cleanup; restore the released source.
    if (media && !media.hasAttribute('src')) media.src = url;
    const previousFocus = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    node.showModal();
    closeButton.current?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      if (media) {
        media.pause();
        media.removeAttribute('src');
        media.load();
      }
      node.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [url]);

  return createPortal(
    <dialog ref={dialog} className="photo-viewer" aria-label={`Перегляд ${label}`} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={event => {
      if (video || event.key !== 'Tab') return;
      event.preventDefault();
      // With two controls, either Tab direction moves to the other control.
      const next = document.activeElement === closeButton.current ? downloadLink.current : closeButton.current;
      next?.focus({ preventScroll: true });
    }}>
      <div className="photo-viewer-toolbar">
        <a ref={downloadLink} className="photo-viewer-action" href={url} download={fileName}>↓ Скачати</a>
        <button ref={closeButton} className="photo-viewer-action" type="button" aria-label={`Закрити ${label}`} onClick={onClose}>✕</button>
      </div>
      {failed ? <p className="photo-viewer-error" role="alert">Не вдалося показати {label}. Спробуйте скачати файл.</p>
        : video ? <video ref={player} className="photo-viewer-video" src={url} controls playsInline aria-label={fileName} onError={() => { player.current?.pause(); setFailed(true); }} />
          : <img className="photo-viewer-image" src={url} alt={fileName} onError={() => setFailed(true)} />}
    </dialog>, document.body,
  );
}
