import { useState } from 'react';
import { Modal } from '../components/Modal';
import type { Role, User } from '../types';

type Props = {
  user: User | null;
  roles: Role[];
  onClose: () => void;
  onSave: (value: unknown) => void;
  busy: boolean;
  error: string;
};

export function UserForm({ user, roles, onClose, onSave, busy, error }: Props) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [roleId, setRoleId] = useState(user?.roleId || roles[0]?.id || '');
  const [password, setPassword] = useState('');
  const accountRole = roles.find(role => role.id === roleId)?.createAccount || false;
  const needsPassword = accountRole && (!user || !roles.find(role => role.id === user.roleId)?.createAccount);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSave({ name, email: email.trim(), phone: phone.trim(), roleId, ...(accountRole && password ? { password } : {}) });
  }

  return <Modal title={user ? 'Edit User' : 'New User'} onClose={onClose}>
    <form onSubmit={submit}>
      <label>Name <em>*</em><input required value={name} onChange={event => setName(event.target.value)} /></label>
      {user?.loginId && <label>Login ID<input value={user.loginId} readOnly /><small>Login ID cannot be edited</small></label>}
      <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Phone<input type="text" value={phone} onChange={event => setPhone(event.target.value)} placeholder="Multiple numbers can be entered here" /></label>
      <label>Role <em>*</em><select required value={roleId} onChange={event => setRoleId(event.target.value)}>{roles.map(role => <option value={role.id} key={role.id}>{role.name}</option>)}</select></label>
      {needsPassword && <label>Temporary password <em>*</em><input type="password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /><small>At least 8 characters</small></label>}
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save User'}</button></div>
    </form>
  </Modal>;
}
