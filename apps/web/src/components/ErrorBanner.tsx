import { X } from 'lucide-react';

export function ErrorBanner({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  if (!error) return null;
  return <div className="error-banner">{error}<button onClick={onDismiss} aria-label="Dismiss error"><X size={16} /></button></div>;
}
