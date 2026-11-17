import type { Express } from 'express';
import { authRoutes } from './auth/auth.routes.js';
import { eventRoutes } from './events/events.routes.js';
import { importRoutes } from './imports/imports.routes.js';
import { roleRoutes } from './roles/roles.routes.js';
import { userRoutes } from './users/users.routes.js';
import { trackerRoutes } from './tracker/tracker.routes.js';
import { marketTalentRoutes } from './market-talents/market-talents.routes.js';

export function registerRoutes(app: Express) {
  app.use('/api', authRoutes, userRoutes, eventRoutes, importRoutes, roleRoutes, trackerRoutes, marketTalentRoutes);
}
