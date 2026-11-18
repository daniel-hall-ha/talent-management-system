import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PrismaClient, type Prisma } from '@prisma/client';

// One-time importer for the root current-data PostgreSQL custom dump.
// Preview: npm run db:import-data    Apply: npm run db:import-data -- --apply
// Run locally with Docker's postgres container and a reachable target DATABASE_URL.
const dumpPath = fileURLToPath(new URL('../../../current-data', import.meta.url));
const container = process.env.IMPORT_POSTGRES_CONTAINER || 'postgres';
const localUrl = new URL(process.env.IMPORT_LOCAL_URL || 'postgresql://postgres:postgres@localhost:5432/postgres');
const targetUrl = process.env.DATABASE_URL;
const apply = process.argv.includes('--apply');
const defaultTags = new Set(['LIFESTYLE','TECH','GAMING','SINGER','DANCER','ACTOR','VLOGGER','FOOD_VLOGGER','BEAUTY','EDUCATION','MEDICINE','AESTHETIC','COSPLAYER','ONLINE_MEDIA','COMEDY','MODEL','INFLUENCER','AUTOMOTIVE','PHOTOGRAPHER']);

function docker(args: string[], input?: Buffer) {
  const result = spawnSync('docker', ['exec', ...(input ? ['-i'] : []), container, ...args], {
    input, encoding: input ? undefined : 'utf8', maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Docker ${args[0]} failed: ${String(result.stderr || result.stdout).trim()}`);
}

async function main() {
  if (!targetUrl) throw new Error('Set DATABASE_URL to the reachable Supabase Session pooler URL');
  const targetParsed = new URL(targetUrl);
  if (!targetParsed.hostname.endsWith('.supabase.com') && !targetParsed.hostname.endsWith('.supabase.co') && process.env.IMPORT_ALLOW_LOCAL_TARGET !== '1') {
    throw new Error('DATABASE_URL must point to Supabase. Set IMPORT_ALLOW_LOCAL_TARGET=1 only for an isolated local test database.');
  }
  const tempName = `tms_import_${randomBytes(6).toString('hex')}`;
  const sourceUrl = new URL(localUrl);
  sourceUrl.pathname = `/${tempName}`;
  const source = new PrismaClient({ datasources: { db: { url: sourceUrl.toString() } } });
  const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });
  let created = false;
  try {
    docker(['createdb', '-U', 'postgres', tempName]);
    created = true;
    docker(['pg_restore', '-U', 'postgres', '-d', tempName, '--no-owner', '--no-privileges', '--exit-on-error'], readFileSync(dumpPath));

    const [users, events, marketTalents, sourceTags, targetRoles] = await Promise.all([
      source.user.findMany({ where: { role: { system: false } }, include: { role: true }, orderBy: { id: 'asc' } }),
      source.event.findMany({ include: { talents: { include: { role: true } } }, orderBy: { id: 'asc' } }),
      source.marketTalent.findMany({ orderBy: { id: 'asc' } }),
      source.marketTalentTag.findMany(),
      target.role.findMany(),
    ]);
    const rolesByName = new Map(targetRoles.map(role => [role.name, role]));
    for (const user of users) {
      const role = rolesByName.get(user.role.name);
      if (!role) throw new Error(`Supabase is missing role "${user.role.name}". Create/seed it first; this importer does not copy roles.`);
      if (role.createAccount !== user.role.createAccount) throw new Error(`Role "${role.name}" has Create New Account=${role.createAccount} in Supabase but ${user.role.createAccount} in the dump. Set the target role to match before importing users.`);
    }
    const userIds = new Set(users.map(user => user.id));
    for (const event of events) {
      const missing = event.talents.filter(talent => !userIds.has(talent.id));
      if (missing.length) throw new Error(`Event "${event.title}" references a system user. Remove that assignment from the source before importing.`);
    }
    const customTags = sourceTags.filter(tag => !defaultTags.has(tag.name));
    console.log(JSON.stringify({ target: targetParsed.hostname, users: users.length, events: events.length, eventAssignments: events.reduce((sum, event) => sum + event.talents.length, 0), marketTalents: marketTalents.length, customTags: customTags.length, systemRoles: 'skipped', adminAccounts: 'skipped', defaultTags: 'skipped', migrationHistory: 'skipped', mode: apply ? 'apply' : 'preview' }, null, 2));
    if (!apply) return;

    await target.$transaction(async tx => {
      for (const tag of customTags) await tx.marketTalentTag.upsert({ where: { name: tag.name }, update: {}, create: { name: tag.name } });
      for (const user of users) {
        const { role: sourceRole, assignedEvents: _assignedEvents, ...fields } = user as typeof user & { assignedEvents?: unknown };
        const data = { ...fields, roleId: rolesByName.get(sourceRole.name)!.id };
        await tx.user.upsert({ where: { id: user.id }, update: data, create: data });
      }
      for (const event of events) {
        const { talents, ...fields } = event;
        const data = {
          ...fields,
          talentDeliverables: fields.talentDeliverables as Prisma.InputJsonValue,
          talentSubmissionDates: fields.talentSubmissionDates as Prisma.InputJsonValue,
          talentAssignments: fields.talentAssignments as Prisma.InputJsonValue,
        };
        const connections = talents.map(talent => ({ id: talent.id }));
        await tx.event.upsert({ where: { id: event.id }, update: { ...data, talents: { set: connections } }, create: { ...data, talents: { connect: connections } } });
      }
      for (const talent of marketTalents) await tx.marketTalent.upsert({ where: { id: talent.id }, update: talent, create: talent });
    }, { timeout: 120000 });
    console.log('Business data imported successfully. Supabase roles, admin account, defaults, and migration history were unchanged.');
  } finally {
    await Promise.allSettled([source.$disconnect(), target.$disconnect()]);
    if (created) docker(['dropdb', '-U', 'postgres', '--if-exists', '--force', tempName]);
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
