import type { Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../common/http.js';
import { trackerUpdateInput } from './tracker.helpers.js';
import { listTrackerRows, updateTrackerItem } from './tracker.service.js';

export async function list(req: AuthRequest, res: Response) {
  const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(req.query.month);
  const selfId = req.actor?.permissions.includes('TRACKER_VIEW_ALL') ? undefined : req.actor?.id;
  return res.json(await listTrackerRows(month, selfId));
}
export async function update(req: AuthRequest, res: Response) {
  const input = trackerUpdateInput.parse(req.body);
  const result = await updateTrackerItem(req.params.eventId, req.params.assignmentId, input, req.actor?.permissions.includes('TRACKER_VIEW_ALL') ? undefined : req.actor?.id);
  return result ? res.json(result) : res.status(404).json({ error: 'Deliverable not found' });
}
