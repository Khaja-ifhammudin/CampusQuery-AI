import fs from 'fs';

export function getAdminKey() {
  if (process.env.ADMIN_API_KEY) return process.env.ADMIN_API_KEY.trim();
  try {
    const env = fs.readFileSync('.env', 'utf8');
    const match = env.match(/ADMIN_API_KEY=["']?([^"'\r\n]+)["']?/);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}
