import type { Response } from 'express';
import type { AuthRequest } from '../common/http.js';
import { roleInput } from './roles.helpers.js';
import { countUsersMissingCredentials, createRole, deleteRole, getRole, getRoleWithUsers, listRoles, updateRole } from './roles.service.js';

export async function list(_req: AuthRequest, res: Response) { return res.json(await listRoles()); }
export async function create(req: AuthRequest, res: Response) {
  const input = roleInput.parse(req.body);
  if (input.permissions.includes('CD_KEY_EDIT') && !input.permissions.includes('CD_KEY_VIEW_ALL')) return res.status(400).json({ error: 'CD Key Edit requires CD Key View All' });
  if ((input.permissions.includes('SOW_EDIT') || input.permissions.includes('SOW_DELETE')) && !input.permissions.includes('SOW_VIEW_ALL')) return res.status(400).json({ error: 'Calendar Edit and Delete require Calendar View All' });
  if (input.permissions.some(permission => !req.actor?.permissions.includes(permission))) return res.status(403).json({ error: 'Cannot grant permissions you do not hold' });
  return res.status(201).json(await createRole(input));
}
export async function update(req: AuthRequest, res: Response) {
  const input = roleInput.parse(req.body);
  const current = await getRole(req.params.id);
  if (!current) return res.status(404).json({ error: 'Role not found' });
  if (current.system) return res.status(403).json({ error: 'System role cannot be edited' });
  if (input.createAccount && !current.createAccount && await countUsersMissingCredentials(current.id)) return res.status(409).json({ error: 'Move users without passwords to another role before enabling account creation' });
  if (input.permissions.includes('CD_KEY_EDIT') && !input.permissions.includes('CD_KEY_VIEW_ALL')) return res.status(400).json({ error: 'CD Key Edit requires CD Key View All' });
  if ((input.permissions.includes('SOW_EDIT') || input.permissions.includes('SOW_DELETE')) && !input.permissions.includes('SOW_VIEW_ALL')) return res.status(400).json({ error: 'Calendar Edit and Delete require Calendar View All' });
  if (input.permissions.some(permission => !req.actor?.permissions.includes(permission))) return res.status(403).json({ error: 'Cannot grant permissions you do not hold' });
  return res.json(await updateRole(current.id, input, current.createAccount));
}
export async function remove(req: AuthRequest, res: Response) {
  const role = await getRoleWithUsers(req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (role.system || role._count.users) return res.status(409).json({ error: 'System or assigned role cannot be deleted' });
  await deleteRole(role.id);
  return res.json({ ok: true });
}
