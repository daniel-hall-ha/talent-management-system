import { Router } from 'express';
import { protect } from '../auth/auth.helpers.js';
import { asyncRoute } from '../common/http.js';
import { list, create, update, remove, batchImport } from './market-talents.controller.js';

export const marketTalentRoutes = Router();
marketTalentRoutes.get('/market-talents', ...protect('TALENT_DB_VIEW'), asyncRoute(list));
marketTalentRoutes.post('/market-talents', ...protect('TALENT_DB_ADD'), asyncRoute(create));
marketTalentRoutes.post('/market-talents/import', ...protect('TALENT_DB_ADD'), asyncRoute(batchImport));
marketTalentRoutes.put('/market-talents/:id', ...protect('TALENT_DB_EDIT'), asyncRoute(update));
marketTalentRoutes.delete('/market-talents/:id', ...protect('TALENT_DB_DELETE'), asyncRoute(remove));
