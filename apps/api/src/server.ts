import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from 'zod';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();
const app = express();
const secret = process.env.SESSION_SECRET;
const encryptionKey = process.env.CD_KEY_ENCRYPTION_KEY;
if (!secret || secret.length < 24 || !encryptionKey || !/^[a-f\d]{64}$/i.test(encryptionKey)) throw new Error('Set SESSION_SECRET (24+ characters) and CD_KEY_ENCRYPTION_KEY (64 hex characters)');
app.use(cors({origin: process.env.WEB_ORIGIN || 'http://localhost:5173',credentials:true}));
app.use(express.json({limit:'30mb'}));
app.use(cookieParser());

type AuthRequest = Request & { actor?: { id:string; permissions:string[]; system:boolean } };
const asyncRoute = (fn:(req:AuthRequest,res:Response)=>Promise<unknown>) => (req:AuthRequest,res:Response,next:NextFunction) => Promise.resolve(fn(req,res)).catch(next);
const auth = (req:AuthRequest,res:Response,next:NextFunction) => Promise.resolve((async()=>{
  const token = req.cookies.session;
  if (!token) return res.status(401).json({error:'Authentication required'});
  let id:string;
  try { id = (jwt.verify(token,secret!) as {id:string}).id; } catch { return res.status(401).json({error:'Invalid session'}); }
  const user = await prisma.user.findUnique({where:{id},include:{role:true}});
  if (!user?.active || !user.role.createAccount || !user.passwordHash) return res.status(401).json({error:'Account disabled'});
  req.actor = {id:user.id,permissions:user.role.permissions,system:user.role.system};
  res.locals.user = {id:user.id,name:user.name,email:user.email,role:user.role.name,permissions:user.role.permissions};
  next();
})()).catch(next);
const requirePermission = (permission:string) => (req:AuthRequest,res:Response,next:NextFunction) => req.actor?.permissions.includes(permission) ? next() : res.status(403).json({error:'Permission denied'});
const protect = (permission:string) => [auth,requirePermission(permission)];
const encrypt = (plain:string) => {const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',Buffer.from(encryptionKey!,'hex'),iv);const data=Buffer.concat([cipher.update(plain,'utf8'),cipher.final()]);return [iv.toString('hex'),cipher.getAuthTag().toString('hex'),data.toString('hex')].join(':');};
const decrypt = (value:string) => {const [iv,tag,data]=value.split(':');const decipher=createDecipheriv('aes-256-gcm',Buffer.from(encryptionKey!,'hex'),Buffer.from(iv,'hex'));decipher.setAuthTag(Buffer.from(tag,'hex'));return Buffer.concat([decipher.update(Buffer.from(data,'hex')),decipher.final()]).toString('utf8');};
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v)),'Invalid date');
const eventInput = z.object({title:z.string().trim().min(1),description:z.string().trim().min(1),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),startDate:date,endDate:date,keyPoints:z.array(z.string().trim().min(1)).default([]),categories:z.array(z.enum(['Livestream','Highlight','Short Video','Others'])).default([]),talentDeliverables:z.record(z.string(),z.array(z.enum(['Livestream','Highlight','Short Video','Others']))).default({}),talentSubmissionDates:z.record(z.string(),date).default({}),talentIds:z.array(z.string().min(1)).default([]),details:z.string().max(500_000).default(''),cdKeys:z.object({giveaway:z.array(z.string().trim().min(1)).default([]),talents:z.record(z.string(),z.array(z.string().trim().min(1)))}).optional()}).refine(v=>v.startDate<=v.endDate,{message:'End date must be on or after start date'}).refine(v=>Object.values(v.talentSubmissionDates).every(value=>value>=v.startDate&&value<=v.endDate),{message:'Submission dates must be between the start and end dates'});
async function validTalentIds(ids:string[]) {
  if (new Set(ids).size !== ids.length) return false;
  if (!ids.length) return true;
  const count = await prisma.user.count({where:{id:{in:ids},active:true,role:{name:{in:talentRoleNames}}}});
  return count === ids.length;
}
const talentRoleNames = ['Talents', 'Exclusive Talents', 'Non-exclusive Talents'];
const allPermissions=['SOW_VIEW','SOW_ADD','SOW_EDIT','SOW_DELETE','USER_VIEW','USER_ADD','USER_EDIT','USER_DELETE','ROLE_VIEW','ROLE_ADD','ROLE_EDIT','ROLE_DELETE','CD_KEY_VIEW','CD_KEY_EDIT'];
const roleInput=z.object({name:z.string().trim().min(1),description:z.string().nullable().optional(),permissions:z.array(z.enum(allPermissions as [string,...string[]])),createAccount:z.boolean().default(false)});

