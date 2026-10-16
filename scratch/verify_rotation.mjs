import fetch from 'node-fetch';
import { getAdminKey } from './get_admin_key.mjs';

const BASE_URL = 'http://localhost:3000';
const OLD_EXPOSED_KEY = 'campus_admin_sec_2026_x9k';
const NEW_KEY = getAdminKey();

async function runRotationVerification() {
  console.log('=== VERIFYING CREDENTIAL ROTATION ===\n');

  // Check 1: Old exposed credential must be REJECTED (401)
  const oldRes1 = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${OLD_EXPOSED_KEY}` }
  });
  const oldRejected1 = oldRes1.status === 401;

  const oldRes2 = await fetch(`${BASE_URL}/api/admin/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey: OLD_EXPOSED_KEY })
  });
  const oldRejected2 = oldRes2.status === 401;

  console.log(`[REVOCATION] Old credential access to /api/admin/analytics: HTTP ${oldRes1.status} -> ${oldRejected1 ? 'REJECTED (PASS)' : 'FAILED'}`);
  console.log(`[REVOCATION] Old credential verify /api/admin/auth/verify: HTTP ${oldRes2.status} -> ${oldRejected2 ? 'REJECTED (PASS)' : 'FAILED'}`);

  // Check 2: New rotated credential must be ACCEPTED (200) without exposing value
  const newRes1 = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${NEW_KEY}` }
  });
  const newAccepted1 = newRes1.status === 200;

  const newRes2 = await fetch(`${BASE_URL}/api/admin/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey: NEW_KEY })
  });
  const newVerifyData = await newRes2.json();
  const newAccepted2 = newRes2.status === 200 && newVerifyData.valid === true;

  console.log(`[AUTHORIZATION] New rotated credential access to /api/admin/analytics: HTTP ${newRes1.status} -> ${newAccepted1 ? 'ACCEPTED (PASS)' : 'FAILED'}`);
  console.log(`[AUTHORIZATION] New rotated credential verify: HTTP ${newRes2.status}, valid=${newVerifyData.valid} -> ${newAccepted2 ? 'ACCEPTED (PASS)' : 'FAILED'}`);

  const allPassed = oldRejected1 && oldRejected2 && newAccepted1 && newAccepted2;
  console.log('\n===============================================');
  console.log(`ROTATION VERIFICATION OVERALL: ${allPassed ? 'ALL VERIFICATIONS PASSED' : 'VERIFICATION FAILED'}`);
  console.log('NOTICE: The secret key was handled in memory and never displayed or printed.');
  console.log('===============================================');

  process.exit(allPassed ? 0 : 1);
}

runRotationVerification().catch(err => {
  console.error('Rotation verification error:', err);
  process.exit(1);
});
