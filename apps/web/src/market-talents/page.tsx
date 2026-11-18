import { useEffect, useRef, useState } from 'react';
import { Check, Edit2, Plus, Upload, X } from 'lucide-react';
import { api } from '../lib/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { Empty } from '../components/Empty';
import { csvHeaders, parseCsv, sampleCsv } from './csv';
import { SelectDropdown } from '../calendar/components/SelectDropdown';

type Talent = { id: string; name: string; tags: string[]; facebookPage: string; facebookFollowers: number | null; tiktokChannel: string; tiktokFollowers: number | null; youtubeChannel: string; youtubeFollowers: number | null };
type Form = Omit<Talent, 'id' | 'facebookFollowers' | 'tiktokFollowers' | 'youtubeFollowers'> & { facebookFollowers: string; tiktokFollowers: string; youtubeFollowers: string };
const blank: Form = { name: '', tags: [], facebookPage: '', facebookFollowers: '', tiktokChannel: '', tiktokFollowers: '', youtubeChannel: '', youtubeFollowers: '' };
const label = (tag: string) => tag.toLowerCase().split('_').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');
const formOf = (talent: Talent): Form => ({ ...talent, facebookFollowers: talent.facebookFollowers?.toString() || '', tiktokFollowers: talent.tiktokFollowers?.toString() || '', youtubeFollowers: talent.youtubeFollowers?.toString() || '' });
function payload(form: Form) {
  const count = (value: string) => value.trim() === '' ? null : Number(value);
  for (const field of ['facebookFollowers','tiktokFollowers','youtubeFollowers'] as const) {
    if (form[field].trim() && (!Number.isSafeInteger(Number(form[field])) || Number(form[field]) < 0 || Number(form[field]) > 2147483647)) throw new Error('Follower counts must be whole numbers between 0 and 2,147,483,647');
  }
  if (!form.name.trim()) throw new Error('Name is required');
  return { ...form, name: form.name.trim(), facebookFollowers: count(form.facebookFollowers), tiktokFollowers: count(form.tiktokFollowers), youtubeFollowers: count(form.youtubeFollowers) };
}

function Tags({ value, options, onChange }: { value: string[]; options: string[]; onChange: (tags: string[]) => void }) {
  return <div className="market-tag-editor"><div className="market-tags">{value.map(tag => <span className="market-tag" key={tag}>{label(tag)}<button type="button" aria-label={`Remove ${label(tag)}`} onClick={() => onChange(value.filter(item => item !== tag))}><X size={12} /></button></span>)}</div>
    <SelectDropdown label="Add tag" value="" placeholder="Add tag…" options={options.filter(tag => !value.includes(tag)).map(tag => ({ value: tag, label: label(tag) }))} onChange={tag => onChange([...value, tag])} /></div>;
}

