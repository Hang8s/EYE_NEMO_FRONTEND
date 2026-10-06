import { useLayoutEffect, useRef, useState } from 'react';

export function VoicePlayer({ url, fileName, onLoad }: { url: string; fileName: string; onLoad?: () => void }) {
  const player = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);

  useLayoutEffect(() => {
    const media = player.current;
    if (!media) return;
    // Restore the source when Strict Mode replays the effect after cleanup.
    if (!media.hasAttribute('src')) media.src = url;
    return () => {
      media.pause();
      media.removeAttribute('src');
      media.load();
    };
  }, [url, failed]);

  return <>
    {failed ? <p role="alert">Не вдалося відтворити голосове. Спробуйте скачати файл.</p>
      : <audio ref={player} src={url} controls preload="metadata" aria-label="Голосове повідомлення" onLoadedMetadata={onLoad} onError={() => setFailed(true)} />}
    <a href={url} download={fileName}>↓ Скачати</a>
  </>;
}
