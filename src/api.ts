const base = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/+$/, '');
export const headers = () => ({ 'X-Telegram-Init-Data': window.Telegram?.WebApp.initData || '' });
export const apiUrl = (path: string) => new URL(path, `${base}/`).toString();

export async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(apiUrl(path), { headers: headers(), signal });
  if (!response.ok) throw new Error(response.status === 401 ? 'Відкрийте застосунок через Telegram.' : 'Не вдалося завантажити дані.');
  return response.json() as Promise<T>;
}

export function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
