import { apiUrl, headers } from './api';
import type { Attachment } from './types';
import { api } from './api';

type MediaLink = { url: string; direct: boolean; valid_until: string | null };

async function download(file: Attachment, signal: AbortSignal): Promise<Blob> {
  // Resolve ownership once, then fetch private Blob bytes without forwarding Telegram auth.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const link = await api<MediaLink>(`/mini-api/media/${file.id}/url`, signal);
    const response = await fetch(link.direct ? link.url : apiUrl(link.url), {
      signal, ...(link.direct ? { credentials: 'omit' as const } : { headers: headers() }),
    });
    if (link.direct && (response.status === 401 || response.status === 403) && !attempt) continue;
    if (!response.ok) throw new Error('Media unavailable');
    return response.blob();
  }
  throw new Error('Media unavailable');
}

const MAX_BYTES = 32 * 1024 * 1024;
const cache = new Map<string, { blob: Blob; expires: number }>();
const pending = new Map<string, { promise: Promise<Blob>; controller: AbortController; users: number }>();
let bytes = 0;

function remove(key: string) {
  const value = cache.get(key);
  if (value) bytes -= value.blob.size;
  cache.delete(key);
}

export function clearMediaCache() {
  cache.clear();
  bytes = 0;
  for (const entry of pending.values()) entry.controller.abort();
  pending.clear();
}

export function cacheBytes() { return bytes; }

export async function mediaBlob(file: Attachment, signal: AbortSignal): Promise<Blob> {
  const expires = file.expires_at ? Date.parse(file.expires_at) : Infinity;
  if (!file.available || expires <= Date.now()) throw new Error('Media expired');
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  // Include authentication scope so different Telegram users never share cached files.
  const key = `${headers()['X-Telegram-Init-Data']}:${file.id}`;
  for (const [id, value] of cache) if (value.expires <= Date.now()) remove(id);
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit.blob;
  }
  let entry = pending.get(key);
  if (!entry) {
    const controller = new AbortController();
    const current = { controller, users: 0, promise: Promise.resolve(new Blob()) };
    current.promise = download(file, controller.signal)
      .then(blob => {
        if (expires <= Date.now()) throw new Error('Media expired');
        if (!controller.signal.aborted && blob.size <= MAX_BYTES) {
          remove(key);
          while (bytes + blob.size > MAX_BYTES && cache.size) remove(cache.keys().next().value!);
          cache.set(key, { blob, expires });
          bytes += blob.size;
        }
        return blob;
      }).finally(() => { if (pending.get(key) === current) pending.delete(key); });
    entry = current;
    pending.set(key, entry);
  }
  const shared = entry;
  shared.users += 1;
  return new Promise<Blob>((resolve, reject) => {
    let finished = false;
    const release = () => {
      if (finished) return;
      finished = true;
      signal.removeEventListener('abort', abort);
      shared.users -= 1;
      if (!shared.users && pending.get(key) === shared) {
        pending.delete(key);
        shared.controller.abort();
      }
    };
    const abort = () => { release(); reject(new DOMException('Aborted', 'AbortError')); };
    signal.addEventListener('abort', abort, { once: true });
    shared.promise.then(blob => { if (!finished) { release(); resolve(blob); } }, error => { if (!finished) { release(); reject(error); } });
  });
}
