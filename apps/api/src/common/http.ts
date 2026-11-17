import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export type AuthRequest = Request & { actor?: { id: string; permissions: string[]; system: boolean } };
export const asyncRoute = (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
  (req: AuthRequest, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) return res.status(400).json({ error: error.issues.map(issue => issue.message).join(', ') });
  if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') return res.status(409).json({ error: 'A record with that name or email already exists' });
  if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  console.error(error);
  return res.status(500).json({ error: 'Server error' });
}