app.post('/api/login',asyncRoute(async(req,res)=>{const {email,password}=z.object({email:z.string().email(),password:z.string()}).parse(req.body);const user=await prisma.user.findUnique({where:{email},include:{role:true}});if(!user?.active||!user.role.createAccount||!user.passwordHash||!await bcrypt.compare(password,user.passwordHash))return res.status(401).json({error:'Invalid credentials'});res.cookie('session',jwt.sign({id:user.id},secret!,{expiresIn:'12h'}),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:43200000});res.json({ok:true});}));
app.post('/api/logout',(_req,res)=>{res.clearCookie('session');res.json({ok:true});});
app.get('/api/me',auth,(_req,res)=>res.json(res.locals.user));
app.get('/api/permissions',auth,(_req,res)=>res.json(allPermissions));

app.get('/api/talents',auth,(req:AuthRequest,res:Response,next:NextFunction)=>req.actor?.permissions.some(p=>p==='SOW_ADD'||p==='SOW_EDIT')?next():res.status(403).json({error:'Permission denied'}),asyncRoute(async(req,res)=>{
  const query=z.string().trim().max(50).parse(req.query.query??'');
  res.json(await prisma.user.findMany({where:{active:true,role:{name:{in:talentRoleNames}},name:{contains:query,mode:'insensitive'}},orderBy:{name:'asc'},take:25,select:{id:true,name:true}}));
}));
app.get('/api/events',...protect('SOW_VIEW'),asyncRoute(async(req,res)=>{const month=z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);const first=`${month}-01`;const [y,m]=month.split('-').map(Number);const last=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);res.json(await prisma.event.findMany({where:{startDate:{lte:last},endDate:{gte:first}},orderBy:[{startDate:'asc'},{title:'asc'}],select:{id:true,title:true,description:true,color:true,startDate:true,endDate:true,keyPoints:true,categories:true,talentDeliverables:true,talentSubmissionDates:true,talents:{select:{id:true,name:true}},details:true,createdAt:true,updatedAt:true}}));}));
app.get('/api/events/:id',...protect('SOW_VIEW'),asyncRoute(async(req,res)=>{const event=await prisma.event.findUnique({where:{id:req.params.id},select:{id:true,title:true,description:true,color:true,startDate:true,endDate:true,keyPoints:true,categories:true,talentDeliverables:true,talentSubmissionDates:true,talents:{select:{id:true,name:true}},details:true}});if(!event)return res.status(404).json({error:'Event not found'});res.json(event);}));
app.get('/api/events/:id/keys',auth,(req:AuthRequest,res:Response,next:NextFunction)=>req.actor?.permissions.some(p=>p==='CD_KEY_VIEW'||p==='CD_KEY_EDIT')?next():res.status(403).json({error:'Permission denied'}),asyncRoute(async(req,res)=>{const event=await prisma.event.findUnique({where:{id:req.params.id},select:{cdKeysCipher:true}});if(!event)return res.status(404).json({error:'Event not found'});const stored=event.cdKeysCipher?JSON.parse(decrypt(event.cdKeysCipher)):null;res.json({cdKeys:Array.isArray(stored)?{giveaway:stored,talents:{}}:stored??{giveaway:[],talents:{}}});}));
app.get('/api/import/talents',...protect('SOW_ADD'),asyncRoute(async(_req,res)=>{
  res.json(await prisma.user.findMany({where:{active:true,role:{name:{in:talentRoleNames}}},select:{id:true,name:true,email:true}}));
}));
app.post('/api/import/events',...protect('SOW_ADD'),asyncRoute(async(req,res)=>{
  const rows=z.array(eventInput).min(1).max(500).parse(req.body?.events);
  if(rows.reduce((size,row)=>size+row.details.length,0)>20_000_000)return res.status(413).json({error:'Combined briefs must be 20 MB or smaller'});
  if(rows.some(row=>row.cdKeys!==undefined)&&!req.actor?.permissions.includes('CD_KEY_EDIT'))return res.status(403).json({error:'CD key permission denied'});
  for(const [index,row] of rows.entries()){
    if(Object.keys(row.talentDeliverables).some(id=>!row.talentIds.includes(id))||Object.keys(row.talentSubmissionDates).some(id=>!row.talentIds.includes(id)))return res.status(400).json({error:`Row ${index+1}: Talent assignments do not match deliverables or submission dates`});
    if(row.cdKeys&&Object.keys(row.cdKeys.talents).some(id=>!row.talentIds.includes(id)))return res.status(400).json({error:`Row ${index+1}: CD keys must belong to assigned talents`});
    if(!await validTalentIds(row.talentIds))return res.status(400).json({error:`Row ${index+1}: Assigned talents must be active users with a talent role`});
  }
  const created=await prisma.$transaction(rows.map(row=>{
    const {cdKeys,talentIds,...fields}=row;
    return prisma.event.create({data:{...fields,talents:{connect:talentIds.map(id=>({id}))},cdKeysCipher:cdKeys&&(cdKeys.giveaway.length||Object.values(cdKeys.talents).some(keys=>keys.length))?encrypt(JSON.stringify(cdKeys)):null},select:{id:true}});
  }));
  res.status(201).json({count:created.length});
}));
app.post('/api/events',...protect('SOW_ADD'),asyncRoute(async(req,res)=>{
  const input=eventInput.parse(req.body);
  if(input.cdKeys!==undefined&&!req.actor?.permissions.includes('CD_KEY_EDIT'))return res.status(403).json({error:'CD key permission denied'});
  if(Object.keys(input.talentDeliverables).some(id=>!input.talentIds.includes(id)))return res.status(400).json({error:'Deliverables can only be assigned to selected talents'});
  if(Object.keys(input.talentSubmissionDates).some(id=>!input.talentIds.includes(id)))return res.status(400).json({error:'Submission dates can only be assigned to selected talents'});
  if(!await validTalentIds(input.talentIds))return res.status(400).json({error:'Assigned talents must be active users with a talent role'});
  if(input.cdKeys&&Object.keys(input.cdKeys.talents).some(id=>!input.talentIds.includes(id)))return res.status(400).json({error:'CD keys can only be assigned to selected talents'});
  const {cdKeys,talentIds,...fields}=input;
  const event=await prisma.event.create({data:{...fields,talents:{connect:talentIds.map(id=>({id}))},cdKeysCipher:cdKeys&&(cdKeys.giveaway.length||Object.values(cdKeys.talents).some(keys=>keys.length))?encrypt(JSON.stringify(cdKeys)):null}});
  res.status(201).json({id:event.id});
}));
app.put('/api/events/:id',...protect('SOW_EDIT'),asyncRoute(async(req,res)=>{
  const input=eventInput.parse(req.body);
  if(input.cdKeys!==undefined&&!req.actor?.permissions.includes('CD_KEY_EDIT'))return res.status(403).json({error:'CD key permission denied'});
  const existing=await prisma.event.findUnique({where:{id:req.params.id},select:{talents:{select:{id:true}},cdKeysCipher:true}});
  if(!existing)return res.status(404).json({error:'Event not found'});
  const retained=new Set(existing.talents.map(talent=>talent.id));
  if(new Set(input.talentIds).size!==input.talentIds.length||!await validTalentIds(input.talentIds.filter(id=>!retained.has(id))))return res.status(400).json({error:'Newly assigned talents must be active users with a talent role'});
  if(input.cdKeys&&Object.keys(input.cdKeys.talents).some(id=>!input.talentIds.includes(id)))return res.status(400).json({error:'CD keys can only be assigned to selected talents'});
  if(Object.keys(input.talentDeliverables).some(id=>!input.talentIds.includes(id)))return res.status(400).json({error:'Deliverables can only be assigned to selected talents'});
  if(Object.keys(input.talentSubmissionDates).some(id=>!input.talentIds.includes(id)))return res.status(400).json({error:'Submission dates can only be assigned to selected talents'});
  const {cdKeys,talentIds,...fields}=input;
  const storedKeys=existing.cdKeysCipher?JSON.parse(decrypt(existing.cdKeysCipher)):null;
  const previousKeys=Array.isArray(storedKeys)?{giveaway:storedKeys,talents:{}}:storedKeys;
  const nextKeys=cdKeys??(previousKeys?{giveaway:previousKeys.giveaway,talents:Object.fromEntries(Object.entries(previousKeys.talents).filter(([id])=>talentIds.includes(id)))}:null);
  await prisma.event.update({where:{id:req.params.id},data:{...fields,talents:{set:talentIds.map(id=>({id}))},cdKeysCipher:nextKeys&&(nextKeys.giveaway.length||Object.values(nextKeys.talents).some(keys=>(keys as string[]).length))?encrypt(JSON.stringify(nextKeys)):null}});
  res.json({ok:true});
}));
app.delete('/api/events/:id',...protect('SOW_DELETE'),asyncRoute(async(req,res)=>{await prisma.event.delete({where:{id:req.params.id}});res.json({ok:true});}));

