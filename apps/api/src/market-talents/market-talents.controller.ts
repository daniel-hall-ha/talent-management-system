import type { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../common/db.js';
import type { AuthRequest } from '../common/http.js';

const input = z.object({
  name: z.string().trim().min(1).max(200),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  facebookPage: z.string().trim().max(500).default(''),
  facebookFollowers: z.number().int().min(0).max(2147483647).nullable().default(null),
  tiktokChannel: z.string().trim().max(500).default(''),
  tiktokFollowers: z.number().int().min(0).max(2147483647).nullable().default(null),
  youtubeChannel: z.string().trim().max(500).default(''),
  youtubeFollowers: z.number().int().min(0).max(2147483647).nullable().default(null),
});

async function validated(value: unknown) {
  const parsed = input.parse(value);
  const tags = [...new Set(parsed.tags)];
  const known = await prisma.marketTalentTag.findMany({ where: { name: { in: tags } }, select: { name: true } });
  if (known.length !== tags.length) throw new z.ZodError([{ code: 'custom', path: ['tags'], message: 'One or more tags are not available' }]);
  return { ...parsed, tags };
}

export async function list(_req: AuthRequest, res: Response) {
  const [talents, tags] = await Promise.all([
    prisma.marketTalent.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
    prisma.marketTalentTag.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return res.json({ talents, tags: tags.map(tag => tag.name) });
}
export async function create(req: AuthRequest, res: Response) {
  return res.status(201).json(await prisma.marketTalent.create({ data: await validated(req.body) }));
}
export async function update(req: AuthRequest, res: Response) {
  const exists = await prisma.marketTalent.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ error: 'Talent not found' });
  return res.json(await prisma.marketTalent.update({ where: { id: exists.id }, data: await validated(req.body) }));
}
export async function batchImport(req: AuthRequest, res: Response) {
  const rows = z.array(input).min(1).max(1000).parse(req.body?.rows);
  const data = await Promise.all(rows.map(validated));
  await prisma.marketTalent.createMany({ data });
  return res.status(201).json({ created: data.length });
}
