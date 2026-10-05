// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cacheBytes, clearMediaCache, mediaBlob } from './media-cache';
import type { Attachment } from './types';

const file: Attachment = { id: 'file', type: 'photo', available: true, saved_by_reply: false };
const link = { url: 'https://store.private.blob.vercel-storage.com/file?signed=1', direct: true, valid_until: null };
afterEach(() => { clearMediaCache(); vi.unstubAllGlobals(); });

describe('media cache', () => {
  it('shares concurrent requests and reuses the downloaded bytes', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => link, blob: async () => new Blob(['image']) });
    vi.stubGlobal('fetch', fetch);
    const [first, second] = await Promise.all([mediaBlob(file, new AbortController().signal), mediaBlob(file, new AbortController().signal)]);
    expect(first).toBe(second);
    await mediaBlob(file, new AbortController().signal);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers).toBeUndefined();
    expect(fetch.mock.calls[1][1].credentials).toBe('omit');
  });
  it('aborting one subscriber does not cancel another', async () => {
    let finish!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/url') ? new Promise(resolve => { finish = resolve; }) : Promise.resolve({ ok: true, blob: async () => new Blob(['image']) })));
    const first = new AbortController();
    const aborted = mediaBlob(file, first.signal);
    const other = mediaBlob(file, new AbortController().signal);
    const assertion = expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
    first.abort();
    finish({ ok: true, json: async () => link });
    await assertion;
    expect((await other).size).toBe(5);
  });
  it('rejects expired files without fetching', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(mediaBlob({ ...file, expires_at: new Date(Date.now() - 1000).toISOString() }, new AbortController().signal)).rejects.toThrow('expired');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('bounds cached blobs to 32 MB using eviction', async () => {
    const blob = new Blob([new Uint8Array(20 * 1024 * 1024)]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => link, blob: async () => blob }));
    await mediaBlob(file, new AbortController().signal);
    await mediaBlob({ ...file, id: 'second' }, new AbortController().signal);
    expect(cacheBytes()).toBe(blob.size);
    expect(cacheBytes()).toBeLessThanOrEqual(32 * 1024 * 1024);
  });
  it('refreshes an expired signed URL once without proxying bytes', async () => {
    let reads = 0;
    const fetch = vi.fn((url: string) => Promise.resolve(url.endsWith('/url') ? { ok: true, json: async () => link } : ++reads === 1 ? { ok: false, status: 403 } : { ok: true, blob: async () => new Blob(['image']) }));
    vi.stubGlobal('fetch', fetch);
    expect((await mediaBlob(file, new AbortController().signal)).size).toBe(5);
    expect(fetch).toHaveBeenCalledTimes(4);
  });
});
