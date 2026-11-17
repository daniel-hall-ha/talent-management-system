import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function SelectDropdown({ label, value, options, placeholder, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selectedIndex = options.findIndex(option => option.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  function show() {
    if (disabled) return;
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  }
  function choose(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === 'Escape') { setOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { show(); return; }
      setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Home' && open) { event.preventDefault(); setActive(0); }
    else if (event.key === 'End' && open) { event.preventDefault(); setActive(options.length - 1); }
    else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      if (options[active]) choose(options[active]);
    }
  }

  return <div className={`styled-select${open ? ' open' : ''}`} ref={root}>
    <button ref={trigger} type="button" className="styled-select-trigger" role="combobox" aria-label={label} aria-haspopup="listbox" aria-controls={listId} aria-expanded={open} aria-activedescendant={open ? `${listId}-${active}` : undefined} disabled={disabled} onClick={() => open ? setOpen(false) : show()} onKeyDown={onKeyDown}>
      <span className={selected ? 'styled-select-value' : 'styled-select-placeholder'}>{selected?.label || placeholder}</span>
      <ChevronDown size={15} aria-hidden="true" />
    </button>
    {open && <div id={listId} className="styled-select-options" role="listbox" aria-label={label}>
      {options.map((option, index) => <button id={`${listId}-${index}`} key={option.value} type="button" role="option" aria-selected={option.value === value} className={index === active ? 'active' : ''} onPointerEnter={() => setActive(index)} onClick={() => choose(option)}>
        <span>{option.label}</span>{option.value === value && <Check size={14} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
