import type { Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../common/http.js';
import { assignmentError, eventInput, validTalentIds } from '../events/events.helpers.js';
import { importEvents, listImportTalents } from './imports.service.js';

export async function talents(_req: AuthRequest, res: Response) {
  return res.json(await listImportTalents());
}
export async function events(req: AuthRequest, res: Response) {
  const rows = z.array(eventInput).min(1).max(500).parse(req.body?.events);
  if (rows.reduce((size, row) => size + row.details.length, 0) > 20_000_000) return res.status(413).json({ error: 'Combined briefs must be 20 MB or smaller' });
  if (rows.some(row => row.cdKeys !== undefined) && (!req.actor?.permissions.includes('CD_KEY_EDIT') || !req.actor?.permissions.includes('CD_KEY_VIEW_ALL'))) return res.status(403).json({ error: 'CD key permission denied' });
  for (const [index, row] of rows.entries()) {
    if (assignmentError(row)) return res.status(400).json({ error: `Row ${index + 1}: Talent assignments do not match deliverables or CD keys` });
    if (!await validTalentIds(row.talentIds)) return res.status(400).json({ error: `Row ${index + 1}: Assigned talents must be active users with a talent role` });
  }
  return res.status(201).json({ count: await importEvents(rows) });
}
