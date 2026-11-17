import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../common/config.js';
import type { AuthRequest } from '../common/http.js';
import { allPermissions } from './auth.helpers.js';
import { verifyLogin } from './auth.service.js';

export async function login(req: AuthRequest, res: Response) {
  const input = z.object({ loginId: z.string().trim().min(1), password: z.string() }).parse(req.body);
  const user = await verifyLogin(input.loginId, input.password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.cookie('session', jwt.sign({ id: user.id }, config.sessionSecret, { expiresIn: '12h' }), {
    httpOnly: true, sameSite: config.webOrigin.startsWith('https://') ? 'none' : 'lax', secure: config.webOrigin.startsWith('https://'), maxAge: 43200000,
  });
  return res.json({ ok: true });
}
export function logout(_req: AuthRequest, res: Response) { res.clearCookie('session', { sameSite: config.webOrigin.startsWith('https://') ? 'none' : 'lax', secure: config.webOrigin.startsWith('https://') }); return res.json({ ok: true }); }
export function me(_req: AuthRequest, res: Response) { return res.json(res.locals.user); }
export function permissions(_req: AuthRequest, res: Response) { return res.json(allPermissions); }
