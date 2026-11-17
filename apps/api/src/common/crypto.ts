import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from './config.js';

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(config.encryptionKey, 'hex'), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), data.toString('hex')].join(':');
}

export function decrypt(value: string) {
  const [iv, tag, data] = value.split(':');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(config.encryptionKey, 'hex'), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
}
