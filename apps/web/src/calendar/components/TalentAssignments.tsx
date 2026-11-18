import { Plus, X } from 'lucide-react';
import { categoryOptions, type Talent, type TalentAssignment } from '../../types';
import { SelectDropdown } from './SelectDropdown';

type Props = {
  talents: Talent[];
  assignments: Record<string, TalentAssignment[]>;
  onChange: (assignments: Record<string, TalentAssignment[]>) => void;
  startDate: string;
  endDate: string;
};

export function TalentAssignments({ talents, assignments, onChange, startDate, endDate }: Props) {
  const dates: string[] = [];
  if (startDate && endDate && startDate <= endDate) {
    const cursor = new Date(`${startDate}T00:00:00Z`);
    const last = new Date(`${endDate}T00:00:00Z`);
    while (cursor <= last) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  function update(id: string, rows: TalentAssignment[]) {
    onChange({ ...assignments, [id]: rows });
  }
  if (!talents.length) return null;
  return <div className="talent-assignments" role="table" aria-label="Talent deliverables">
    <div className="talent-assignment-line talent-assignment-header" role="row">
      <span role="columnheader">Talent</span><span role="columnheader">Deliverable</span><span role="columnheader">Submission date</span><span role="columnheader">Publishing date</span><span role="columnheader">Action</span>
    </div>
    {talents.map(talent => {
      const rows = assignments[talent.id]?.length ? assignments[talent.id] : [{ deliverable: '', submissionDate: '', publishingDate: '' } as TalentAssignment];
      return <div className="talent-assignment-group" role="rowgroup" key={talent.id}>
        {rows.map((row, index) => <div className="talent-assignment-line" role="row" key={index}>
          <span className="talent-assignment-name" role="cell">{index === 0 ? talent.name : <span className="sr-only">{talent.name}, deliverable {index + 1}</span>}</span>
          <div role="cell"><SelectDropdown
            label={`Deliverable ${index + 1} for ${talent.name}`}
            value={row.deliverable}
            placeholder="Select deliverable"
            options={[{ value: '', label: 'No deliverable' }, ...categoryOptions.map(category => ({ value: category, label: category }))]}
            onChange={value => update(talent.id, rows.map((item, i) => i === index ? { ...item, deliverable: value as TalentAssignment['deliverable'], submissionDate: value ? item.submissionDate : '', publishingDate: value ? item.publishingDate : '' } : item))}
          /></div>
          <div role="cell"><SelectDropdown
            label={`Submission date ${index + 1} for ${talent.name}`}
            value={row.submissionDate}
            placeholder="Select date"
            disabled={!row.deliverable || !dates.length}
            options={[{ value: '', label: 'No date' }, ...(row.submissionDate && !dates.includes(row.submissionDate) ? [{ value: row.submissionDate, label: `${row.submissionDate} (outside event dates)` }] : []), ...dates.map(date => ({ value: date, label: date }))]}
            onChange={value => update(talent.id, rows.map((item, i) => i === index ? { ...item, submissionDate: value } : item))}
          /></div>
          <div role="cell"><input type="date" aria-label={`Publishing date ${index + 1} for ${talent.name}`} disabled={!row.deliverable} value={row.publishingDate || ''} onChange={event => update(talent.id, rows.map((item, i) => i === index ? { ...item, publishingDate: event.target.value } : item))} /></div>
          <div className="talent-assignment-action" role="cell">{index === 0
            ? <button type="button" aria-label={`Add deliverable for ${talent.name}`} title="Add deliverable" onClick={() => update(talent.id, [...rows, { deliverable: '', submissionDate: '', publishingDate: '' }])}><Plus size={17} /></button>
            : <button type="button" aria-label={`Remove deliverable ${index + 1} for ${talent.name}`} title="Remove deliverable" onClick={() => update(talent.id, rows.filter((_, i) => i !== index))}><X size={16} /></button>}
          </div>
        </div>)}
      </div>;
    })}
  </div>;
}
