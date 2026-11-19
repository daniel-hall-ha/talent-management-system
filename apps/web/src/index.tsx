import { useEffect, useState } from 'react';
import { api, ApiError } from './lib/api';
import type { Me } from './types';
import { Login } from './auth/Login';
import { Routes } from './routes';
import { wakeBackend } from './lib/wakeBackend';

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const wakeController = new AbortController();
    const wakeTimeout = window.setTimeout(() => wakeController.abort(), 120_000);
    if (import.meta.env.PROD) {
      void wakeBackend(wakeController.signal).catch(() => {}).finally(() => window.clearTimeout(wakeTimeout));
    } else window.clearTimeout(wakeTimeout);
    let stopped = false;
    let retry: number | undefined;
    let controller: AbortController;
    async function connect() {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20_000);
      try {
        const user = await api<Me>('/me', { signal: controller.signal, cache: 'no-store' });
        if (!stopped) { setMe(user); setReady(true); }
      } catch (error) {
        if (stopped) return;
        // A JSON 401 means the API is awake and the visitor needs to sign in.
        if (error instanceof ApiError && error.status === 401) setReady(true);
        else retry = window.setTimeout(connect, 3000);
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void connect();
    return () => { wakeController.abort(); window.clearTimeout(wakeTimeout); stopped = true; controller?.abort(); window.clearTimeout(retry); };
  }, []);

  async function logout() {
    await api('/logout', { method: 'POST' });
    setMe(null);
  }

  if (!ready) return <div className="loading" role="status">Loading…</div>;
  if (!me) return <Login onLogin={setMe} />;
  return <Routes me={me} onLogout={logout} />;
}
