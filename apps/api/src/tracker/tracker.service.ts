import { prisma } from '../common/db.js';
import type { TrackerUpdateInput } from './tracker.helpers.js';

export type TrackerRow = {
  id: string; eventId: string; title: string; description: string;
  startDate: string; endDate: string; talentId: string; talent: string;
  deliverable: string; submissionDate: string; publishingDate: string;
  status: 'Pending' | 'Done'; links: string[];
};

export async function listTrackerRows(month: string, selfId?: string): Promise<TrackerRow[]> {
  const first = `${month}-01`;
  const [year, number] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  const rows = await prisma.deliverable.findMany({
    where: { event: { startDate: { lte: last }, endDate: { gte: first } }, ...(selfId ? { talentId: selfId } : {}) },
    orderBy: [{ event: { startDate: 'asc' } }, { event: { title: 'asc' } }, { sortOrder: 'asc' }],
    include: { event: { select: { title: true, description: true, startDate: true, endDate: true } }, talent: { select: { name: true } } },
  });
  return rows.map(row => ({
    id: row.id, eventId: row.eventId, title: row.event.title, description: row.event.description,
    startDate: row.event.startDate, endDate: row.event.endDate, talentId: row.talentId, talent: row.talent.name,
    deliverable: row.type, submissionDate: row.submissionDate, publishingDate: row.publishingDate,
    status: row.status as 'Pending' | 'Done', links: row.links,
  }));
}

export async function updateTrackerItem(eventId: string, assignmentId: string, input: TrackerUpdateInput, selfId?: string) {
  const where = { id: assignmentId, eventId, ...(selfId ? { talentId: selfId } : {}) };
  const result = await prisma.deliverable.updateMany({ where, data: input });
  return result.count ? prisma.deliverable.findUnique({ where: { id: assignmentId } }) : null;
}