app.get('/api/roles',...protect('ROLE_VIEW'),asyncRoute(async(_req,res)=>res.json(await prisma.role.findMany({orderBy:{name:'asc'},include:{_count:{select:{users:true}}}}))));
app.post('/api/roles',...protect('ROLE_ADD'),asyncRoute(async(req,res)=>{const input=roleInput.parse(req.body);if(input.permissions.some(p=>!req.actor?.permissions.includes(p)))return res.status(403).json({error:'Cannot grant permissions you do not hold'});const role=await prisma.role.create({data:{name:input.name,description:input.description,permissions:[...new Set(input.permissions)],createAccount:input.createAccount}});res.status(201).json(role);}));
app.put('/api/roles/:id',...protect('ROLE_EDIT'),asyncRoute(async(req,res)=>{const input=roleInput.parse(req.body);const current=await prisma.role.findUnique({where:{id:req.params.id}});if(!current)return res.status(404).json({error:'Role not found'});if(current.system)return res.status(403).json({error:'System role cannot be edited'});if(input.createAccount&&!current.createAccount&&await prisma.user.count({where:{roleId:current.id,OR:[{email:null},{passwordHash:null}]}}))return res.status(409).json({error:'Move users without email or password to another role before enabling account creation'});if(input.permissions.some(p=>!req.actor?.permissions.includes(p)))return res.status(403).json({error:'Cannot grant permissions you do not hold'});const role=await prisma.$transaction(async tx=>{const updated=await tx.role.update({where:{id:req.params.id},data:{name:input.name,description:input.description,permissions:[...new Set(input.permissions)],createAccount:input.createAccount}});if(!input.createAccount&&current.createAccount)await tx.user.updateMany({where:{roleId:current.id},data:{passwordHash:null}});return updated;});res.json(role);}));
app.delete('/api/roles/:id',...protect('ROLE_DELETE'),asyncRoute(async(req,res)=>{const role=await prisma.role.findUnique({where:{id:req.params.id},include:{_count:{select:{users:true}}}});if(!role)return res.status(404).json({error:'Role not found'});if(role.system||role._count.users)return res.status(409).json({error:'System or assigned role cannot be deleted'});await prisma.role.delete({where:{id:role.id}});res.json({ok:true});}));

