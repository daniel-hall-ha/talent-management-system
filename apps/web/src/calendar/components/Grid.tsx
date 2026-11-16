import type { CSSProperties } from 'react';
import type { Event } from '../../types';
import { iso, today } from '../../lib/dates';
import { EventLabel, eventCardHeight } from './EventLabel';

type Props = {
  year: number;
  month: number;
  events: Event[];
  onSelect: (event: Event) => void;
};

type Segment = { event: Event; start: number; end: number; lane: number };

function segmentsForWeek(events: Event[], year: number, month: number, weekStart: number, days: number): Segment[] {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const weekEnd = weekStart + 6;
  const segments = events.flatMap(event => {
    const eventStart = event.startDate < `${monthKey}-01` ? 1
      : event.startDate.startsWith(monthKey) ? Number(event.startDate.slice(8)) : days + 1;
    const eventEnd = event.endDate > iso(year, month, days) ? days
      : event.endDate.startsWith(monthKey) ? Number(event.endDate.slice(8)) : 0;
    const start = Math.max(1, weekStart, eventStart);
    const end = Math.min(days, weekEnd, eventEnd);
    return start <= end ? [{ event, start, end, lane: 0 }] : [];
  }).sort((a, b) => a.start - b.start || b.end - a.end || a.event.title.localeCompare(b.event.title));

  const laneEnds: number[] = [];
  for (const segment of segments) {
    let lane = laneEnds.findIndex(end => end < segment.start);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(segment.end);
    } else {
      laneEnds[lane] = segment.end;
    }
    segment.lane = lane;
  }
  return segments;
}

export function Grid({ year, month, events, onSelect }: Props) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((firstWeekday + days) / 7);

  return <div className="calendar panel">
    <div className="weekday-row">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}</div>
    <div className="calendar-weeks">{Array.from({ length: weeks }, (_, week) => {
      const weekStart = week * 7 - firstWeekday + 1;
      const segments = segmentsForWeek(events, year, month, weekStart, days);
      const laneCount = Math.max(0, ...segments.map(segment => segment.lane + 1));
      const laneHeights = Array.from({ length: laneCount }, (_, lane) =>
        Math.max(...segments.filter(segment => segment.lane === lane).map(segment => eventCardHeight(segment.event)))
      );
      const laneTops = laneHeights.map((_, lane) => 43 + laneHeights.slice(0, lane).reduce((sum, height) => sum + height + 8, 0));
      const contentHeight = laneCount ? laneTops[laneCount - 1] + laneHeights[laneCount - 1] + 9 : 118;
      const weekStyle = { '--week-content-height': `${contentHeight}px` } as CSSProperties;
      return <div className="calendar-week" key={week} style={weekStyle}>
        <div className="week-days">{Array.from({ length: 7 }, (_, index) => {
          const day = weekStart + index;
          const valid = day > 0 && day <= days;
          const date = iso(year, month, day);
          return <div className={`day ${valid ? '' : 'outside'}`} key={index}>
            <span className={valid && date === iso(today.getFullYear(), today.getMonth(), today.getDate()) ? 'today' : ''}>{valid ? day : ''}</span>
          </div>;
        })}</div>
        <div className="week-events">{segments.map(({ event, start, end, lane }) =>
          <button key={event.id} className="grid-event" style={{
            background: event.color,
            left: `calc(${(start - weekStart) / 7 * 100}% + 4px)`,
            width: `calc(${(end - start + 1) / 7 * 100}% - 8px)`,
            top: laneTops[lane],
            height: eventCardHeight(event),
          }} onClick={() => onSelect(event)} title={`${event.title} — ${event.description}`}><EventLabel event={event} /></button>
        )}</div>
      </div>;
    })}</div>
  </div>;
}
