import { z } from 'zod';
import { prisma } from '../common/db.js';
import { assignmentInput } from './assignment.helpers.js';

export const talentRoleNames = ['Talents', 'Exclusive Talents', 'Non-exclusive Talents'];
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => !Number.isNaN(Date.parse(value)), 'Invalid date');
const category = z.enum(['Livestream', 'Highlight', 'Short Video', 'Others']);
export const eventInput = z.object({
  title: z.string().trim().min(1), description: z.string().trim().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/), startDate: date, endDate: date,
  keyPoints: z.array(z.string().trim().min(1)).default([]), categories: z.array(category).default([]),
  talentAssignments: z.record(z.string(), z.array(assignmentInput)).default({}),
  talentIds: z.array(z.string().min(1)).default([]), details: z.string().max(500_000).default(''),
  cdKeys: z.object({ giveaway: z.array(z.string().trim().min(1)).default([]), talents: z.record(z.string(), z.array(z.string().trim().min(1))) }).optional(),
}).refine(value => value.startDate <= value.endDate, { message: 'End date must be on or after start date' })
  .refine(value => Object.values(value.talentAssignments).flat().every(item => !item.submissionDate || item.submissionDate >= value.startDate && item.submissionDate <= value.endDate), { message: 'Submission dates must be between the start and end dates' })
  .refine(value => Object.values(value.talentAssignments).flat().every(item => !item.publishingDate || item.publishingDate >= value.startDate && item.publishingDate <= value.endDate), { message: 'Publishing dates must be between the start and end dates' });
export type EventInput = z.infer<typeof eventInput>;

export async function validTalentIds(ids: string[]) {
  if (new Set(ids).size !== ids.length) return false;
  if (!ids.length) return true;
  const count = await prisma.user.count({ where: { id: { in: ids }, active: true, role: { name: { in: talentRoleNames } } } });
  return count === ids.length;
}
export function assignmentError(input: EventInput) {
  if (Object.keys(input.talentAssignments).some(id => !input.talentIds.includes(id))) return 'Deliverables can only be assigned to selected talents';
  const assignmentIds = Object.values(input.talentAssignments).flat().map(item => item.id).filter(Boolean);
  if (new Set(assignmentIds).size !== assignmentIds.length) return 'Deliverable IDs must be unique';
  if (input.cdKeys && Object.keys(input.cdKeys.talents).some(id => !input.talentIds.includes(id))) return 'CD keys can only be assigned to selected talents';
  return null;
}
