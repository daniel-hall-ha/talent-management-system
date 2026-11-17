export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const backend = import.meta.env.PROD ? (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '') : '';
  const response = await fetch(`${backend}/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}