export function MarketTalentsPage({ can }: { can: (permission: string) => boolean }) {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  async function load() { const data = await api<{ talents: Talent[]; tags: string[] }>('/market-talents'); setTalents(data.talents); setTags(data.tags); }
  useEffect(() => { void load().catch(cause => setError((cause as Error).message)); }, []);
  function start(id: string | null) { setEditing(id || 'new'); setForm(id ? formOf(talents.find(talent => talent.id === id)!) : { ...blank, tags: [] }); setError(''); setNotice(''); }
  function set(field: keyof Form, value: string | string[]) { setForm(current => ({ ...current, [field]: value })); }
  async function save() {
    setBusy(true); setError('');
    try {
      const value = payload(form);
      await api(`/market-talents${editing === 'new' ? '' : `/${editing}`}`, { method: editing === 'new' ? 'POST' : 'PUT', body: JSON.stringify(value) });
      setEditing(null); await load();
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length || rows[0].length !== csvHeaders.length || rows[0].some((cell, index) => cell.trim().toLowerCase() !== csvHeaders[index].toLowerCase())) throw new Error('CSV header does not match the sample file');
      const values = rows.slice(1).map((row, index) => {
        if (row.length !== csvHeaders.length) throw new Error(`Row ${index + 2} has ${row.length} columns; expected ${csvHeaders.length}`);
        const selected = row[1].split(';').map(tag => tag.trim().toUpperCase().replace(/\s+/g, '_')).filter(Boolean);
        if (selected.some(tag => !tags.includes(tag))) throw new Error(`Row ${index + 2} has an unknown tag`);
        try { return payload({ name: row[0], tags: [...new Set(selected)], facebookPage: row[2], facebookFollowers: row[3], tiktokChannel: row[4], tiktokFollowers: row[5], youtubeChannel: row[6], youtubeFollowers: row[7] }); }
        catch (cause) { throw new Error(`Row ${index + 2}: ${(cause as Error).message}`); }
      });
      if (!values.length) throw new Error('CSV has no talent rows');
      const result = await api<{ created: number }>('/market-talents/import', { method: 'POST', body: JSON.stringify({ rows: values }) });
      setNotice(`Imported ${result.created} talents.`); await load();
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); if (upload.current) upload.current.value = ''; }
  }
  function downloadSample() { const url = URL.createObjectURL(new Blob([sampleCsv()], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'talents-database-sample.csv'; link.click(); URL.revokeObjectURL(url); }
  function cells(value: Form, editable: boolean) {
    const fields: (keyof Form)[] = ['name','facebookPage','facebookFollowers','tiktokChannel','tiktokFollowers','youtubeChannel','youtubeFollowers'];
    return <><td>{editable ? <input aria-label="Name" value={value.name} onChange={event => set('name', event.target.value)} /> : <b>{value.name}</b>}</td>
      <td>{editable ? <Tags value={value.tags} options={tags} onChange={next => set('tags', next)} /> : <div className="market-tags">{value.tags.map(tag => <span className="market-tag" key={tag}>{label(tag)}</span>)}</div>}</td>
      {fields.slice(1).map(field => <td key={field}>{editable ? <input aria-label={field} type={field.endsWith('Followers') ? 'number' : 'text'} min={field.endsWith('Followers') ? 0 : undefined} step={field.endsWith('Followers') ? 1 : undefined} value={value[field] as string} onChange={event => set(field, event.target.value)} /> : field.endsWith('Followers') ? (value[field] === '' ? '—' : Number(value[field]).toLocaleString()) : value[field] ? <a href={/^https?:\/\//i.test(value[field] as string) ? value[field] as string : `https://${value[field]}`} target="_blank" rel="noreferrer">{value[field]}</a> : '—'}</td>)}
    </>;
  }
  return <><div className="page-head"><h1>Talents Database</h1><div className="head-actions">{can('TALENT_DB_ADD') && <><button className="secondary" onClick={downloadSample}>Download sample CSV</button><input ref={upload} className="sr-only" type="file" accept=".csv,text/csv" onChange={event => void importFile(event.target.files?.[0])} /><button className="secondary" disabled={busy || !!editing} onClick={() => upload.current?.click()}><Upload size={16} /> Batch Import</button><button className="primary" disabled={!!editing} onClick={() => start(null)}><Plus size={16} /> Add Talent</button></>}</div></div>
    <ErrorBanner error={error} onDismiss={() => setError('')} />{notice && <p className="market-notice">{notice}</p>}
    <div className="panel market-table-wrap"><table className="data-table"><thead><tr><th>No.</th><th>Name</th><th>Tags</th><th>Facebook Page</th><th>Follower Count</th><th>TikTok Channel</th><th>Follower Count</th><th>YouTube Channel</th><th>Follower Count</th><th>Action</th></tr></thead><tbody>
      {editing === 'new' && <tr className="market-edit-row"><td>New</td>{cells(form, true)}<td className="row-actions"><button disabled={busy} title="Save" onClick={() => void save()}><Check size={17} /></button><button title="Cancel" onClick={() => setEditing(null)}><X size={17} /></button></td></tr>}
      {talents.map((talent, index) => <tr key={talent.id} className={editing === talent.id ? 'market-edit-row' : ''}><td>{index + 1}</td>{cells(editing === talent.id ? form : formOf(talent), editing === talent.id)}<td className="row-actions">{editing === talent.id ? <><button disabled={busy} title="Save" onClick={() => void save()}><Check size={17} /></button><button title="Cancel" onClick={() => setEditing(null)}><X size={17} /></button></> : can('TALENT_DB_EDIT') && <button disabled={!!editing} title="Edit talent" onClick={() => start(talent.id)}><Edit2 size={16} /></button>}</td></tr>)}
    </tbody></table>{!talents.length && editing !== 'new' && <Empty text="No talents in the database yet" />}</div></>;
}
