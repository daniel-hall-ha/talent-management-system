const secret = process.env.SESSION_SECRET;
const encryptionKey = process.env.CD_KEY_ENCRYPTION_KEY;

if (!secret || secret.length < 24 || !encryptionKey || !/^[a-f\d]{64}$/i.test(encryptionKey)) {
  throw new Error('Set SESSION_SECRET (24+ characters) and CD_KEY_ENCRYPTION_KEY (64 hex characters)');
}

export const config = {
  sessionSecret: secret,
  encryptionKey,
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
  port: Number(process.env.PORT || 3001),
};
