import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const permissions = ['SOW_VIEW','SOW_ADD','SOW_EDIT','SOW_DELETE','USER_VIEW','USER_ADD','USER_EDIT','USER_DELETE','ROLE_VIEW','ROLE_ADD','ROLE_EDIT','ROLE_DELETE','CD_KEY_VIEW','CD_KEY_EDIT'];
async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error('Set SUPER_ADMIN_EMAIL and a SUPER_ADMIN_PASSWORD of at least 12 characters');
  const role = await prisma.role.upsert({where:{name:'Super Admin'},update:{permissions,system:true,createAccount:true},create:{name:'Super Admin',description:'Full system access',permissions,system:true,createAccount:true}});
  await prisma.user.upsert({where:{email},update:{roleId:role.id},create:{name:'Super Admin',email,passwordHash:await bcrypt.hash(password,12),roleId:role.id}});
  for (const name of ['Exclusive Talents', 'Non-exclusive Talents']) {
    await prisma.role.upsert({where:{name},update:{},create:{name,description:'Users available for event assignment',permissions:[],createAccount:false}});
  }
}
main().finally(()=>prisma.$disconnect());
