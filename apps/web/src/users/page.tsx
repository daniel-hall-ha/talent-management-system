import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Empty } from '../components/Empty';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Me, Role, User } from '../types';
import { UserForm } from './UserForm';

export function UsersPage({ me, can }: { me: Me; can: (permission: string) => boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [nextUsers, nextRoles] = await Promise.all([
        api<User[]>('/users'),
        can('ROLE_VIEW') ? api<Role[]>('/roles') : Promise.resolve([]),
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  useEffect(() => { void load(); }, []);

  async function save(value: unknown) {
    setBusy(true);
    setError('');
    try {
      await api(`/users${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(value) });
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function disable(user: User) {
    if (!window.confirm(`Disable ${user.name}?`)) return;
    try {
      await api(`/users/${user.id}`, { method: 'DELETE' });
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  async function enable(user: User) {
    try {
      await api(`/users/${user.id}/enable`, { method: 'POST' });
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return <>
    <div className="page-head"><h1>User Management</h1><div className="head-actions">
      {can('USER_ADD') && <button className="primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} /> New User</button>}
    </div></div>
    <ErrorBanner error={formOpen ? '' : error} onDismiss={() => setError('')} />
    <div className="panel"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
      {users.map(user => <tr key={user.id}>
        <td><b>{user.name}</b></td><td>{user.email || '—'}</td><td>{user.phone || '—'}</td><td>{user.role.name}</td>
        <td><span className={`status ${user.active ? 'good' : 'muted'}`}>{user.active ? 'Active' : 'Disabled'}</span></td>
        <td className="row-actions">
          {can('USER_EDIT') && <button title="Edit user" onClick={() => { setEditing(user); setFormOpen(true); }}><Edit2 size={16} /></button>}
          {user.active && can('USER_DELETE') && user.id !== me.id && <button title="Disable user" onClick={() => disable(user)}><Trash2 size={16} /></button>}
          {!user.active && can('USER_EDIT') && <button onClick={() => enable(user)}>Enable</button>}
        </td>
      </tr>)}
    </tbody></table>{!users.length && <Empty text="No users found" />}</div>
    {formOpen && <UserForm user={editing} roles={roles} onClose={() => { setFormOpen(false); setError(''); }} onSave={save} busy={busy} error={error} />}
  </>;
}
