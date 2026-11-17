import { prisma } from '../common/db.js';
import type { RoleInput } from './roles.helpers.js';

export const listRoles = () => prisma.role.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true } } } });
export const getRole = (id: string) => prisma.role.findUnique({ where: { id } });
export const getRoleWithUsers = (id: string) => prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
export const countUsersMissingCredentials = (roleId: string) => prisma.user.count({ where: { roleId, passwordHash: null } });
export function createRole(input: RoleInput) {
  return prisma.role.create({ data: { ...input, permissions: [...new Set(input.permissions)] } });
}
export function updateRole(id: string, input: RoleInput, wasAccountRole: boolean) {
  return prisma.$transaction(async tx => {
    const updated = await tx.role.update({ where: { id }, data: { ...input, permissions: [...new Set(input.permissions)] } });
    if (!input.createAccount && wasAccountRole) await tx.user.updateMany({ where: { roleId: id }, data: { passwordHash: null } });
    return updated;
  });
}
export const deleteRole = (id: string) => prisma.role.delete({ where: { id } });
