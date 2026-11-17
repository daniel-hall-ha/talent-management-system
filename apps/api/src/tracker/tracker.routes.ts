import { Router } from 'express';
import { asyncRoute } from '../common/http.js';
import { protectAny, protect } from '../auth/auth.helpers.js';
import { list, update } from './tracker.controller.js';

export const trackerRoutes = Router();
trackerRoutes.get('/tracker', ...protectAny('TRACKER_VIEW', 'TRACKER_VIEW_ALL', 'TRACKER_EDIT'), asyncRoute(list));
trackerRoutes.patch('/tracker/:eventId/:assignmentId', ...protect('TRACKER_EDIT'), asyncRoute(update));