app.get('/api/users',...protect('USER_VIEW'),asyncRoute(async(_req,res)=>res.json(await prisma.user.findMany({orderBy:{name:'asc'},select:{id:true,name:true,email:true,phone:true,active:true,roleId:true,role:{select:{name:true}},createdAt:true}}))));
app.post('/api/users',...protect('USER_ADD'),asyncRoute(async(req,res)=>{
  const input=z.object({name:z.string().trim().min(1),email:z.union([z.email(),z.literal(''),z.null()]).optional(),phone:z.string().trim().nullable().optional(),password:z.string().optional(),roleId:z.string().min(1)}).parse(req.body);
  const role=await prisma.role.findUnique({where:{id:input.roleId}});
  if(!role||role.system&&!req.actor?.system||role.permissions.some(p=>!req.actor?.permissions.includes(p)))return res.status(403).json({error:'Cannot assign this role'});
  if(role.createAccount&&(!input.email||!input.password))return res.status(400).json({error:'Email and password are required for this role'});
  if(role.createAccount&&input.password!.length<12)return res.status(400).json({error:'Password must have at least 12 characters'});
  const user=await prisma.user.create({data:{name:input.name,email:input.email||null,phone:input.phone||null,roleId:input.roleId,passwordHash:role.createAccount?await bcrypt.hash(input.password!,12):null},select:{id:true}});
  res.status(201).json(user);
}));
app.put('/api/users/:id',...protect('USER_EDIT'),asyncRoute(async(req,res)=>{
  const input=z.object({name:z.string().trim().min(1),email:z.union([z.email(),z.literal(''),z.null()]).optional(),phone:z.string().trim().nullable().optional(),password:z.string().optional(),roleId:z.string().min(1)}).parse(req.body);
  const target=await prisma.user.findUnique({where:{id:req.params.id},include:{role:true}});
  if(!target)return res.status(404).json({error:'User not found'});
  if(target.role.system)return res.status(403).json({error:'Cannot edit super admin'});
  const role=await prisma.role.findUnique({where:{id:input.roleId}});
  if(!role||role.system&&!req.actor?.system||role.permissions.some(p=>!req.actor?.permissions.includes(p)))return res.status(403).json({error:'Cannot assign this role'});
  if(role.createAccount&&(!input.email||(!target.role.createAccount&&!input.password)||(!target.passwordHash&&!input.password)))return res.status(400).json({error:'Email and password are required when assigning an account role'});
  if(input.password&&input.password.length<12)return res.status(400).json({error:'Password must have at least 12 characters'});
  await prisma.user.update({where:{id:req.params.id},data:{name:input.name,email:input.email||null,phone:input.phone||null,roleId:input.roleId,passwordHash:role.createAccount?(input.password?await bcrypt.hash(input.password,12):target.passwordHash):null}});
  res.json({ok:true});
}));
app.delete('/api/users/:id',...protect('USER_DELETE'),asyncRoute(async(req,res)=>{if(req.actor?.id===req.params.id)return res.status(409).json({error:'Cannot disable your own account'});const target=await prisma.user.findUnique({where:{id:req.params.id},include:{role:true}});if(!target)return res.status(404).json({error:'User not found'});if(target.role.system)return res.status(403).json({error:'Cannot disable super admin'});await prisma.user.update({where:{id:req.params.id},data:{active:false}});res.json({ok:true});}));
app.post('/api/users/:id/enable',...protect('USER_EDIT'),asyncRoute(async(req,res)=>{await prisma.user.update({where:{id:req.params.id},data:{active:true}});res.json({ok:true});}));

app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(error instanceof ZodError)return res.status(400).json({error:error.issues.map(i=>i.message).join(', ')});if(typeof error==='object'&&error&&'code'in error&&error.code==='P2002')return res.status(409).json({error:'A record with that name or email already exists'});if(typeof error==='object'&&error&&'code'in error&&error.code==='P2025')return res.status(404).json({error:'Record not found'});console.error(error);res.status(500).json({error:'Server error'});});
app.listen(Number(process.env.PORT||3001),()=>console.log(`API listening on ${process.env.PORT||3001}`));
