export function ServiceStatus({ ready }: { ready: boolean }) {
  return <div className={`service-status${ready ? ' service-status-ready' : ''}`} role="status" aria-live="polite">
    {ready ? 'Services ready' : 'Connecting…'}
  </div>;
}
