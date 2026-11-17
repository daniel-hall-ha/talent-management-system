import type { Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../common/http.js';
import { assignmentError, eventInput, validTalentIds } from './events.helpers.js';
import { createEvent, deleteEvent, getEvent, getEventKeys, getExistingEvent, listEvents, readKeys, updateEvent } from './events.service.js';

export async function list(req: AuthRequest, res: Response) {
  const month = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);
  const selfId = req.actor?.permissions.includes('SOW_VIEW_ALL') ? undefined : req.actor?.id;
  const events = await listEvents(month, selfId);
  return res.json(selfId ? events.map(event => ({ ...event, talents: event.talents.filter(talent => talent.id === selfId), talentAssignments: { [selfId]: (event.talentAssignments as Record<string, unknown>)[selfId] || [] } })) : events);
}
export async function detail(req: AuthRequest, res: Response) {
  const selfId = req.actor?.permissions.includes('SOW_VIEW_ALL') ? undefined : req.actor?.id;
  const event = await getEvent(req.params.id, selfId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  return res.json(selfId ? { ...event, talents: event.talents.filter(talent => talent.id === selfId), talentAssignments: { [selfId]: (event.talentAssignments as Record<string, unknown>)[selfId] || [] } } : event);
}
export async function keys(req: AuthRequest, res: Response) {
  const event = await getEventKeys(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const all = req.actor?.permissions.includes('CD_KEY_VIEW_ALL');
  if (!all && !event.talents.some(talent => talent.id === req.actor?.id)) return res.status(404).json({ error: 'Event not found' });
  const keys = readKeys(event.cdKeysCipher);
  return res.json({ cdKeys: all ? keys : { giveaway: [], talents: { [req.actor!.id]: keys.talents[req.actor!.id] || [] } } });
}
export async function create(req: AuthRequest, res: Response) {
  const input = eventInput.parse(req.body);
  if (input.cdKeys !== undefined && (!req.actor?.permissions.includes('CD_KEY_EDIT') || !req.actor?.permissions.includes('CD_KEY_VIEW_ALL'))) return res.status(403).json({ error: 'CD key permission denied' });
  const error = assignmentError(input);
  if (error) return res.status(400).json({ error });
  if (!await validTalentIds(input.talentIds)) return res.status(400).json({ error: 'Assigned talents must be active users with a talent role' });
  return res.status(201).json(await createEvent(input));
}
export async function update(req: AuthRequest, res: Response) {
  const input = eventInput.parse(req.body);
  if (input.cdKeys !== undefined && (!req.actor?.permissions.includes('CD_KEY_EDIT') || !req.actor?.permissions.includes('CD_KEY_VIEW_ALL'))) return res.status(403).json({ error: 'CD key permission denied' });
  const existing = await getExistingEvent(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  const retained = new Set(existing.talents.map(talent => talent.id));
  if (new Set(input.talentIds).size !== input.talentIds.length || !await validTalentIds(input.talentIds.filter(id => !retained.has(id)))) return res.status(400).json({ error: 'Newly assigned talents must be active users with a talent role' });
  const error = assignmentError(input);
  if (error) return res.status(400).json({ error });
  await updateEvent(req.params.id, input, existing.cdKeysCipher);
  return res.json({ ok: true });
}
export async function remove(req: AuthRequest, res: Response) {
  await deleteEvent(req.params.id);
  return res.json({ ok: true });
}
