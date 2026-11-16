import type { Event } from '../../types';

export const eventCardHeight = (_event: Event) => 60;

export function EventLabel({ event }: { event: Event }) {
  return <span className="event-label">
    <span className="event-title">{event.title}</span>
    <span className="event-description">{event.description}</span>
  </span>;
}

export function EventPill({ event, onClick }: { event: Event; onClick: () => void }) {
  return <button className="event-pill" style={{ background: event.color, height: eventCardHeight(event) }} onClick={onClick} title={`${event.title} — ${event.description}`}>
    <EventLabel event={event} />
  </button>;
}
