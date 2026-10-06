import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './photo-viewer.css';

type Props = { url: string; fileName: string; onClose: () => void };

export function PhotoViewer({ url, fileName, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const downloadLink = useRef<HTMLAnchorElement>(null);
  const [failed, setFailed] = useState(false);

  useLayoutEffect(() => {
    const node = dialog.current!;
    const previousFocus = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    node.showModal();
    closeButton.current?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      node.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <dialog ref={dialog} className="photo-viewer" aria-label="Перегляд фото" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      // With two controls, either Tab direction moves to the other control.
      const next = document.activeElement === closeButton.current ? downloadLink.current : closeButton.current;
      next?.focus({ preventScroll: true });
    }}>
      <div className="photo-viewer-toolbar">
        <a ref={downloadLink} className="photo-viewer-action" href={url} download={fileName}>↓ Скачати</a>
        <button ref={closeButton} className="photo-viewer-action" type="button" aria-label="Закрити фото" onClick={onClose}>✕</button>
      </div>
      {failed ? <p className="photo-viewer-error" role="alert">Не вдалося показати фото. Спробуйте скачати файл.</p>
        : <img className="photo-viewer-image" src={url} alt={fileName} onError={() => setFailed(true)} />}
    </dialog>, document.body,
  );
}
