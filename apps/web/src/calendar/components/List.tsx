import type { Event } from '../../types';

type Props = { events: Event[]; onSelect: (event: Event) => void };

export function List({ events, onSelect }: Props) {
  return <div className="event-list-scroll panel">
    <table className="data-table">
      <thead><tr><th>Title</th><th>Description</th><th>Start date</th><th>End date</th><th>Assigned talents</th></tr></thead>
      <tbody>{events.length ? events.map(event => <tr key={event.id}>
        <td><button className="event-list-title" onClick={() => onSelect(event)}><span className="event-list-dot" style={{ background: event.color }} />{event.title}</button></td>
        <td>{event.description}</td>
        <td>{event.startDate}</td>
        <td>{event.endDate}</td>
        <td>{event.talents.length ? <div className="event-list-talents">{event.talents.map(talent => <span className="event-list-talent-chip" key={talent.id}>{talent.name}</span>)}</div> : '—'}</td>
      </tr>) : <tr><td colSpan={5} className="event-list-empty">No events this month</td></tr>}</tbody>
    </table>
  </div>;
}
