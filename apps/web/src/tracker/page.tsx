import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, FilePenLine, ListFilter, X } from 'lucide-react';
import { api } from '../lib/api';
import { months, today } from '../lib/dates';
import { numberedDeliverables } from '../lib/deliverables';
import { ErrorBanner } from '../components/ErrorBanner';
import { TrackerModal } from './TrackerModal';
import { TrackerFilterModal, emptyTrackerFilters, type TrackerFilters } from './TrackerFilterModal';
import type { TrackerRow } from './types';

export function TrackerPage({ can }: { can: (permission: string) => boolean }) {
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [selected, setSelected] = useState<TrackerRow | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<TrackerFilters>(emptyTrackerFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const talentOptions = useMemo(() => Array.from(new Map(rows.map(row => [row.talentId, { id: row.talentId, name: row.talent }])).values()).sort((a, b) => a.name.localeCompare(b.name)), [rows]);
  const visibleRows = useMemo(() => rows.filter(row =>
    (!filters.talentId || row.talentId === filters.talentId) &&
    (!filters.deliverable || row.deliverable === filters.deliverable) &&
    (!filters.status || row.status === filters.status)
  ), [rows, filters]);
  const deliverableLabels = useMemo(() => {
    const groups = new Map<string, TrackerRow[]>();
    for (const row of rows) {
      const key = `${row.eventId}:${row.talentId}`;
      groups.set(key, [...(groups.get(key) || []), row]);
    }
    const labels = new Map<string, string>();
    for (const group of groups.values()) {
      numberedDeliverables(group).forEach((label, index) => labels.set(`${group[index].eventId}:${group[index].id}`, label));
    }
    return labels;
  }, [rows]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSelected(null);
    api<TrackerRow[]>(`/tracker?month=${year}-${String(month + 1).padStart(2, '0')}`, { signal: controller.signal })
      .then(setRows)
      .catch(cause => { if (!controller.signal.aborted) setError((cause as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, year]);
  function changeMonth(offset: number) {
    const date = new Date(year, month + offset, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
  }
  function open(row: TrackerRow, nextMode: 'view' | 'edit') {
    setSelected(row); setMode(nextMode); setError('');
  }
  async function save(value: { status: 'Pending' | 'Done'; links: string[] }) {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      await api(`/tracker/${encodeURIComponent(selected.eventId)}/${encodeURIComponent(selected.id)}`, { method: 'PATCH', body: JSON.stringify(value) });
      const updated = { ...selected, ...value };
      setRows(current => current.map(row => row.eventId === updated.eventId && row.id === updated.id ? updated : row));
      setSelected(null);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="tracker-page"><div className="page-head"><h1>SOW Tracker</h1><div className="head-actions"><div className="month-controls">
      <button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
      <select aria-label="Month" value={month} onChange={event => setMonth(Number(event.target.value))}>{months.map((name, index) => <option value={index} key={name}>{name}</option>)}</select>
      <select aria-label="Year" value={year} onChange={event => setYear(Number(event.target.value))}>{Array.from({ length: 11 }, (_, index) => today.getFullYear() - 5 + index).map(value => <option key={value}>{value}</option>)}</select>
      <button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
    </div><button className="secondary tracker-filter-button" onClick={() => setFilterOpen(true)}><ListFilter size={16} /> Filter</button></div></div>
    {(filters.talentId || filters.deliverable || filters.status) && <div className="tracker-filter-chips">
      {filters.talentId && <button type="button" onClick={() => setFilters(current => ({ ...current, talentId: '', talentName: '' }))}>{filters.talentName}<X size={13} aria-label="Remove talent filter" /></button>}
      {filters.deliverable && <button type="button" onClick={() => setFilters(current => ({ ...current, deliverable: '' }))}>{filters.deliverable}<X size={13} aria-label="Remove deliverable filter" /></button>}
      {filters.status && <button type="button" onClick={() => setFilters(current => ({ ...current, status: '' }))}>{filters.status}<X size={13} aria-label="Remove status filter" /></button>}
    </div>}
    <ErrorBanner error={selected ? '' : error} onDismiss={() => setError('')} />
    {loading ? <div className="loading">Loading tracker…</div> : <div className="panel tracker-table-wrap"><table className="data-table"><thead><tr><th>No.</th><th>Title</th><th>Description</th><th>Campaign Date</th><th>Talent</th><th>Status</th><th>Submission Date</th><th>Actions</th></tr></thead><tbody>
      {visibleRows.map((row, index) => <tr key={`${row.eventId}-${row.id}`}><td>{index + 1}</td><td><strong>{row.title}</strong><span className="tracker-deliverable">{deliverableLabels.get(`${row.eventId}:${row.id}`) || row.deliverable}</span></td><td>{row.description}</td><td>{row.startDate} - {row.endDate}</td><td>{row.talent}</td><td><span className={`tracker-status ${row.status.toLowerCase()}`}>{row.status}</span></td><td>{row.submissionDate || '—'}</td><td><div className="tracker-actions"><button type="button" aria-label={`Edit ${row.title} for ${row.talent}`} title="Edit" disabled={!can('TRACKER_EDIT')} onClick={() => open(row, 'edit')}><FilePenLine size={17} /></button><button type="button" aria-label={`View ${row.title} for ${row.talent}`} title="View" onClick={() => open(row, 'view')}><Eye size={17} /></button></div></td></tr>)}
      {!visibleRows.length && <tr><td colSpan={8} className="tracker-empty">{rows.length ? 'No deliverables match the filters' : 'No deliverables this month'}</td></tr>}
    </tbody></table></div>}
    {filterOpen && <TrackerFilterModal value={filters} talents={talentOptions} onApply={value => { setFilters(value); setFilterOpen(false); }} onClose={() => setFilterOpen(false)} />}
    {selected && <TrackerModal key={`${selected.eventId}-${selected.id}-${mode}`} row={selected} deliverableLabel={deliverableLabels.get(`${selected.eventId}:${selected.id}`) || selected.deliverable} mode={mode} busy={busy} error={error} onClose={() => { setSelected(null); setError(''); }} onSave={save} />}
  </div>;
}
