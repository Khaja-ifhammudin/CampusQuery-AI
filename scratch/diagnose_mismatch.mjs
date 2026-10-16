import fs from 'fs';
import dotenv from 'dotenv';

const envPath = '.env';
if (!fs.existsSync(envPath)) {
  console.log('.env exists: false');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split(/\r?\n/);
const adminLine = lines.find(l => l.trim().startsWith('ADMIN_API_KEY'));

const parsed = dotenv.parse(envContent);
const parsedKey = parsed.ADMIN_API_KEY || '';

console.log({
  envExists: true,
  adminLineFound: Boolean(adminLine),
  adminLineStartsWith: adminLine ? adminLine.split('=')[0] : null,
  rawValHasDoubleQuotes: adminLine ? (adminLine.includes('"')) : false,
  rawValHasSingleQuotes: adminLine ? (adminLine.includes("'")) : false,
  rawValLength: adminLine ? adminLine.substring(adminLine.indexOf('=') + 1).length : 0,
  parsedKeyLength: parsedKey.length,
});

// Test against server verify endpoint with parsedKey
try {
  const res = await fetch('http://localhost:3000/api/admin/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey: parsedKey })
  });
  console.log('Server verify with parsedKey status:', res.status);
  const data = await res.json().catch(() => ({}));
  console.log('Server verify response:', data);
} catch (err) {
  console.log('Error verifying with server:', err.message);
}
