import { Router } from 'express';
import { asyncRoute } from '../common/http.js';
import { auth } from './auth.helpers.js';
import { login, logout, me, permissions } from './auth.controller.js';

export const authRoutes = Router();
authRoutes.post('/login', asyncRoute(login));
authRoutes.post('/logout', logout);
authRoutes.get('/me', auth, me);
authRoutes.get('/permissions', auth, permissions);
