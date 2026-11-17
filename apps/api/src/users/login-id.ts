import { randomBytes } from 'node:crypto';

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function makeLoginId(name: string) {
  const prefix = name.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 40) || 'user';
  const bytes = randomBytes(6);
  return `${prefix}${Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('')}`;
}
