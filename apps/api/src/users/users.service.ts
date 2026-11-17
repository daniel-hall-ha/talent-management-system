import bcrypt from 'bcryptjs';
import { prisma } from '../common/db.js';
import type { UserInput } from './users.helpers.js';
import { talentRoleNames } from '../events/events.helpers.js';
import { makeLoginId } from './login-id.js';

export const listUsers = () => prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id:true,name:true,loginId:true,email:true,phone:true,active:true,roleId:true,role:{select:{name:true,system:true}},createdAt:true } });
export const getUser = (id: string) => prisma.user.findUnique({ where: { id }, include: { role: true } });
export const getRole = (id: string) => prisma.role.findUnique({ where: { id } });
export async function createUser(input: UserInput, createAccount: boolean) {
  const passwordHash = createAccount ? await bcrypt.hash(input.password!, 12) : null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.user.create({ data: {
        name: input.name, loginId: createAccount ? makeLoginId(input.name) : null,
        email: input.email || null, phone: input.phone || null, roleId: input.roleId, passwordHash,
      }, select: { id: true, loginId: true } });
    } catch (error) {
      if (!createAccount || typeof error !== 'object' || !error || !('code' in error) || error.code !== 'P2002' || !('meta' in error) || !String((error.meta as { target?: unknown })?.target).includes('loginId')) throw error;
    }
  }
  throw new Error('Could not generate a unique login ID');
}
export async function updateUser(id: string, input: UserInput, createAccount: boolean, previousHash: string | null, previousLoginId: string | null) {
  return prisma.user.update({ where: { id }, data: {
    name: input.name, email: input.email || null, phone: input.phone || null, roleId: input.roleId,
    loginId: createAccount ? previousLoginId || makeLoginId(input.name) : null,
    passwordHash: createAccount ? (input.password ? await bcrypt.hash(input.password, 12) : previousHash) : null,
  } });
}
export const setUserActive = (id: string, active: boolean) => prisma.user.update({ where: { id }, data: { active } });

export const searchTalents = (query: string) => prisma.user.findMany({ where: { active: true, role: { name: { in: talentRoleNames } }, name: { contains: query, mode: 'insensitive' } }, orderBy: { name: 'asc' }, take: 25, select: { id: true, name: true } });

export const countAccountUsersNamed = (name: string, exceptId?: string) => prisma.user.count({ where: { name: { equals: name, mode: 'insensitive' }, role: { createAccount: true }, ...(exceptId ? { id: { not: exceptId } } : {}) } });
