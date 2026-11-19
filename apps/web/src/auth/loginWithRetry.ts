import { api, ApiError } from '../lib/api';
import type { Me } from '../types';

export async function loginWithRetry(loginId: string, password: string): Promise<Me> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const timeoutError = () => new Error('The server is still unavailable after one minute. Please try signing in again.');

  async function retry502<T>(path: string, init?: RequestInit): Promise<T> {
    while (!controller.signal.aborted) {
      try {
        return await api<T>(path, { ...init, signal: controller.signal });
      } catch (error) {
        if (controller.signal.aborted) throw timeoutError();
        if (!(error instanceof ApiError) || error.status !== 502) throw error;
        await new Promise<void>(resolve => {
          const finish = () => {
            clearTimeout(timer);
            controller.signal.removeEventListener('abort', finish);
            resolve();
          };
          const timer = setTimeout(finish, 3000);
          controller.signal.addEventListener('abort', finish, { once: true });
        });
      }
    }
    throw timeoutError();
  }

  try {
    await retry502('/login', { method: 'POST', body: JSON.stringify({ loginId, password }) });
    // Once login succeeds, retry only the session lookup, not the password submission.
    return await retry502<Me>('/me');
  } finally {
    clearTimeout(timeout);
  }
}
