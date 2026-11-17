import { useState } from 'react';
import { Modal } from '../components/Modal';
import { SelectDropdown } from '../calendar/components/SelectDropdown';
import { categoryOptions } from '../types';

export type TrackerFilters = {
  talentId: string;
  talentName: string;
  deliverable: string;
  status: '' | 'Pending' | 'Done';
};

export const emptyTrackerFilters: TrackerFilters = { talentId: '', talentName: '', deliverable: '', status: '' };

type Props = {
  value: TrackerFilters;
  talents: { id: string; name: string }[];
  onApply: (filters: TrackerFilters) => void;
  onClose: () => void;
};

export function TrackerFilterModal({ value, talents, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(value);
  const availableTalents = value.talentId && !talents.some(talent => talent.id === value.talentId)
    ? [...talents, { id: value.talentId, name: value.talentName }]
    : talents;

  return <Modal title="Filter SOW Tracker" onClose={onClose}>
    <form className="tracker-filter-form" onSubmit={event => { event.preventDefault(); onApply(draft); }}>
      <label>Talent name</label>
      <SelectDropdown label="Talent name" value={draft.talentId} placeholder="All talents" options={[{ value: '', label: 'All talents' }, ...availableTalents.map(talent => ({ value: talent.id, label: talent.name }))]} onChange={id => setDraft(current => ({ ...current, talentId: id, talentName: availableTalents.find(talent => talent.id === id)?.name || '' }))} />
      <label>Deliverable type</label>
      <SelectDropdown label="Deliverable type" value={draft.deliverable} placeholder="All deliverables" options={[{ value: '', label: 'All deliverables' }, ...categoryOptions.map(category => ({ value: category, label: category }))]} onChange={deliverable => setDraft(current => ({ ...current, deliverable }))} />
      <label>Status</label>
      <SelectDropdown label="Status" value={draft.status} placeholder="All statuses" options={[{ value: '', label: 'All statuses' }, { value: 'Pending', label: 'Pending' }, { value: 'Done', label: 'Done' }]} onChange={status => setDraft(current => ({ ...current, status: status as TrackerFilters['status'] }))} />
      <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary">Apply Filters</button></div>
    </form>
  </Modal>;
}
