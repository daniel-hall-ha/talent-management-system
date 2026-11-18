import { prisma } from '../common/db.js';
import { encrypt, decrypt } from '../common/crypto.js';
import type { EventInput } from './events.helpers.js';
import { assignmentRows, assignmentsFromRows } from './assignment.helpers.js';

const listSelect = { id:true,title:true,description:true,color:true,startDate:true,endDate:true,keyPoints:true,categories:true,deliverables:{orderBy:{sortOrder:'asc' as const}},talents:{select:{id:true,name:true}},details:true,createdAt:true,updatedAt:true } as const;
const detailSelect = { id:true,title:true,description:true,color:true,startDate:true,endDate:true,keyPoints:true,categories:true,deliverables:{orderBy:{sortOrder:'asc' as const}},talents:{select:{id:true,name:true}},details:true } as const;
function eventResponse<T extends { deliverables: Array<{ id: string; talentId: string; type: string; submissionDate: string; publishingDate: string; status: string; links: string[] }> }>(event: T, selfId?: string) {
  const { deliverables, ...fields } = event;
  return { ...fields, ...(selfId ? { talents: 'talents' in fields && Array.isArray(fields.talents) ? fields.talents.filter((talent: { id: string }) => talent.id === selfId) : [] } : {}), talentAssignments: assignmentsFromRows(selfId ? deliverables.filter(row => row.talentId === selfId) : deliverables) };
}

export async function listEvents(month: string, selfId?: string) {
  const first = `${month}-01`;
  const [year, number] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  const events = await prisma.event.findMany({ where: { startDate: { lte: last }, endDate: { gte: first }, ...(selfId ? { talents: { some: { id: selfId } } } : {}) }, orderBy: [{ startDate: 'asc' }, { title: 'asc' }], select: listSelect });
  return events.map(event => eventResponse(event, selfId));
}
export async function getEvent(id: string, selfId?: string) {
  const event = await prisma.event.findFirst({ where: { id, ...(selfId ? { talents: { some: { id: selfId } } } : {}) }, select: detailSelect });
  return event ? eventResponse(event, selfId) : null;
}
export const getEventKeys = (id: string) => prisma.event.findUnique({ where: { id }, select: { cdKeysCipher: true, talents: { select: { id: true } } } });
export const getExistingEvent = (id: string) => prisma.event.findUnique({ where: { id }, select: { talents: { select: { id: true } }, cdKeysCipher: true } });

type CdKeys = { giveaway: string[]; talents: Record<string, string[]> };
export function readKeys(cipher: string | null): CdKeys {
  const stored = cipher ? JSON.parse(decrypt(cipher)) as CdKeys | string[] : null;
  return Array.isArray(stored) ? { giveaway: stored, talents: {} } : stored ?? { giveaway: [], talents: {} };
}
function encryptedKeys(keys: EventInput['cdKeys']) {
  return keys && (keys.giveaway.length || Object.values(keys.talents).some(items => items.length)) ? encrypt(JSON.stringify(keys)) : null;
}
export function createEvent(input: EventInput) {
  const { cdKeys, talentIds, talentAssignments, ...fields } = input;
  return prisma.event.create({ data: { ...fields, deliverables: { create: assignmentRows(talentAssignments).map(({ talentId, ...row }) => ({ ...row, talent: { connect: { id: talentId } } })) }, talents: { connect: talentIds.map(id => ({ id })) }, cdKeysCipher: encryptedKeys(cdKeys) }, select: { id: true } });
}
export function updateEvent(id: string, input: EventInput, previousCipher: string | null) {
  const { cdKeys, talentIds, talentAssignments, ...fields } = input;
  const previousKeys = previousCipher ? readKeys(previousCipher) : null;
  const nextKeys = cdKeys ?? (previousKeys ? { giveaway: previousKeys.giveaway, talents: Object.fromEntries(Object.entries(previousKeys.talents).filter(([id]) => talentIds.includes(id))) } : undefined);
  return prisma.$transaction(async tx => {
    await tx.deliverable.deleteMany({ where: { eventId: id } });
    return tx.event.update({ where: { id }, data: { ...fields, deliverables: { create: assignmentRows(talentAssignments).map(({ talentId, ...row }) => ({ ...row, talent: { connect: { id: talentId } } })) }, talents: { set: talentIds.map(id => ({ id })) }, cdKeysCipher: encryptedKeys(nextKeys) } });
  });
}
export const deleteEvent = (id: string) => prisma.event.delete({ where: { id } });
