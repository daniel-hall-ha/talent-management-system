import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const trackerStatus = z.enum(['Pending', 'Done']);
export const webLink = z.url().max(2048).refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Links must use http or https');
export const assignmentInput = z.object({
  id: z.string().min(1).optional(),
  deliverable: z.enum(['Livestream', 'Highlight', 'Short Video', 'Others']),
  submissionDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).default(''),
  publishingDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).default(''),
  status: trackerStatus.default('Pending'),
  links: z.array(webLink).max(20).default([]),
});
export type Assignment = z.infer<typeof assignmentInput>;
export type StoredAssignment = Assignment & { id: string };
export type AssignmentMap = Record<string, StoredAssignment[]>;

export function assignmentRows(input: Record<string, Assignment[]>) {
  return Object.entries(normalizeAssignments(input)).flatMap(([talentId, rows]) => rows.map((row, sortOrder) => ({
    id: row.id, talentId, type: row.deliverable, submissionDate: row.submissionDate || '',
    publishingDate: row.publishingDate || '', status: row.status || 'Pending', links: row.links || [], sortOrder,
  })));
}

export function assignmentsFromRows(rows: Array<{ id: string; talentId: string; type: string; submissionDate: string; publishingDate: string; status: string; links: string[] }>): AssignmentMap {
  const result: AssignmentMap = {};
  for (const row of rows) (result[row.talentId] ||= []).push({ id: row.id, deliverable: row.type as Assignment['deliverable'], submissionDate: row.submissionDate, publishingDate: row.publishingDate, status: row.status as Assignment['status'], links: row.links });
  return result;
}

export function normalizeAssignments(input: Record<string, Assignment[]>): AssignmentMap {
  return Object.fromEntries(Object.entries(input).map(([talentId, rows]) => [talentId, rows.map(row => ({
    ...row, id: row.id || randomUUID(), status: row.status || 'Pending', links: row.links || [],
  }))]));
}
export function readAssignments(value: unknown): AssignmentMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as AssignmentMap;
}
