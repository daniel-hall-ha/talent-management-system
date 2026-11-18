import { useEffect, useState } from 'react';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import type { RoutePath } from '../../routes';
import type { Category, TalentAssignment } from '../../types';
import { categoryOptions } from '../../types';
import { BriefFrame } from '../components/BriefFrame';

type Talent = { id: string; name: string; email: string | null };
type ImportEvent = {
  title: string; description: string; color: string; startDate: string; endDate: string;
  categories: Category[]; keyPoints: string[]; talentIds: string[];
  talentAssignments: Record<string, TalentAssignment[]>;
  details: string; cdKeys?: { giveaway: string[]; talents: Record<string, string[]> };
};
type PreviewRow = { event?: ImportEvent; talentNames: string[]; errors: string[]; line: number };
const required = ['title', 'description', 'start_date', 'end_date', 'brief_file'];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value: string) => datePattern.test(value) && !Number.isNaN(Date.parse(value));
const split = (value: string) => value.split(';').map(item => item.trim()).filter(Boolean);
const parseObject = (value: string, field: string, errors: string[]): Record<string, unknown> => {
  if (!value.trim()) return {};
  try {
    const result: unknown = JSON.parse(value);
    if (result && typeof result === 'object' && !Array.isArray(result)) return result as Record<string, unknown>;
  } catch { /* Report the same field error below. */ }
  errors.push(`${field} must be a JSON object`);
  return {};
};
const safePath = (path: string) => !path.startsWith('/') && !path.split('/').includes('..');
const briefPreview = (html: string) => {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() || '';
  return text.length > 65 ? `${text.slice(0, 65).trimEnd()}…` : text || '—';
};

