export function ServiceStatus({ ready }: { ready: boolean }) {
  if (ready) return null;
  return <div className="service-status" role="status" aria-live="polite">Connecting…</div>;
}
