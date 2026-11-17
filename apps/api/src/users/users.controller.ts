import type { Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../common/http.js';
import { canAssignRole, userCreateInput, userUpdateInput } from './users.helpers.js';
import { createUser, getRole, getUser, listUsers, setUserActive, updateUser, searchTalents } from './users.service.js';

export async function list(req: AuthRequest, res: Response) {
  const users = await listUsers();
  return res.json(users.map(user => ({ ...user, loginId: user.role.system && !req.actor?.system ? null : user.loginId })));
}
export async function create(req: AuthRequest, res: Response) {
  const input = userCreateInput.parse(req.body);
  const role = await getRole(input.roleId);
  if (!canAssignRole(role, req.actor)) return res.status(403).json({ error: 'Cannot assign this role' });
  if (role!.createAccount && !input.password) return res.status(400).json({ error: 'Password is required for this role' });
  if (role!.createAccount && input.password!.length < 8) return res.status(400).json({ error: 'Password must have at least 8 characters' });
  return res.status(201).json(await createUser(input, role!.createAccount));
}
export async function update(req: AuthRequest, res: Response) {
  const input = userUpdateInput.parse(req.body);
  const target = await getUser(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role.system) return res.status(403).json({ error: 'Cannot edit super admin' });
  const role = await getRole(input.roleId);
  if (!canAssignRole(role, req.actor)) return res.status(403).json({ error: 'Cannot assign this role' });
  if (role!.createAccount && ((!target.role.createAccount && !input.password) || (!target.passwordHash && !input.password))) return res.status(400).json({ error: 'Password is required when assigning an account role' });
  if (input.password && input.password.length < 8) return res.status(400).json({ error: 'Password must have at least 8 characters' });
  await updateUser(target.id, input, role!.createAccount, target.passwordHash, target.loginId);
  return res.json({ ok: true });
}
export async function disable(req: AuthRequest, res: Response) {
  if (req.actor?.id === req.params.id) return res.status(409).json({ error: 'Cannot disable your own account' });
  const target = await getUser(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role.system) return res.status(403).json({ error: 'Cannot disable super admin' });
  await setUserActive(target.id, false);
  return res.json({ ok: true });
}
export async function enable(req: AuthRequest, res: Response) {
  await setUserActive(req.params.id, true);
  return res.json({ ok: true });
}

export async function talents(req: AuthRequest, res: Response) {
  const query = z.string().trim().max(50).parse(req.query.query ?? '');
  return res.json(await searchTalents(query));
}
