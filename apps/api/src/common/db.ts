import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');
const url = new URL(databaseUrl);
if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '3');

export const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
