// Send a simple cross-origin GET without needing to read the response.
export async function wakeBackend(signal: AbortSignal): Promise<void> {
  await fetch('https://talent-management-system-api.onrender.com/api/me', {
    method: 'GET', mode: 'no-cors', credentials: 'omit', cache: 'no-store', signal,
  });
}
