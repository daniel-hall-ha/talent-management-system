import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { asyncRoute, type AuthRequest } from '../common/http.js';
import { auth, protect } from '../auth/auth.helpers.js';
import { list, create, update, disable, enable, talents } from './users.controller.js';

export const userRoutes = Router();
userRoutes.get('/users', ...protect('USER_VIEW'), asyncRoute(list));
userRoutes.post('/users', ...protect('USER_ADD'), asyncRoute(create));
userRoutes.put('/users/:id', ...protect('USER_EDIT'), asyncRoute(update));
userRoutes.delete('/users/:id', ...protect('USER_DELETE'), asyncRoute(disable));
userRoutes.post('/users/:id/enable', ...protect('USER_EDIT'), asyncRoute(enable));

userRoutes.get('/talents', auth, (req: AuthRequest, res: Response, next: NextFunction) =>
  req.actor?.permissions.some(permission => permission === 'SOW_ADD' || permission === 'SOW_EDIT') ? next() : res.status(403).json({ error: 'Permission denied' }), asyncRoute(talents));
