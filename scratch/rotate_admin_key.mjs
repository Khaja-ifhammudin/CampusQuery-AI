import fs from 'fs';
import crypto from 'crypto';

const envPath = '.env';
if (!fs.existsSync(envPath)) {
  console.error('.env not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/ADMIN_API_KEY=(.+)/);
const oldKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';

// Save oldKey strictly in scratch for old-key-fails regression test
fs.writeFileSync('scratch/old_compromised_key.tmp', oldKey, 'utf-8');

// Generate cryptographically strong random token
const newKey = crypto.randomBytes(32).toString('hex');

// Update .env with new unquoted ADMIN_API_KEY
let updatedEnv;
if (/ADMIN_API_KEY=/.test(envContent)) {
  updatedEnv = envContent.replace(/ADMIN_API_KEY=.*/, `ADMIN_API_KEY=${newKey}`);
} else {
  updatedEnv = envContent.trim() + `\nADMIN_API_KEY=${newKey}\n`;
}

fs.writeFileSync(envPath, updatedEnv, 'utf-8');
console.log('Successfully rotated ADMIN_API_KEY in .env (key length: 64, unquoted).');
