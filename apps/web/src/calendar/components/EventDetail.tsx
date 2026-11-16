import { useState } from 'react';
import { Edit2, KeyRound, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { BriefFrame } from './BriefFrame';
import type { CdKeys, Event } from '../../types';

type Props = {
  event: Event;
  can: (permission: string) => boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function EventDetail({ event, can, onClose, onEdit, onDelete }: Props) {
  const [keys, setKeys] = useState<CdKeys | null>(null);
  const [error, setError] = useState('');

  async function revealKeys() {
    try {
      setKeys((await api<{ cdKeys: CdKeys }>(`/events/${event.id}/keys`)).cdKeys);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return <div className="overlay" onMouseDown={onClose}><div className="modal detail" onMouseDown={e => e.stopPropagation()}>
    <button className="close" onClick={onClose} aria-label="Close"><X size={19} /></button>
    <span className="event-dot" style={{ background: event.color }} />
    <h2>{event.title}</h2>
    <p className="date-line">{event.startDate} → {event.endDate}</p>
    {event.talents.length > 0 && <><h3>Assigned talents</h3><div className="detail-categories">{event.talents.map(talent => <div className="talent-detail-row" key={talent.id}><strong>{talent.name}</strong><div>{(event.talentDeliverables?.[talent.id] || []).map(category => <span className="category-chip" key={category}>{category}</span>)}</div>{event.talentSubmissionDates?.[talent.id] && <span className="talent-submission-date">Submission: {event.talentSubmissionDates[talent.id]}</span>}</div>)}</div></>}
    <h3>Description</h3><p>{event.description}</p>
    {event.details && <><h3>Details</h3><BriefFrame html={event.details} title={`${event.title} brief`} /></>}
    {can('CD_KEY_VIEW') && <><h3>CD Keys</h3>{keys ? <div className="keys">{event.talents.map(talent => keys.talents[talent.id]?.length ? <div key={talent.id}><strong>{talent.name}</strong><div className="key-values">{keys.talents[talent.id].map((key, index) => <code key={index}>{key}</code>)}</div></div> : null)}{keys.giveaway.length > 0 && <div><strong>For Giveaway</strong><div className="key-values">{keys.giveaway.map((key, index) => <code key={index}>{key}</code>)}</div></div>}{!keys.giveaway.length && !Object.values(keys.talents).some(items => items.length) && 'No keys'}</div> : <button className="secondary" onClick={revealKeys}><KeyRound size={15} /> Reveal keys</button>}</>}
    {error && <div className="form-error">{error}</div>}
    <div className="detail-actions">
      {can('SOW_EDIT') && <button className="secondary" onClick={onEdit}><Edit2 size={15} /> Edit</button>}
      {can('SOW_DELETE') && <button className="danger" onClick={onDelete}><Trash2 size={15} /> Delete</button>}
    </div>
  </div></div>;
}
