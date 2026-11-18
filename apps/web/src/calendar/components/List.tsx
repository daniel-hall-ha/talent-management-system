import type { Event } from '../../types';

type Props = { events: Event[]; onSelect: (event: Event) => void };

export function List({ events, onSelect }: Props) {
  const sorted = [...events].sort((a, b) => b.startDate.localeCompare(a.startDate) || b.endDate.localeCompare(a.endDate) || a.title.localeCompare(b.title));
  return <div className="event-list-scroll panel">
    <table className="data-table">
      <thead><tr><th>Title</th><th>Description</th><th>Start date</th><th>End date</th><th>Assigned talents</th></tr></thead>
      <tbody>{sorted.length ? sorted.map(event => <tr key={event.id} className="event-list-clickable" onClick={() => onSelect(event)}>
        <td><button type="button" className="event-list-cell event-list-title" onClick={e => { e.stopPropagation(); onSelect(event); }} aria-label={`View ${event.title}`}><span className="event-list-dot" style={{ background: event.color }} />{event.title}</button></td>
        <td><button type="button" className="event-list-cell" onClick={e => { e.stopPropagation(); onSelect(event); }} aria-label={`View ${event.title}: description`}>{event.description}</button></td>
        <td><button type="button" className="event-list-cell" onClick={e => { e.stopPropagation(); onSelect(event); }} aria-label={`View ${event.title}: start date`}>{event.startDate}</button></td>
        <td><button type="button" className="event-list-cell" onClick={e => { e.stopPropagation(); onSelect(event); }} aria-label={`View ${event.title}: end date`}>{event.endDate}</button></td>
        <td><button type="button" className="event-list-cell" onClick={e => { e.stopPropagation(); onSelect(event); }} aria-label={`View ${event.title}: assigned talents`}>{event.talents.length ? <div className="event-list-talents">{event.talents.map(talent => <span className="event-list-talent-chip" key={talent.id}>{talent.name}</span>)}</div> : '—'}</button></td>
      </tr>) : <tr><td colSpan={5} className="event-list-empty">No events this month</td></tr>}</tbody>
    </table>
  </div>;
}
