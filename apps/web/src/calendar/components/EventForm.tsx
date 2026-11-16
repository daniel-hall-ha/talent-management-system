import { useEffect, useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { categoryOptions, type Category, type CdKeys, type Event, type Talent } from '../../types';
import { iso, today } from '../../lib/dates';
import { api } from '../../lib/api';
import { TalentPicker } from './TalentPicker';

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
  const [talentDeliverables, setTalentDeliverables] = useState<Record<string, Category[]>>(event?.talentDeliverables || {});
  const [talentSubmissionDates, setTalentSubmissionDates] = useState<Record<string, string>>(event?.talentSubmissionDates || {});
  const [talents, setTalents] = useState<Talent[]>(event?.talents || []);
  const [openDeliverables, setOpenDeliverables] = useState<string | null>(null);
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
  const submissionDates: string[] = [];
  if (startDate && endDate && startDate <= endDate) {
    const cursor = new Date(`${startDate}T00:00:00Z`);
    const last = new Date(`${endDate}T00:00:00Z`);
    while (cursor <= last) {
      submissionDates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  function toggleDeliverable(id: string, category: Category) {
    setTalentDeliverables(current => {
      const selected = current[id] || [];
      return { ...current, [id]: selected.includes(category) ? selected.filter(item => item !== category) : [...selected, category] };
    });
  }

  function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    onSave({
      title, description, color, startDate, endDate,
      talentDeliverables: Object.fromEntries(talents.map(talent => [talent.id, talentDeliverables[talent.id] || []])),
      talentSubmissionDates: Object.fromEntries(talents.map(talent => [talent.id, talentSubmissionDates[talent.id]]).filter(([, value]) => typeof value === 'string' && submissionDates.includes(value))),
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
        {talents.length > 0 && <div className="cd-key-table" role="table" aria-label="Talent deliverables">
          <div className="cd-key-row cd-key-header" role="row"><span role="columnheader">Talent</span><span role="columnheader">Deliverables</span><span role="columnheader">Submission date</span></div>
          {talents.map(talent => <div className="cd-key-row" role="row" key={talent.id}>
            <span role="cell">{talent.name}</span>
            <div role="cell" className="category-field">
              <button type="button" className="category-trigger" aria-label={`Deliverables for ${talent.name}`} aria-expanded={openDeliverables === talent.id} onClick={() => setOpenDeliverables(openDeliverables === talent.id ? null : talent.id)}>
                {(talentDeliverables[talent.id] || []).length ? <span className="selected-categories">{talentDeliverables[talent.id].map(category => <span className="category-chip" key={category}>{category}</span>)}</span> : <span className="category-placeholder">Select deliverables</span>}
                <span className="category-chevron">▾</span>
              </button>
              {openDeliverables === talent.id && <div className="category-options">{categoryOptions.map(category => <label key={category}>
                <input type="checkbox" checked={(talentDeliverables[talent.id] || []).includes(category)} onChange={() => toggleDeliverable(talent.id, category)} />{category}
              </label>)}</div>}
            </div>
            <div role="cell"><select aria-label={`Submission date for ${talent.name}`} value={submissionDates.includes(talentSubmissionDates[talent.id]) ? talentSubmissionDates[talent.id] : ''} onChange={e => setTalentSubmissionDates(current => ({ ...current, [talent.id]: e.target.value }))} disabled={!submissionDates.length}>
              <option value="">Select date</option>
              {submissionDates.map(date => <option value={date} key={date}>{date}</option>)}
            </select></div>
          </div>)}
        </div>}
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
