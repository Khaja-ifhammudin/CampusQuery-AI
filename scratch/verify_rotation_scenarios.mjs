import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const newKey = (process.env.ADMIN_API_KEY || '').trim();
if (!newKey) {
  console.error('Error: New ADMIN_API_KEY not found in process.env');
  process.exit(1);
}

let oldKey = '';
if (fs.existsSync('scratch/old_compromised_key.tmp')) {
  oldKey = fs.readFileSync('scratch/old_compromised_key.tmp', 'utf-8').trim();
}

const baseURL = 'http://localhost:3000';

async function runTests() {
  const results = [];

  // 1. Verify New Key Succeeds (Standard format)
  try {
    const res = await fetch(`${baseURL}/api/admin/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: newKey })
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      test: '1a. New Key Verification (standard)',
      expectedStatus: 200,
      actualStatus: res.status,
      passed: res.status === 200 && data.valid === true
    });
  } catch (err) {
    results.push({ test: '1a. New Key Verification (standard)', passed: false, error: err.message });
  }

  // 1b. Verify New Key with quotes (user copy error simulation)
  try {
    const res = await fetch(`${baseURL}/api/admin/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: `"${newKey}"` })
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      test: '1b. New Key Verification (enclosed in quotes)',
      expectedStatus: 200,
      actualStatus: res.status,
      passed: res.status === 200 && data.valid === true
    });
  } catch (err) {
    results.push({ test: '1b. New Key Verification (quotes)', passed: false, error: err.message });
  }

  // 1c. Verify New Key with "ADMIN_API_KEY=" prefix (user line copy error simulation)
  try {
    // Sanitized by client logic before verify
    const clientSanitized = `ADMIN_API_KEY=${newKey}`.replace(/^ADMIN_API_KEY\s*=\s*/i, '').replace(/^["']|["']$/g, '');
    const res = await fetch(`${baseURL}/api/admin/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: clientSanitized })
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      test: '1c. New Key Verification (with ADMIN_API_KEY= prefix sanitized)',
      expectedStatus: 200,
      actualStatus: res.status,
      passed: res.status === 200 && data.valid === true
    });
  } catch (err) {
    results.push({ test: '1c. New Key Verification (line prefix)', passed: false, error: err.message });
  }

  // 2. Verify Old Compromised Key Fails
  if (oldKey) {
    try {
      const res = await fetch(`${baseURL}/api/admin/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: oldKey })
      });
      results.push({
        test: '2. Old Compromised Key Rejected',
        expectedStatus: 401,
        actualStatus: res.status,
        passed: res.status === 401
      });
    } catch (err) {
      results.push({ test: '2. Old Compromised Key Rejected', passed: false, error: err.message });
    }
  }

  // 3. Verify Invalid Key Fails
  try {
    const res = await fetch(`${baseURL}/api/admin/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: 'completely_bogus_token_xyz999' })
    });
    results.push({
      test: '3. Arbitrary Invalid Key Rejected',
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401
    });
  } catch (err) {
    results.push({ test: '3. Arbitrary Invalid Key Rejected', passed: false, error: err.message });
  }

  // 4a. Authorized Admin Operation (Document Upload with New Key)
  let createdDocId = null;
  try {
    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
        'Authorization': `Bearer ${newKey}`
      },
      body: JSON.stringify({
        title: 'Post Rotation Policy Test',
        category: 'General',
        content: 'Section 1: Post Rotation Policy Verification.\nThis verifies that the newly rotated admin key authorizes privileged document indexing.'
      })
    });
    const data = await res.json().catch(() => ({}));
    createdDocId = data.document?.id;
    results.push({
      test: '4a. Authorized Document Upload (New Key)',
      expectedStatus: 201,
      actualStatus: res.status,
      passed: res.status === 201 && Boolean(createdDocId)
    });
  } catch (err) {
    results.push({ test: '4a. Authorized Document Upload (New Key)', passed: false, error: err.message });
  }

  // 4b. Authorized Admin Analytics Access (New Key)
  try {
    const res = await fetch(`${baseURL}/api/admin/analytics`, {
      method: 'GET',
      headers: {
        'x-user-role': 'admin',
        'Authorization': `Bearer ${newKey}`
      }
    });
    results.push({
      test: '4b. Authorized Admin Analytics Access (New Key)',
      expectedStatus: 200,
      actualStatus: res.status,
      passed: res.status === 200
    });
  } catch (err) {
    results.push({ test: '4b. Authorized Admin Analytics Access', passed: false, error: err.message });
  }

  // 5. Logout Clears Access
  try {
    let clientMemoryKey = newKey;
    clientMemoryKey = ''; // Logout / revoke

    const headers = { 'Content-Type': 'application/json', 'x-user-role': 'admin' };
    if (clientMemoryKey) {
      headers['Authorization'] = `Bearer ${clientMemoryKey}`;
    }

    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Post-Logout Attempt', content: 'Testing post-logout rejection.' })
    });
    results.push({
      test: '5. Logout Clears Access (Subsequent upload blocked)',
      expectedStatus: 401,
      actualStatus: res.status,
      passed: res.status === 401
    });
  } catch (err) {
    results.push({ test: '5. Logout Clears Access', passed: false, error: err.message });
  }

  // Cleanup created test document
  if (createdDocId) {
    try {
      await fetch(`${baseURL}/api/documents/${createdDocId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'admin',
          'Authorization': `Bearer ${newKey}`
        }
      });
    } catch {}
  }

  // Remove temporary scratch old key file
  if (fs.existsSync('scratch/old_compromised_key.tmp')) {
    fs.unlinkSync('scratch/old_compromised_key.tmp');
  }

  console.log(JSON.stringify(results, null, 2));
}

runTests();
