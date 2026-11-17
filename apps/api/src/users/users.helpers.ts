import { z } from 'zod';

const email = z.union([z.email(), z.literal(''), z.null()]).optional();
const phone = z.string().trim().nullable().optional();
export const userCreateInput = z.object({ name: z.string().trim().min(1), email, phone, password: z.string().optional(), roleId: z.string().min(1) });
export const userUpdateInput = userCreateInput;
export type UserInput = z.infer<typeof userCreateInput>;

export function canAssignRole(role: { system: boolean; permissions: string[] } | null, actor: { system: boolean; permissions: string[] } | undefined) {
  return Boolean(role && (!role.system || actor?.system) && role.permissions.every(permission => actor?.permissions.includes(permission)));
}
