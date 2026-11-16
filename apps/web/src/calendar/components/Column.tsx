import { useMemo } from 'react';
import type { Event } from '../../types';
import { iso } from '../../lib/dates';
import { EventPill } from './EventLabel';

type Props = {
  year: number;
  month: number;
  events: Event[];
  onSelect: (event: Event) => void;
};

export function Column({ year, month, events, onSelect }: Props) {
  const days = new Date(year, month + 1, 0).getDate();
  const rows = useMemo(() => {
    const result: Event[][] = [];
    for (const event of events) {
      const row = result.find(items => items.every(item => item.endDate < event.startDate || event.endDate < item.startDate));
      if (row) row.push(event);
      else result.push([event]);
    }
    return result;
  }, [events]);

  return <div className="column-scroll panel"><div className="column-calendar" style={{ gridTemplateColumns: `repeat(${days}, minmax(54px, 1fr))` }}>
    {Array.from({ length: days }, (_, index) => <div className="column-day" key={index}>
      <small>{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(year, month, index + 1).getDay()]}</small>
      <b>{index + 1}</b>
    </div>)}
    {rows.length ? rows.map((row, index) => <div className="event-row" key={index} style={{
      gridColumn: `1 / span ${days}`,
      gridTemplateColumns: `repeat(${days}, minmax(54px, 1fr))`,
    }}>{row.map(event => {
      const start = event.startDate < iso(year, month, 1) ? 1 : Number(event.startDate.slice(8));
      const end = event.endDate > iso(year, month, days) ? days : Number(event.endDate.slice(8));
      return <div key={event.id} style={{ gridColumn: `${start} / span ${end - start + 1}` }}>
        <EventPill event={event} onClick={() => onSelect(event)} />
      </div>;
    })}</div>) : <div className="column-empty" style={{ gridColumn: `1 / span ${days}` }}>No events this month</div>}
  </div></div>;
}
