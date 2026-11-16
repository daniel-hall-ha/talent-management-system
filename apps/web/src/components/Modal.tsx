import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = { title: string; onClose: () => void; children: ReactNode };

export function Modal({ title, onClose, children }: Props) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={event => event.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
