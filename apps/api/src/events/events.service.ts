import { prisma } from '../common/db.js';
import { encrypt, decrypt } from '../common/crypto.js';
import type { EventInput } from './events.helpers.js';
import { normalizeAssignments } from './assignment.helpers.js';

const listSelect = { id:true,title:true,description:true,color:true,startDate:true,endDate:true,keyPoints:true,categories:true,talentAssignments:true,talents:{select:{id:true,name:true}},details:true,createdAt:true,updatedAt:true } as const;
const detailSelect = { id:true,title:true,description:true,color:true,startDate:true,endDate:true,keyPoints:true,categories:true,talentAssignments:true,talents:{select:{id:true,name:true}},details:true } as const;

export function listEvents(month: string, selfId?: string) {
  const first = `${month}-01`;
  const [year, number] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  return prisma.event.findMany({ where: { startDate: { lte: last }, endDate: { gte: first }, ...(selfId ? { talents: { some: { id: selfId } } } : {}) }, orderBy: [{ startDate: 'asc' }, { title: 'asc' }], select: listSelect });
}
export const getEvent = (id: string, selfId?: string) => prisma.event.findFirst({ where: { id, ...(selfId ? { talents: { some: { id: selfId } } } : {}) }, select: detailSelect });
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
  return prisma.event.create({ data: { ...fields, talentAssignments: normalizeAssignments(talentAssignments), talents: { connect: talentIds.map(id => ({ id })) }, cdKeysCipher: encryptedKeys(cdKeys) }, select: { id: true } });
}
export function updateEvent(id: string, input: EventInput, previousCipher: string | null) {
  const { cdKeys, talentIds, talentAssignments, ...fields } = input;
  const previousKeys = previousCipher ? readKeys(previousCipher) : null;
  const nextKeys = cdKeys ?? (previousKeys ? { giveaway: previousKeys.giveaway, talents: Object.fromEntries(Object.entries(previousKeys.talents).filter(([id]) => talentIds.includes(id))) } : undefined);
  return prisma.event.update({ where: { id }, data: { ...fields, talentAssignments: normalizeAssignments(talentAssignments), talents: { set: talentIds.map(id => ({ id })) }, cdKeysCipher: encryptedKeys(nextKeys) } });
}
export const deleteEvent = (id: string) => prisma.event.delete({ where: { id } });
