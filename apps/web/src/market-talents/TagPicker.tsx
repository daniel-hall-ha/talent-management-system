import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const tagLabel = (tag: string) => tag.toLowerCase().split('_').map(part => part[0].toUpperCase() + part.slice(1)).join(' ');

export function TagPicker({ value, options, onChange, placeholder = 'Search tags…' }: { value: string[]; options: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const available = options.filter(tag => !value.includes(tag) && tagLabel(tag).toLowerCase().includes(query.trim().toLowerCase()));

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      const height = Math.min(240, Math.max(48, available.length * 36 + 8));
      const above = window.innerHeight - rect.bottom < height && rect.top > window.innerHeight - rect.bottom;
      setPosition({ top: above ? Math.max(4, rect.top - height - 4) : rect.bottom + 4, left: rect.left, width: rect.width });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, available.length]);

  useEffect(() => {
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);

  function add(tag: string) {
    onChange([...value, tag]);
    setQuery('');
    input.current?.focus();
  }

  return <div className="market-tag-picker" ref={root} onClick={() => input.current?.focus()}>
    {value.map(tag => <span className="market-tag" key={tag}>{tagLabel(tag)}<button type="button" aria-label={`Remove ${tagLabel(tag)}`} onClick={event => { event.stopPropagation(); onChange(value.filter(item => item !== tag)); }}><X size={12} /></button></span>)}
    <input ref={input} aria-label="Add tag" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="market-tag-options" placeholder={value.length ? 'Add tag…' : placeholder} value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} onKeyDown={event => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Enter' && open && available.length) { event.preventDefault(); add(available[0]); }
      if (event.key === 'Backspace' && !query && value.length) onChange(value.slice(0, -1));
    }} />
    {open && createPortal(<div ref={menu} id="market-tag-options" className="market-tag-options" role="listbox" style={position}>
      {available.length ? available.map(tag => <button type="button" role="option" aria-selected={false} key={tag} onClick={() => add(tag)}>{tagLabel(tag)}</button>) : <div className="market-tag-empty">{query ? 'No matching tags' : 'All tags selected'}</div>}
    </div>, document.body)}
  </div>;
}
