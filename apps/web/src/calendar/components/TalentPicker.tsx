import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import type { Talent } from '../../types';

type Props = {
  selected: Talent[];
  onChange: (talents: Talent[]) => void;
};

export function TalentPicker({ selected, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setOptions([]);
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        setOptions(await api<Talent[]>(`/talents?query=${encodeURIComponent(query)}`, { signal: controller.signal }));
        setError('');
      } catch (cause) {
        if (!controller.signal.aborted) setError((cause as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 150 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  function add(talent: Talent) {
    onChange([...selected, talent]);
    setQuery('');
    input.current?.focus();
  }

  const available = options.filter(talent => !selected.some(item => item.id === talent.id));
  return <div className="talent-field">
    <label htmlFor="talent-search" className="field-title">Assign talent</label>
    <div className="talent-picker" ref={root}>
      <div className="talent-input-wrap" onClick={() => input.current?.focus()}>
        {selected.map(talent => <span className="talent-chip" key={talent.id}>
          {talent.name}
          <button type="button" aria-label={`Remove ${talent.name}`} onClick={event => { event.stopPropagation(); onChange(selected.filter(item => item.id !== talent.id)); }}><X size={12} /></button>
        </span>)}
        <input ref={input} id="talent-search" type="text" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="talent-options" placeholder={selected.length ? 'Add another talent…' : 'Search talents…'} value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }} />
      </div>
      {open && <div className="talent-options" id="talent-options" role="listbox">
        {loading ? <div className="talent-empty">Searching talents…</div> : error ? <div className="talent-empty">{error}</div> : available.length ? available.map(talent => <button type="button" role="option" aria-selected={false} key={talent.id} onClick={() => add(talent)}>{talent.name}</button>) : <div className="talent-empty">{query ? 'No matching talents' : 'No active users with the Talents role'}</div>}
      </div>}
    </div>
  </div>;
}
