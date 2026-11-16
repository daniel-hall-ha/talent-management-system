import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Empty } from '../components/Empty';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Role } from '../types';
import { RoleForm } from './RoleForm';

export function RolesPage({ can }: { can: (permission: string) => boolean }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<Role | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setRoles(await api<Role[]>('/roles')); }
    catch (cause) { setError((cause as Error).message); }
  }
  useEffect(() => { void load(); }, []);

  async function save(value: unknown) {
    setBusy(true);
    setError('');
    try {
      await api(`/roles${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(value) });
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(role: Role) {
    if (!window.confirm(`Delete ${role.name}?`)) return;
    try {
      await api(`/roles/${role.id}`, { method: 'DELETE' });
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return <>
    <div className="page-head"><h1>User Roles</h1><div className="head-actions">
      {can('ROLE_ADD') && <button className="primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} /> New Role</button>}
    </div></div>
    <ErrorBanner error={formOpen ? '' : error} onDismiss={() => setError('')} />
    <div className="panel"><table><thead><tr><th>Role</th><th>Description</th><th>Users</th><th>Account</th><th>Permissions</th><th></th></tr></thead><tbody>
      {roles.map(role => <tr key={role.id}>
        <td><b>{role.name}</b>{role.system && <span className="system-tag">System</span>}</td>
        <td>{role.description || '—'}</td><td>{role._count.users}</td><td>{role.createAccount ? 'Yes' : 'No'}</td><td>{role.permissions.length} granted</td>
        <td className="row-actions">
          {!role.system && can('ROLE_EDIT') && <button title="Edit role" onClick={() => { setEditing(role); setFormOpen(true); }}><Edit2 size={16} /></button>}
          {!role.system && !role._count.users && can('ROLE_DELETE') && <button title="Delete role" onClick={() => remove(role)}><Trash2 size={16} /></button>}
        </td>
      </tr>)}
    </tbody></table>{!roles.length && <Empty text="No roles found" />}</div>
    {formOpen && <RoleForm role={editing} onClose={() => { setFormOpen(false); setError(''); }} onSave={save} busy={busy} error={error} />}
  </>;
}
