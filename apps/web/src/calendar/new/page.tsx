import { useState } from 'react';
import { api } from '../../lib/api';
import type { RoutePath } from '../../routes';
import { EventForm } from '../components/EventForm';

export function NewEventPage({ can, navigate }: { can: (permission: string) => boolean; navigate: (path: RoutePath) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(value: unknown) {
    setBusy(true);
    setError('');
    try {
      await api('/events', { method: 'POST', body: JSON.stringify(value) });
      navigate('/calendar');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <EventForm event={null} canEditKeys={can('CD_KEY_EDIT')} onClose={() => navigate('/calendar')} onSave={save} busy={busy} error={error} />;
}
