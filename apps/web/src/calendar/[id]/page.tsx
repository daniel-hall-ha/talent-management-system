import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Event } from '../../types';
import type { RoutePath } from '../../routes';
import { EventForm } from '../components/EventForm';
import { EventDetail } from '../components/EventDetail';

export function EventPage({ eventId, mode, can, navigate }: { eventId: string; mode: 'view' | 'edit'; can: (permission: string) => boolean; navigate: (path: RoutePath) => void }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<Event>(`/events/${encodeURIComponent(eventId)}`).then(value => { if (active) setEvent(value); })
      .catch(cause => { if (active) setError((cause as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId]);

  async function save(value: unknown) {
    setBusy(true);
    setError('');
    try {
      await api(`/events/${encodeURIComponent(eventId)}`, { method: 'PUT', body: JSON.stringify(value) });
      navigate('/calendar');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event || !window.confirm(`Delete ${event.title}?`)) return;
    try {
      await api(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
      navigate('/calendar');
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  if (loading) return <div className="loading">Loading event…</div>;
  if (!event) return <div className="event-page"><div className="form-error">{error || 'Event not found'}</div><button className="secondary" onClick={() => navigate('/calendar')}>Back to calendar</button></div>;
  if (mode === 'view') return <><EventDetail event={event} can={can} onClose={() => navigate('/calendar')} onEdit={() => navigate(`/edit?id=${encodeURIComponent(eventId)}`)} onDelete={remove} />{error && <div className="form-error">{error}</div>}</>;
  return <EventForm event={event} canEditKeys={can('CD_KEY_EDIT')} onClose={() => navigate('/calendar')} onSave={save} busy={busy} error={error} />;
}
