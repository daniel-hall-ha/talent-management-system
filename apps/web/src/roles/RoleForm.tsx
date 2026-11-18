import { useState } from 'react';
import { Modal } from '../components/Modal';
import type { Role } from '../types';

const columns = [
  { key: 'viewAll', label: 'View All' }, { key: 'view', label: 'View' },
  { key: 'add', label: 'Add' }, { key: 'edit', label: 'Edit Access' }, { key: 'delete', label: 'Delete' },
] as const;
const sections = [
  { label: 'SOW Calendar', access: { viewAll: 'SOW_VIEW_ALL', view: 'SOW_VIEW', add: 'SOW_ADD', edit: 'SOW_EDIT', delete: 'SOW_DELETE' } },
  { label: 'SOW Tracker', access: { viewAll: 'TRACKER_VIEW_ALL', view: 'TRACKER_VIEW', edit: 'TRACKER_EDIT' } },
  { label: 'CD Keys', access: { viewAll: 'CD_KEY_VIEW_ALL', view: 'CD_KEY_VIEW', edit: 'CD_KEY_EDIT' } },
  { label: 'User Management', access: { view: 'USER_VIEW', add: 'USER_ADD', edit: 'USER_EDIT', delete: 'USER_DELETE' } },
  { label: 'User Roles', access: { view: 'ROLE_VIEW', add: 'ROLE_ADD', edit: 'ROLE_EDIT', delete: 'ROLE_DELETE' } },
  { label: 'Talents Database', access: { view: 'TALENT_DB_VIEW', add: 'TALENT_DB_ADD', edit: 'TALENT_DB_EDIT' } },
] as const;

type Props = { role: Role | null; onClose: () => void; onSave: (value: unknown) => void; busy: boolean; error: string };

export function RoleForm({ role, onClose, onSave, busy, error }: Props) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [createAccount, setCreateAccount] = useState(role?.createAccount || false);
  const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);
  const toggle = (permission: string) => setPermissions(current => {
    if (current.includes(permission)) return current.filter(item => item !== permission && (permission !== 'SOW_VIEW_ALL' || !['SOW_EDIT', 'SOW_DELETE'].includes(item)) && (permission !== 'CD_KEY_VIEW_ALL' || item !== 'CD_KEY_EDIT'));
    return [...current, permission];
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSave({ name, description, permissions, createAccount });
  }

  return <Modal title={role ? 'Edit Role' : 'New Role'} onClose={onClose}>
    <form onSubmit={submit}>
      <label>Name <em>*</em><input required value={name} onChange={event => setName(event.target.value)} /></label>
      <label>Description<textarea rows={2} value={description} onChange={event => setDescription(event.target.value)} /></label>
      <label className="role-account-toggle"><input type="checkbox" checked={createAccount} onChange={event => setCreateAccount(event.target.checked)} /> Create New Account</label>
      <h3>Role access</h3>
      <div className="permission-wrap"><table className="data-table"><thead><tr><th>Menu</th>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
        {sections.map(section => <tr key={section.label}><td>{section.label}</td>{columns.map(column => {
          const permission = (section.access as Partial<Record<typeof column.key, string>>)[column.key];
          const requiresViewAll = section.label === 'SOW Calendar' && (column.key === 'edit' || column.key === 'delete');
          const requiresKeyViewAll = section.label === 'CD Keys' && column.key === 'edit';
          return <td key={column.key}>{permission && <input disabled={requiresViewAll && !permissions.includes('SOW_VIEW_ALL') || requiresKeyViewAll && !permissions.includes('CD_KEY_VIEW_ALL')} type="checkbox" aria-label={`${section.label} ${column.label}`} checked={permissions.includes(permission)} onChange={() => toggle(permission)} />}</td>;
        })}</tr>)}
      </tbody></table></div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save Role'}</button></div>
    </form>
  </Modal>;
}