async function readImport(file: File, talents: Talent[], canEditKeys: boolean): Promise<PreviewRow[]> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('Select a .zip file');
  if (file.size > 25 * 1024 * 1024) throw new Error('ZIP file must be 25 MB or smaller');
  const zip = await JSZip.loadAsync(file);
  const csvFile = zip.file('events.csv');
  if (!csvFile) throw new Error('The ZIP must contain events.csv at its top level');
  const csv = await csvFile.async('string');
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: header => header.trim().replace(/^\uFEFF/, '') });
  if (parsed.errors.length) throw new Error(`Invalid CSV: ${parsed.errors[0].message}`);
  const missing = required.filter(field => !parsed.meta.fields?.includes(field));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}`);
  if (!parsed.data.length || parsed.data.length > 500) throw new Error('The ZIP must contain 1 to 500 events');
  const byIdentifier = new Map<string, Talent>();
  for (const talent of talents) {
    byIdentifier.set(talent.name.trim().toLowerCase(), talent);
    if (talent.email) byIdentifier.set(talent.email.trim().toLowerCase(), talent);
  }
  const results: PreviewRow[] = [];
  let totalBriefSize = 0;
  for (const [index, row] of parsed.data.entries()) {
    const errors: string[] = [];
    const title = (row.title || '').trim();
    const description = (row.description || '').trim();
    const startDate = (row.start_date || '').trim();
    const endDate = (row.end_date || '').trim();
    const color = (row.color || '').trim() || '#6979d4';
    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) errors.push('Use valid dates in YYYY-MM-DD format; end must follow start');
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) errors.push('Color must be a six-digit hex value');
    const categories = split(row.categories || '') as Category[];
    if (categories.some(category => !categoryOptions.includes(category))) errors.push('Unknown category');
    const identifiers = split(row.talent_names || row.talent_emails || '').map(identifier => identifier.toLowerCase());
    if (new Set(identifiers).size !== identifiers.length) errors.push('Duplicate talent');
    const assigned = identifiers.map(identifier => byIdentifier.get(identifier));
    if (new Set(assigned.filter(Boolean).map(talent => talent!.id)).size !== assigned.filter(Boolean).length) errors.push('Duplicate talent');
    identifiers.forEach((identifier, position) => { if (!assigned[position]) errors.push(`Talent not found: ${identifier}`); });
    const assignedIds = new Set(assigned.filter((talent): talent is Talent => Boolean(talent)).map(talent => talent.id));
    const talentAssignments: Record<string, TalentAssignment[]> = {};
    if ((row.assignments || '').trim()) {
      const byTalent = parseObject(row.assignments, 'Assignments', errors);
      for (const [identifier, value] of Object.entries(byTalent)) {
        const talent = byIdentifier.get(identifier.toLowerCase());
        if (!talent || !assignedIds.has(talent.id) || !Array.isArray(value)) { errors.push(`Invalid assignments for ${identifier}`); continue; }
        const assignments: TalentAssignment[] = [];
        for (const item of value) {
          if (!item || typeof item !== 'object' || !categoryOptions.includes(item.deliverable as Category) ||
            (item.submissionDate && (typeof item.submissionDate !== 'string' || !validDate(item.submissionDate) || item.submissionDate < startDate || item.submissionDate > endDate))) {
            errors.push(`Invalid deliverable or submission date for ${identifier}`);
          } else assignments.push({ deliverable: item.deliverable as Category, submissionDate: item.submissionDate || '' });
        }
        talentAssignments[talent.id] = assignments;
      }
    } else {
      const legacyDeliverables = parseObject(row.deliverables || '', 'Deliverables', errors);
      const legacyDates = parseObject(row.submission_dates || '', 'Submission dates', errors);
      for (const [identifier, value] of Object.entries(legacyDeliverables)) {
        const talent = byIdentifier.get(identifier.toLowerCase());
        if (!talent || !assignedIds.has(talent.id) || !Array.isArray(value) || value.some(item => !categoryOptions.includes(item as Category))) errors.push(`Invalid deliverables for ${identifier}`);
        else talentAssignments[talent.id] = (value as Category[]).map(deliverable => ({ deliverable, submissionDate: '' }));
      }
      for (const [identifier, value] of Object.entries(legacyDates)) {
        const talent = byIdentifier.get(identifier.toLowerCase());
        if (!talent || !assignedIds.has(talent.id) || typeof value !== 'string' || !validDate(value) || value < startDate || value > endDate) errors.push(`Invalid submission date for ${identifier}`);
        else if (talentAssignments[talent.id]?.length) talentAssignments[talent.id] = talentAssignments[talent.id].map(item => ({ ...item, submissionDate: value }));
        else errors.push(`Submission date for ${identifier} has no deliverable`);
      }
    }
    const briefPath = (row.brief_file || '').trim();
    if (!safePath(briefPath) || !briefPath.toLowerCase().endsWith('.html')) errors.push('Brief path must point to an HTML file inside the ZIP');
    const briefFile = safePath(briefPath) ? zip.file(briefPath) : null;
    if (!briefFile) errors.push(`Brief file missing: ${briefPath}`);
    const details = briefFile ? await briefFile.async('string') : '';
    if (!details.trim()) errors.push('Brief is empty');
    totalBriefSize += details.length;
    if (details.length > 500_000) errors.push('Brief must be 500 KB or smaller');
    let cdKeys: ImportEvent['cdKeys'];
    if ((row.cd_keys || '').trim()) {
      if (!canEditKeys) errors.push('CD key editing permission is required to import keys');
      const keyData = parseObject(row.cd_keys, 'CD keys', errors);
      const giveaway = keyData.giveaway;
      const talentKeys = keyData.talents;
      if (!Array.isArray(giveaway) || giveaway.some(key => typeof key !== 'string') || !talentKeys || typeof talentKeys !== 'object' || Array.isArray(talentKeys)) errors.push('Invalid CD keys format');
      else {
        const mapped: Record<string, string[]> = {};
        for (const [email, keys] of Object.entries(talentKeys)) {
          const talent = byIdentifier.get(email.toLowerCase());
          if (!talent || !assignedIds.has(talent.id) || !Array.isArray(keys) || keys.some(key => typeof key !== 'string')) errors.push(`Invalid CD keys for ${email}`);
          else mapped[talent.id] = keys as string[];
        }
        cdKeys = { giveaway: giveaway as string[], talents: mapped };
      }
    }
    results.push({ line: index + 2, errors, talentNames: assigned.filter((talent): talent is Talent => Boolean(talent)).map(talent => talent.name), event: {
      title, description, color, startDate, endDate, categories, keyPoints: split(row.key_points || ''),
      talentIds: assigned.filter((talent): talent is Talent => Boolean(talent)).map(talent => talent.id),
      talentAssignments, details, ...(cdKeys ? { cdKeys } : {}),
    } });
  }
  if (totalBriefSize > 20_000_000) throw new Error('Combined briefs must be 20 MB or smaller');
  return results;
}

export function ImportEventsPage({ can, navigate }: { can: (permission: string) => boolean; navigate: (path: RoutePath) => void }) {
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openBrief, setOpenBrief] = useState<ImportEvent | null>(null);
  useEffect(() => {
    if (!openBrief) return;
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setOpenBrief(null); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openBrief]);
  async function upload(file: File) {
    setBusy(true); setError(''); setRows(null); setFileName(file.name);
    try {
      const talents = await api<Talent[]>('/import/talents');
      setRows(await readImport(file, talents, can('CD_KEY_EDIT') && can('CD_KEY_VIEW_ALL')));
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!rows || rows.some(row => row.errors.length)) return;
    setBusy(true); setError('');
    try {
      await api('/import/events', { method: 'POST', body: JSON.stringify({ events: rows.map(row => row.event) }) });
      navigate('/calendar');
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="event-page import-page"><div className="page-head"><h1>Import Events</h1></div>
    {!rows ? <div className="import-upload"><label>Upload .zip file<input type="file" accept=".zip,application/zip" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label><a className="secondary sample-download" href="/sample-events-import.zip" download="sample-events-import.zip">Download sample ZIP</a></div> : <>
      <p>{fileName} · {rows.length} event{rows.length === 1 ? '' : 's'}</p>
      <div className="import-table-wrap panel"><table className="data-table"><thead><tr><th>Row</th><th>Title</th><th>Description</th><th>Dates</th><th>Color</th><th>Categories</th><th>Talents</th><th>Deliverables</th><th>Submission dates</th><th>Key points</th><th>Brief</th><th>CD keys</th><th>Status</th></tr></thead><tbody>{rows.map(row => { const event = row.event!; return <tr key={row.line}><td>{row.line}</td><td>{event.title}</td><td>{event.description}</td><td>{event.startDate} → {event.endDate}</td><td><span className="event-list-dot" style={{ background: event.color }} />{event.color}</td><td>{event.categories.join(', ') || '—'}</td><td>{row.talentNames.join(', ') || '—'}</td><td>{Object.entries(event.talentAssignments).flatMap(([id, assignments]) => assignments.map(item => `${row.talentNames[event.talentIds.indexOf(id)]}: ${item.deliverable}`)).join('; ') || '—'}</td><td>{Object.entries(event.talentAssignments).flatMap(([id, assignments]) => assignments.filter(item => item.submissionDate).map(item => `${row.talentNames[event.talentIds.indexOf(id)]} (${item.deliverable}): ${item.submissionDate}`)).join('; ') || '—'}</td><td>{event.keyPoints.join('; ') || '—'}</td><td><span className="brief-excerpt">{briefPreview(event.details)}</span> <button type="button" className="brief-see-more" onClick={() => setOpenBrief(event)}>See more</button></td><td>{event.cdKeys ? 'Included' : '—'}</td><td className={row.errors.length ? 'import-invalid' : 'import-valid'}>{row.errors.length ? row.errors.join('; ') : 'Ready'}</td></tr>; })}</tbody></table></div>
      <div className="form-actions"><button className="secondary" onClick={() => navigate('/calendar')}>Cancel</button><button className="primary" disabled={busy || rows.some(row => row.errors.length)} onClick={confirm}>{busy ? 'Importing…' : 'Confirm'}</button></div>
    </>}
    {openBrief && <div className="overlay" onMouseDown={() => setOpenBrief(null)}><div className="modal import-brief-modal" role="dialog" aria-modal="true" aria-label={`${openBrief.title} brief`} onMouseDown={event => event.stopPropagation()}><button type="button" className="close" aria-label="Close brief" onClick={() => setOpenBrief(null)}><X size={19} /></button><h2>{openBrief.title}</h2><BriefFrame html={openBrief.details} title={`${openBrief.title} full brief`} /></div></div>}
    {busy && !rows && <div className="loading">Reading ZIP…</div>}
    {error && <div className="form-error">{error}</div>}
  </div>;
}
