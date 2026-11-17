import { useState } from 'react';
import { ArrowLeft, Edit2, KeyRound, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { BriefFrame } from './BriefFrame';
import { numberedDeliverables } from '../../lib/deliverables';
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

  return <div className="event-page event-view-page"><div className="page-head"><h1>Event Details</h1><button className="secondary" onClick={onClose}><ArrowLeft size={16} /> Back to Calendar</button></div><div className="panel detail event-view-card">
    <span className="event-dot" style={{ background: event.color }} />
    <h2>{event.title}</h2>
    <p className="date-line">{event.startDate} → {event.endDate}</p>
    {event.talents.length > 0 && <><h3>Assigned talents</h3><div className="detail-categories">{event.talents.map(talent => {
      const assignments = event.talentAssignments?.[talent.id] || [];
      const labels = numberedDeliverables(assignments);
      return <div className="talent-detail-row" key={talent.id}><strong>{talent.name}</strong><div className="talent-detail-assignments">{assignments.map((assignment, index) => <span className="talent-detail-assignment" key={assignment.id || index}><span className="category-chip">{labels[index]}</span>{assignment.submissionDate && <span className="talent-submission-date">Submission: {assignment.submissionDate}</span>}</span>)}</div></div>;
    })}</div></>}
    <h3>Description</h3><p>{event.description}</p>
    {event.details && <><h3>Details</h3><BriefFrame html={event.details} title={`${event.title} brief`} expand /></>}
    {(can('CD_KEY_VIEW') || can('CD_KEY_VIEW_ALL') || can('CD_KEY_EDIT')) && <><h3>CD Keys</h3>{keys ? <div className="keys">{event.talents.map(talent => keys.talents[talent.id]?.length ? <div key={talent.id}><strong>{talent.name}</strong><div className="key-values">{keys.talents[talent.id].map((key, index) => <code key={index}>{key}</code>)}</div></div> : null)}{keys.giveaway.length > 0 && <div><strong>For Giveaway</strong><div className="key-values">{keys.giveaway.map((key, index) => <code key={index}>{key}</code>)}</div></div>}{!keys.giveaway.length && !Object.values(keys.talents).some(items => items.length) && 'No keys'}</div> : <button className="secondary" onClick={revealKeys}><KeyRound size={15} /> Reveal keys</button>}</>}
    {error && <div className="form-error">{error}</div>}
    <div className="detail-actions">
      {can('SOW_EDIT') && can('SOW_VIEW_ALL') && <button className="secondary" onClick={onEdit}><Edit2 size={15} /> Edit</button>}
      {can('SOW_DELETE') && can('SOW_VIEW_ALL') && <button className="danger" onClick={onDelete}><Trash2 size={15} /> Delete</button>}
    </div>
  </div></div>;
}
