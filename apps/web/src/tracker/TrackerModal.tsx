import { useState } from 'react';
import { Modal } from '../components/Modal';
import { SelectDropdown } from '../calendar/components/SelectDropdown';
import { LinkList } from './Links';
import type { TrackerRow } from './types';

type Props = {
  row: TrackerRow;
  deliverableLabel: string;
  mode: 'view' | 'edit';
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (value: { status: 'Pending' | 'Done'; links: string[] }) => void;
};

export function TrackerModal({ row, deliverableLabel, mode, busy, error, onClose, onSave }: Props) {
  const [status, setStatus] = useState<'Pending' | 'Done'>(row.status);
  const [linksText, setLinksText] = useState(row.links.join(', '));
  const [localError, setLocalError] = useState('');
  const editing = mode === 'edit';
  const links = linksText.split(',').map(link => link.trim()).filter(Boolean);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      for (const link of links) {
        const url = new URL(link);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Links must use http or https');
      }
      if (links.length > 20) throw new Error('Use 20 links or fewer');
      setLocalError('');
      onSave({ status, links });
    } catch (cause) {
      setLocalError((cause as Error).message === 'Invalid URL' ? 'Enter complete links, including https://' : (cause as Error).message);
    }
  }

  return <Modal title={editing ? 'Edit SOW' : 'View SOW'} onClose={onClose}>
    <form className="tracker-modal-form" onSubmit={submit}>
      <div className="tracker-modal-field"><span>Title</span><strong>{row.title}</strong></div>
      <div className="tracker-modal-field"><span>Description</span><p>{row.description}</p></div>
      <div className="tracker-modal-field"><span>Talent</span><strong>{row.talent}</strong></div>
      <div className="tracker-modal-field"><span>Deliverable</span><span className="category-chip">{deliverableLabel}</span></div>
      <div className="tracker-modal-field"><span>Status</span>{editing
        ? <SelectDropdown label="Status" value={status} options={[{ value: 'Pending', label: 'Pending' }, { value: 'Done', label: 'Done' }]} placeholder="Select status" onChange={value => setStatus(value as 'Pending' | 'Done')} />
        : <span className={`tracker-status ${row.status.toLowerCase()}`}>{row.status}</span>}</div>
      <div className="tracker-modal-field"><span>Links</span>{editing
        ? <input type="text" aria-label="Links" value={linksText} onChange={event => setLinksText(event.target.value)} placeholder="https://facebook.com/..., https://tiktok.com/..." />
        : null}<small>{editing ? 'Separate multiple links with commas' : null}</small><LinkList links={editing ? links : row.links} /></div>
      {(localError || error) && <div className="form-error">{localError || error}</div>}
      <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>{editing ? 'Cancel' : 'Close'}</button>{editing && <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>}</div>
    </form>
  </Modal>;
}
