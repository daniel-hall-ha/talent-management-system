import { Router } from 'express';
import { asyncRoute } from '../common/http.js';
import { protect } from '../auth/auth.helpers.js';
import { list, create, update, remove } from './roles.controller.js';

export const roleRoutes = Router();
roleRoutes.get('/roles', ...protect('ROLE_VIEW'), asyncRoute(list));
roleRoutes.post('/roles', ...protect('ROLE_ADD'), asyncRoute(create));
roleRoutes.put('/roles/:id', ...protect('ROLE_EDIT'), asyncRoute(update));
roleRoutes.delete('/roles/:id', ...protect('ROLE_DELETE'), asyncRoute(remove));
