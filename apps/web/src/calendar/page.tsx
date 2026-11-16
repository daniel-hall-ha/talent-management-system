import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Columns3, Grid2X2, List as ListIcon, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { months, today } from '../lib/dates';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Event } from '../types';
import { Grid } from './components/Grid';
import { Column } from './components/Column';
import { List } from './components/List';
import type { RoutePath } from '../routes';

export function CalendarPage({ can, navigate }: { can: (permission: string) => boolean; navigate: (path: RoutePath) => void }) {
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [view, setView] = useState<'grid' | 'column' | 'list'>('grid');
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState('');
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const importMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function closeMenu(event: MouseEvent) { if (!importMenuRef.current?.contains(event.target as Node)) setImportMenuOpen(false); }
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  async function load() {
    try {
      setEvents(await api<Event[]>(`/events?month=${year}-${String(month + 1).padStart(2, '0')}`));
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  useEffect(() => { void load(); }, [month, year]);

  function changeMonth(offset: number) {
    const date = new Date(year, month + offset, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
  }

  return <>
    <div className="page-head"><h1>SOW Calendar</h1><div className="head-actions">
      <div className="month-controls">
        <button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
        <select aria-label="Month" value={month} onChange={event => setMonth(Number(event.target.value))}>{months.map((name, index) => <option value={index} key={name}>{name}</option>)}</select>
        <select aria-label="Year" value={year} onChange={event => setYear(Number(event.target.value))}>{Array.from({ length: 11 }, (_, index) => today.getFullYear() - 5 + index).map(value => <option key={value}>{value}</option>)}</select>
        <button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
      </div>
      <div className="segmented"><button className={view === 'grid' ? 'chosen' : ''} onClick={() => setView('grid')}><Grid2X2 size={16} /> Grid View</button><button className={view === 'column' ? 'chosen' : ''} onClick={() => setView('column')}><Columns3 size={16} /> Column View</button><button className={view === 'list' ? 'chosen' : ''} onClick={() => setView('list')}><ListIcon size={16} /> List View</button></div>
      {can('SOW_ADD') && <div className="split-create" ref={importMenuRef}><button className="primary split-create-main" onClick={() => navigate('/add')}><Plus size={17} /> New Event</button><button className="primary split-create-arrow" aria-label="More event actions" aria-expanded={importMenuOpen} onClick={() => setImportMenuOpen(open => !open)}><ChevronDown size={17} /></button>{importMenuOpen && <div className="split-create-menu"><button onClick={() => { setImportMenuOpen(false); navigate('/import'); }}>Import Events</button></div>}</div>}
    </div></div>
    <ErrorBanner error={error} onDismiss={() => setError('')} />
    {view === 'grid' ? <Grid year={year} month={month} events={events} onSelect={event => navigate(`/view?id=${encodeURIComponent(event.id)}`)} /> : view === 'column' ? <Column year={year} month={month} events={events} onSelect={event => navigate(`/view?id=${encodeURIComponent(event.id)}`)} /> : <List events={events} onSelect={event => navigate(`/view?id=${encodeURIComponent(event.id)}`)} />}
  </>;
}
