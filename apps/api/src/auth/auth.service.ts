import bcrypt from 'bcryptjs';
import { prisma } from '../common/db.js';

export async function verifyLogin(identifier: string, password: string) {
  const user = await prisma.user.findUnique({ where: { loginId: identifier }, include: { role: true } });
  if (!user) return null;
  if (!user.active || !user.role.createAccount || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) return null;
  return user;
}
