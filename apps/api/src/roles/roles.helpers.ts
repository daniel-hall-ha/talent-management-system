import { z } from 'zod';
import { allPermissions } from '../auth/auth.helpers.js';

export const roleInput = z.object({
  name: z.string().trim().min(1), description: z.string().nullable().optional(),
  permissions: z.array(z.enum(allPermissions)), createAccount: z.boolean().default(false),
});
export type RoleInput = z.infer<typeof roleInput>;
