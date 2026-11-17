import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../common/config.js';
import { prisma } from '../common/db.js';
import type { AuthRequest } from '../common/http.js';

export const allPermissions = ['SOW_VIEW_ALL','SOW_VIEW','SOW_ADD','SOW_EDIT','SOW_DELETE','TRACKER_VIEW_ALL','TRACKER_VIEW','TRACKER_EDIT','USER_VIEW','USER_ADD','USER_EDIT','USER_DELETE','ROLE_VIEW','ROLE_ADD','ROLE_EDIT','ROLE_DELETE','CD_KEY_VIEW_ALL','CD_KEY_VIEW','CD_KEY_EDIT','TALENT_DB_VIEW','TALENT_DB_ADD','TALENT_DB_EDIT'] as const;

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => Promise.resolve((async () => {
  const token = req.cookies.session;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  let id: string;
  try { id = (jwt.verify(token, config.sessionSecret) as { id: string }).id; }
  catch { return res.status(401).json({ error: 'Invalid session' }); }
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user?.active || !user.role.createAccount || !user.passwordHash) return res.status(401).json({ error: 'Account disabled' });
  req.actor = { id: user.id, permissions: user.role.permissions, system: user.role.system };
  res.locals.user = { id: user.id, name: user.name, loginId: user.loginId, email: user.email, role: user.role.name, permissions: user.role.permissions };
  next();
})()).catch(next);

export const requirePermission = (permission: string) => (req: AuthRequest, res: Response, next: NextFunction) =>
  req.actor?.permissions.includes(permission) ? next() : res.status(403).json({ error: 'Permission denied' });
export const protect = (permission: string) => [auth, requirePermission(permission)];

export const requireAnyPermission = (...permissions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) =>
  req.actor?.permissions.some(permission => permissions.includes(permission)) ? next() : res.status(403).json({ error: 'Permission denied' });
export const protectAny = (...permissions: string[]) => [auth, requireAnyPermission(...permissions)];
