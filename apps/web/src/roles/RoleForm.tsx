import { useState } from 'react';
import { Modal } from '../components/Modal';
import type { Role } from '../types';

const actions = ['VIEW', 'ADD', 'EDIT', 'DELETE'];
const sections = [['SOW', 'SOW Calendar'], ['USER', 'User Management'], ['ROLE', 'User Roles']];

type Props = {
  role: Role | null;
  onClose: () => void;
  onSave: (value: unknown) => void;
  busy: boolean;
  error: string;
};

export function RoleForm({ role, onClose, onSave, busy, error }: Props) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [createAccount, setCreateAccount] = useState(role?.createAccount || false);
  const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);
  const toggle = (permission: string) => setPermissions(current => current.includes(permission) ? current.filter(item => item !== permission) : [...current, permission]);

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
      <div className="permission-wrap"><table className="permission-table"><thead><tr><th>Menu</th>{actions.map(action => <th key={action}>{action[0] + action.slice(1).toLowerCase()}</th>)}</tr></thead><tbody>
        {sections.map(([prefix, label]) => <tr key={prefix}><td>{label}</td>{actions.map(action => <td key={action}><input type="checkbox" checked={permissions.includes(`${prefix}_${action}`)} onChange={() => toggle(`${prefix}_${action}`)} /></td>)}</tr>)}
        <tr><td>CD Keys</td><td><input type="checkbox" checked={permissions.includes('CD_KEY_VIEW')} onChange={() => toggle('CD_KEY_VIEW')} /></td><td></td><td><input type="checkbox" checked={permissions.includes('CD_KEY_EDIT')} onChange={() => toggle('CD_KEY_EDIT')} /></td><td></td></tr>
      </tbody></table></div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save Role'}</button></div>
    </form>
  </Modal>;
}
