import fetch from 'node-fetch';

import { getAdminKey } from './get_admin_key.mjs';
const ADMIN_KEY = getAdminKey();

async function runVerifications() {
  console.log('=== VERIFYING BUG FIXES & SECURITY PATCHES ===\n');
  let allPassed = true;

  // 1. Verify BUG-02: Server-side Authentication & Authorization
  console.log('--- TEST GROUP 1: BUG-02 Admin Authorization ---');

  // Test 1a: No headers -> 401
  const res1a = await fetch(`${BASE_URL}/api/admin/analytics`);
  const pass1a = res1a.status === 401;
  console.log(`[BUG-02] No auth header: HTTP ${res1a.status} (Expected 401) -> ${pass1a ? 'PASS' : 'FAIL'}`);
  if (!pass1a) allPassed = false;

  // Test 1b: Spoofed x-user-role: admin -> 401
  const res1b = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'x-user-role': 'admin' }
  });
  const pass1b = res1b.status === 401;
  console.log(`[BUG-02] Spoofed x-user-role header: HTTP ${res1b.status} (Expected 401) -> ${pass1b ? 'PASS' : 'FAIL'}`);
  if (!pass1b) allPassed = false;

  // Test 1c: Wrong token -> 401
  const res1c = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'Authorization': 'Bearer attacker_secret' }
  });
  const pass1c = res1c.status === 401;
  console.log(`[BUG-02] Invalid Bearer token: HTTP ${res1c.status} (Expected 401) -> ${pass1c ? 'PASS' : 'FAIL'}`);
  if (!pass1c) allPassed = false;

  // Test 1d: Valid Bearer token -> 200
  const res1d = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${ADMIN_KEY}` }
  });
  const pass1d = res1d.status === 200;
  console.log(`[BUG-02] Valid Bearer token: HTTP ${res1d.status} (Expected 200) -> ${pass1d ? 'PASS' : 'FAIL'}`);
  if (!pass1d) allPassed = false;

  // Test 1e: Verify admin auth endpoint
  const res1e = await fetch(`${BASE_URL}/api/admin/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey: ADMIN_KEY })
  });
  const data1e = await res1e.json();
  const pass1e = res1e.status === 200 && data1e.valid === true;
  console.log(`[BUG-02] POST /api/admin/auth/verify valid token: HTTP ${res1e.status}, valid=${data1e.valid} -> ${pass1e ? 'PASS' : 'FAIL'}`);
  if (!pass1e) allPassed = false;

  // 2. Verify BUG-01: Hallucination Prevention & Strict RAG Boundary
  console.log('\n--- TEST GROUP 2: BUG-01 Fictional Policy & Fallback Grounding ---');

  // Test 2a: Fictional query (dragons in dorms)
  const convRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hallucination Boundary Verification' })
  });
  const conv = await convRes.json();

  const msgRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'According to campus regulations, can students keep dragons as pets in residence halls?'
    })
  });
  const msgData = await msgRes.json();
  const answer = msgData.assistantMessage?.content || '';
  const isFallback = msgData.assistantMessage?.isFallback === true;
  
  // Safe criteria: Must not say dragons are allowed, must not quote blue line shuttle, must refuse or give fallback notice
  const rejectsDragon = !answer.toLowerCase().includes('dragons are allowed') &&
    !answer.toLowerCase().includes('blue line shuttle') &&
    (isFallback || answer.toLowerCase().includes('not available') || answer.toLowerCase().includes('could not find') || answer.toLowerCase().includes('not permitted'));

  console.log(`[BUG-01] Dragon dorm inquiry -> isFallback=${isFallback}, Safe Content=${rejectsDragon} -> ${rejectsDragon ? 'PASS' : 'FAIL'}`);
  console.log(`         Answer snippet: "${answer.slice(0, 140)}..."`);
  if (!rejectsDragon) allPassed = false;

  // 3. Verify BUG-05 & BUG-06 Error handling
  console.log('\n--- TEST GROUP 3: System Status & Auth Transparency ---');
  const statusRes = await fetch(`${BASE_URL}/api/system/status`);
  const statusData = await statusRes.json();
  const pass3 = statusRes.status === 200 && statusData.adminAuthConfigured === true;
  console.log(`[STATUS] adminAuthConfigured=${statusData.adminAuthConfigured} -> ${pass3 ? 'PASS' : 'FAIL'}`);
  if (!pass3) allPassed = false;

  console.log(`\n===============================================`);
  console.log(`OVERALL VERIFICATION RESULT: ${allPassed ? 'ALL PASS' : 'SOME CHECKS FAILED'}`);
  console.log(`===============================================`);

  process.exit(allPassed ? 0 : 1);
}

runVerifications().catch(err => {
  console.error('Verification script error:', err);
  process.exit(1);
});
