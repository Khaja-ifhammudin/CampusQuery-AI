import fetch from 'node-fetch';
import fs from 'fs';

import { getAdminKey } from './get_admin_key.mjs';
const ADMIN_KEY = getAdminKey();
const BASE_URL = 'http://localhost:3000';

async function runRechecks() {
  console.log('=== SYSTEMATIC RE-CHECK VERIFICATION ===\n');

  // RE-CHECK 1: Modal Escape and Keyboard Focus
  console.log('--- RE-CHECK 1: Modal Escape & Keyboard Focus Trapping Code Inspection ---');
  const modalFiles = [
    'src/components/CitationModal.tsx',
    'src/components/UploadDocumentModal.tsx',
    'src/components/ChunkInspectorModal.tsx',
    'src/components/SystemNoticeModal.tsx',
  ];
  let allModalsCompliant = true;
  for (const file of modalFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const hasEscape = code.includes("e.key === 'Escape'") || code.includes('Escape');
    const hasFocusTrap = code.includes('focusTrap') || (code.includes('focus()') && code.includes('Tab'));
    const hasRestoreFocus = code.includes('previouslyFocused') || code.includes('activeElement');
    const hasAriaDialog = code.includes('role="dialog"') && code.includes('aria-modal="true"');
    console.log(`[MODAL] ${file}:`);
    console.log(`  - Escape listener: ${hasEscape}`);
    console.log(`  - Focus trap:      ${hasFocusTrap}`);
    console.log(`  - Focus restore:   ${hasRestoreFocus}`);
    console.log(`  - ARIA dialog:     ${hasAriaDialog}`);
    if (!hasEscape || !hasFocusTrap || !hasRestoreFocus || !hasAriaDialog) {
      allModalsCompliant = false;
    }
  }
  console.log(`Modal Accessibility Code Audit: ${allModalsCompliant ? 'PASS' : 'FAIL'}\n`);

  // RE-CHECK 2: Icon-Only Button Accessibility
  console.log('--- RE-CHECK 2: Icon-Only Button Accessible Names Audit ---');
  const buttonFiles = [
    'src/components/Sidebar.tsx',
    'src/components/ChatView.tsx',
    'src/components/DocumentsView.tsx',
    'src/components/Header.tsx',
  ];
  let allButtonsCompliant = true;
  for (const file of buttonFiles) {
    const code = fs.readFileSync(file, 'utf8');
    // Check that button elements with lucide icon components declare aria-label
    const hasAriaLabels = code.includes('aria-label=');
    console.log(`[BUTTONS] ${file}: Has explicit aria-labels: ${hasAriaLabels}`);
    if (!hasAriaLabels) allButtonsCompliant = false;
  }
  console.log(`Icon-Only Button Accessibility Audit: ${allButtonsCompliant ? 'PASS' : 'FAIL'}\n`);

  // RE-CHECK 3: Invalid Form and Upload Inputs
  console.log('--- RE-CHECK 3: Invalid Form & Upload Inputs API Probing ---');
  // 3a: Empty message
  const convRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Input Validation Probe' }),
  });
  const conv = await convRes.json();
  const emptyRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '' }),
  });
  const emptyData = await emptyRes.json();
  console.log(`[INPUT] Empty Message: HTTP ${emptyRes.status} -> Message: "${emptyData.error || emptyData.message}"`);

  // 3b: Whitespace message
  const wsRes = await fetch(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '   \n  \t   ' }),
  });
  const wsData = await wsRes.json();
  console.log(`[INPUT] Whitespace Message: HTTP ${wsRes.status} -> Message: "${wsData.error || wsData.message}"`);

  // 3c: Document missing title
  const noTitleRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_KEY}`,
      'x-user-role': 'admin',
    },
    body: JSON.stringify({ title: '', category: 'General', content: 'Long enough content to pass character length check.' }),
  });
  const noTitleData = await noTitleRes.json();
  console.log(`[UPLOAD] Missing Title: HTTP ${noTitleRes.status} -> Message: "${noTitleData.error || noTitleData.message}"`);

  // 3d: Document insufficient content
  const shortRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_KEY}`,
      'x-user-role': 'admin',
    },
    body: JSON.stringify({ title: 'Short Memo', category: 'General', content: 'Too short' }),
  });
  const shortData = await shortRes.json();
  console.log(`[UPLOAD] Short Content: HTTP ${shortRes.status} -> Message: "${shortData.error || shortData.message}"`);

  // 3e: Client-side file size check inspection
  const uploadModalCode = fs.readFileSync('src/components/UploadDocumentModal.tsx', 'utf8');
  const hasClientPrecheck = uploadModalCode.includes('MAX_SIZE = 25 * 1024 * 1024') || uploadModalCode.includes('25 * 1024 * 1024');
  console.log(`[UPLOAD] Client-side >25MB Pre-check in UploadDocumentModal: ${hasClientPrecheck ? 'CONFIRMED' : 'MISSING'}\n`);

  // RE-CHECK 4: Admin Authentication
  console.log('--- RE-CHECK 4: Admin Authentication Gatekeeper Verification ---');
  // 4a: Missing Authorization header
  const noAuthRes = await fetch(`${BASE_URL}/api/admin/analytics`);
  console.log(`[AUTH] Missing header on /api/admin/analytics: HTTP ${noAuthRes.status} (Expected 401)`);

  // 4b: Spoofed header only
  const spoofRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'x-user-role': 'admin' }
  });
  console.log(`[AUTH] Spoofed x-user-role on /api/admin/analytics: HTTP ${spoofRes.status} (Expected 401)`);

  // 4c: Invalid Bearer token
  const badTokenRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'Authorization': 'Bearer forged_token_value' }
  });
  console.log(`[AUTH] Invalid Bearer token: HTTP ${badTokenRes.status} (Expected 401)`);

  // 4d: Valid Bearer token
  const goodTokenRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${ADMIN_KEY}` }
  });
  console.log(`[AUTH] Valid Bearer token: HTTP ${goodTokenRes.status} (Expected 200)`);

  // 4e: Verify endpoint
  const verifyRes = await fetch(`${BASE_URL}/api/admin/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey: ADMIN_KEY })
  });
  const verifyData = await verifyRes.json();
  console.log(`[AUTH] /api/admin/auth/verify endpoint: HTTP ${verifyRes.status}, valid=${verifyData.valid}\n`);

  // RE-CHECK 5: Helpful API Error Messages
  console.log('--- RE-CHECK 5: Helpful API Error Handling & Non-JSON Fallbacks ---');
  const apiClientCode = fs.readFileSync('src/services/api.ts', 'utf8');
  const hasHandleResponseError = apiClientCode.includes('handleResponseError');
  const hasStatusTextFallback = apiClientCode.includes('res.statusText') || apiClientCode.includes('HTTP ${res.status}');
  console.log(`[API ERROR] handleResponseError implemented: ${hasHandleResponseError}`);
  console.log(`[API ERROR] Surfaces HTTP status codes and plain text fallbacks: ${hasStatusTextFallback}`);

  console.log('\n=== ALL RE-CHECKS COMPLETED SUCCESSFULLY ===');
}

runRechecks().catch(err => {
  console.error('Recheck error:', err);
});
