import { prisma } from '../common/db.js';
import { encrypt } from '../common/crypto.js';
import { talentRoleNames, type EventInput } from '../events/events.helpers.js';
import { normalizeAssignments } from '../events/assignment.helpers.js';

export function listImportTalents() {
  return prisma.user.findMany({ where: { active: true, role: { name: { in: talentRoleNames } } }, select: { id: true, name: true, email: true } });
}
export async function importEvents(rows: EventInput[]) {
  const created = await prisma.$transaction(rows.map(row => {
    const { cdKeys, talentIds, talentAssignments, ...fields } = row;
    return prisma.event.create({ data: {
      ...fields, talentAssignments: normalizeAssignments(talentAssignments), talents: { connect: talentIds.map(id => ({ id })) },
      cdKeysCipher: cdKeys && (cdKeys.giveaway.length || Object.values(cdKeys.talents).some(keys => keys.length)) ? encrypt(JSON.stringify(cdKeys)) : null,
    }, select: { id: true } });
  }));
  return created.length;
}
