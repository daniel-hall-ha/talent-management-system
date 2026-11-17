import { Prisma } from '@prisma/client';
import { prisma } from '../common/db.js';
import { readAssignments, type StoredAssignment } from '../events/assignment.helpers.js';
import type { TrackerUpdateInput } from './tracker.helpers.js';

export type TrackerRow = {
  id: string; eventId: string; title: string; description: string;
  startDate: string; endDate: string; talentId: string; talent: string;
  deliverable: string; submissionDate: string; status: 'Pending' | 'Done'; links: string[];
};

export async function listTrackerRows(month: string, selfId?: string): Promise<TrackerRow[]> {
  const first = `${month}-01`;
  const [year, number] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  const events = await prisma.event.findMany({
    where: { startDate: { lte: last }, endDate: { gte: first }, ...(selfId ? { talents: { some: { id: selfId } } } : {}) },
    orderBy: [{ startDate: 'asc' }, { title: 'asc' }],
    select: { id: true, title: true, description: true, startDate: true, endDate: true, talentAssignments: true, talents: { select: { id: true, name: true } } },
  });
  return events.flatMap(event => {
    const assignments = readAssignments(event.talentAssignments);
    return event.talents.filter(talent => !selfId || talent.id === selfId).flatMap(talent => (assignments[talent.id] || []).map((item: StoredAssignment) => ({
      id: item.id, eventId: event.id, title: event.title, description: event.description,
      startDate: event.startDate, endDate: event.endDate, talentId: talent.id, talent: talent.name,
      deliverable: item.deliverable, submissionDate: item.submissionDate || '',
      status: item.status || 'Pending', links: item.links || [],
    })));
  });
}

export async function updateTrackerItem(eventId: string, assignmentId: string, input: TrackerUpdateInput, selfId?: string) {
  return prisma.$transaction(async tx => {
    const event = await tx.event.findUnique({ where: { id: eventId }, select: { talentAssignments: true, talents: { select: { id: true } } } });
    if (!event) return null;
    const assignments = readAssignments(event.talentAssignments);
    const talentIds = new Set(event.talents.map(talent => talent.id));
    let updated: StoredAssignment | null = null;
    for (const [talentId, items] of Object.entries(assignments)) {
      if (!talentIds.has(talentId) || selfId && talentId !== selfId) continue;
      const index = items.findIndex(item => item.id === assignmentId);
      if (index < 0) continue;
      updated = { ...items[index], ...input };
      assignments[talentId] = items.map((item, itemIndex) => itemIndex === index ? updated! : item);
      break;
    }
    if (!updated) return null;
    await tx.event.update({ where: { id: eventId }, data: { talentAssignments: assignments as Prisma.InputJsonValue } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
