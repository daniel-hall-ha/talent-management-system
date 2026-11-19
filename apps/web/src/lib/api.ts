export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('Cannot connect to the API. Check the web service and backend connection.');
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(response.status === 404
      ? 'API route not found. The web service must forward /api requests to the backend.'
      : `API returned an unexpected response (HTTP ${response.status}).`);
  }
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.error || 'Request failed', response.status);
  return data as T;
}
