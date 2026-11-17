import { useEffect, useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { type CdKeys, type Event, type Talent, type TalentAssignment } from '../../types';
import { iso, today } from '../../lib/dates';
import { api } from '../../lib/api';
import { TalentPicker } from './TalentPicker';
import { TalentAssignments } from './TalentAssignments';

type Props = {
  event: Event | null;
  canEditKeys: boolean;
  onClose: () => void;
  onSave: (value: unknown) => void;
  busy: boolean;
  error: string;
};

export function EventForm({ event, canEditKeys, onClose, onSave, busy, error }: Props) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [color, setColor] = useState(event?.color || '#6979d4');
  const [startDate, setStartDate] = useState(event?.startDate || iso(today.getFullYear(), today.getMonth(), today.getDate()));
  const [endDate, setEndDate] = useState(event?.endDate || iso(today.getFullYear(), today.getMonth(), today.getDate()));
  const [talentAssignments, setTalentAssignments] = useState<Record<string, TalentAssignment[]>>(event?.talentAssignments || {});
  const [talents, setTalents] = useState<Talent[]>(event?.talents || []);
  const [details, setDetails] = useState(event?.details || '');
  const [giveawayKeys, setGiveawayKeys] = useState('');
  const [talentKeys, setTalentKeys] = useState<Record<string, string>>({});
  const [keysChanged, setKeysChanged] = useState(false);
  const [keysError, setKeysError] = useState('');

  useEffect(() => {
    if (!event || !canEditKeys) return;
    let active = true;
    api<{ cdKeys: CdKeys }>(`/events/${event.id}/keys`).then(({ cdKeys }) => {
      if (!active) return;
      setGiveawayKeys(cdKeys.giveaway.join(', '));
      setTalentKeys(Object.fromEntries(Object.entries(cdKeys.talents).map(([id, keys]) => [id, keys.join(', ')])));
    }).catch(cause => { if (active) setKeysError((cause as Error).message); });
    return () => { active = false; };
  }, [event?.id, canEditKeys]);

  const splitKeys = (value: string) => value.split(',').map(key => key.trim()).filter(Boolean);
  function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    onSave({
      title, description, color, startDate, endDate,
      talentAssignments: Object.fromEntries(talents.map(talent => [talent.id, (talentAssignments[talent.id] || []).filter(row => row.deliverable)])),
      talentIds: talents.map(talent => talent.id), details,
      ...(canEditKeys && (!event || keysChanged) ? { cdKeys: { giveaway: splitKeys(giveawayKeys), talents: Object.fromEntries(talents.map(talent => [talent.id, splitKeys(talentKeys[talent.id] || '')]).filter(([, keys]) => (keys as string[]).length)) } } : {}),
    });
  }

  const form = <form onSubmit={submit} className="event-form">
    <div className="event-form-grid">
      <label>Title <em>*</em><input required value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label>Description <em>*</em><input required value={description} onChange={e => setDescription(e.target.value)} /></label>
      <label>Color<div className="color-field"><input type="color" aria-label="Pick color" value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6979d4'} onChange={e => setColor(e.target.value)} /><input type="text" aria-label="Color hex code" required pattern="#[0-9a-fA-F]{6}" maxLength={7} placeholder="#6979d4" value={color} onChange={e => setColor(e.target.value)} /></div></label>
      <label>Start date <em>*</em><input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
      <label>End date <em>*</em><input type="date" required min={startDate} value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
      <div className="event-form-wide talent-assignment-section">
        <TalentPicker selected={talents} onChange={setTalents} />
        <TalentAssignments talents={talents} assignments={talentAssignments} onChange={setTalentAssignments} startDate={startDate} endDate={endDate} />
      </div>
      <div className="event-form-wide event-details">
        <span className="field-title">Details</span>
        <RichTextEditor value={details} onChange={setDetails} />
      </div>
      {canEditKeys && <div className="event-form-wide cd-key-section">
        <span className="field-title">CD Keys <small>Optional · separate multiple keys with commas</small></span>
        <div className="cd-key-table" role="table" aria-label="CD key assignments">
          <div className="cd-key-row cd-key-header" role="row"><span role="columnheader">Recipient</span><span role="columnheader">CD Keys</span></div>
          {talents.map(talent => <div className="cd-key-row" role="row" key={talent.id}><span role="cell">{talent.name}</span><label role="cell"><span className="sr-only">CD Keys for {talent.name}</span><input aria-label={`CD Keys for ${talent.name}`} placeholder="Key 1, Key 2" value={talentKeys[talent.id] || ''} onChange={e => { setTalentKeys(current => ({ ...current, [talent.id]: e.target.value })); setKeysChanged(true); }} /></label></div>)}
          <div className="cd-key-row" role="row"><span role="cell">For Giveaway</span><label role="cell"><span className="sr-only">CD Keys for giveaway</span><input aria-label="CD Keys for giveaway" placeholder="Key 1, Key 2" value={giveawayKeys} onChange={e => { setGiveawayKeys(e.target.value); setKeysChanged(true); }} /></label></div>
        </div>
        {keysError && <div className="form-error">Could not load existing CD keys: {keysError}</div>}
      </div>}
    </div>
    {error && <div className="form-error">{error}</div>}
    <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save Event'}</button></div>
  </form>;

  return <div className="event-page"><div className="page-head"><h1>{event ? 'Edit Event' : 'New Event'}</h1></div>{form}</div>;
}
