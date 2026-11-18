import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const permissions = ['SOW_VIEW_ALL','SOW_VIEW','SOW_ADD','SOW_EDIT','SOW_DELETE','TRACKER_VIEW_ALL','TRACKER_VIEW','TRACKER_EDIT','USER_VIEW','USER_ADD','USER_EDIT','USER_DELETE','ROLE_VIEW','ROLE_ADD','ROLE_EDIT','ROLE_DELETE','CD_KEY_VIEW_ALL','CD_KEY_VIEW','CD_KEY_EDIT','TALENT_DB_VIEW','TALENT_DB_ADD','TALENT_DB_EDIT','TALENT_DB_DELETE'];
async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const loginId = process.env.SUPER_ADMIN_LOGIN_ID;
  if (!email || !password || password.length < 12 || !loginId || loginId.length < 32) throw new Error('Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD (12+ characters), and SUPER_ADMIN_LOGIN_ID (32+ characters)');
  const role = await prisma.role.upsert({where:{name:'Super Admin'},update:{permissions,system:true,createAccount:true},create:{name:'Super Admin',description:'Full system access',permissions,system:true,createAccount:true}});
  await prisma.user.upsert({where:{email},update:{roleId:role.id,loginId},create:{name:'Super Admin',email,loginId,passwordHash:await bcrypt.hash(password,12),roleId:role.id}});
  for (const name of ['Exclusive Talents', 'Non-exclusive Talents']) {
    await prisma.role.upsert({where:{name},update:{},create:{name,description:'Users available for event assignment',permissions:[],createAccount:false}});
  }
  for (const name of ['LIFESTYLE','TECH','GAMING','SINGER','DANCER','ACTOR','VLOGGER','FOOD_VLOGGER','BEAUTY','EDUCATION','MEDICINE','AESTHETIC','COSPLAYER','ONLINE_MEDIA','COMEDY','MODEL','INFLUENCER','AUTOMOTIVE','PHOTOGRAPHER']) {
    await prisma.marketTalentTag.upsert({ where: { name }, update: {}, create: { name } });
  }
}
main().finally(()=>prisma.$disconnect());
