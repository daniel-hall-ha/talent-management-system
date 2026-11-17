import { Router } from 'express';
import { asyncRoute } from '../common/http.js';
import { protect } from '../auth/auth.helpers.js';
import { talents, events } from './imports.controller.js';

export const importRoutes = Router();
importRoutes.get('/import/talents', ...protect('SOW_ADD'), asyncRoute(talents));
importRoutes.post('/import/events', ...protect('SOW_ADD'), asyncRoute(events));
