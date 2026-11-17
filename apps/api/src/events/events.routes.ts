import { Router } from 'express';
import { asyncRoute } from '../common/http.js';
import { protect, protectAny } from '../auth/auth.helpers.js';
import { list, detail, keys, create, update, remove } from './events.controller.js';

export const eventRoutes = Router();
eventRoutes.get('/events', ...protectAny('SOW_VIEW', 'SOW_VIEW_ALL', 'SOW_EDIT'), asyncRoute(list));
eventRoutes.get('/events/:id', ...protectAny('SOW_VIEW', 'SOW_VIEW_ALL', 'SOW_EDIT'), asyncRoute(detail));
eventRoutes.get('/events/:id/keys', ...protectAny('CD_KEY_VIEW', 'CD_KEY_VIEW_ALL', 'CD_KEY_EDIT'), asyncRoute(keys));
eventRoutes.post('/events', ...protect('SOW_ADD'), asyncRoute(create));
eventRoutes.put('/events/:id', ...protect('SOW_EDIT'), ...protect('SOW_VIEW_ALL'), asyncRoute(update));
eventRoutes.delete('/events/:id', ...protect('SOW_DELETE'), ...protect('SOW_VIEW_ALL'), asyncRoute(remove));
