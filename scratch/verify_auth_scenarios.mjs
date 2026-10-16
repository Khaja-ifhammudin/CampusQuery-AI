import dotenv from 'dotenv';
dotenv.config();

const validToken = (process.env.ADMIN_API_KEY || '').trim();
if (!validToken) {
  console.error('Error: Could not find ADMIN_API_KEY in process.env');
  process.exit(1);
}
const baseURL = 'http://localhost:3000';

async function runTests() {
  const results = [];

  // Scenario 1: Unauthorized Request (No token provided)
  try {
    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ title: 'Unauthorized Test', content: 'Testing no token rejection.' })
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      scenario: '1. Unauthorized Request (No Token)',
      status: res.status,
      expected: 401,
      passed: res.status === 401,
      responseMessage: data.message || data.error
    });
  } catch (err) {
    results.push({ scenario: '1. Unauthorized Request (No Token)', error: err.message, passed: false });
  }

  // Scenario 2: Invalid Token Request
  try {
    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
        'Authorization': 'Bearer invalid_wrong_token_xyz999'
      },
      body: JSON.stringify({ title: 'Invalid Token Test', content: 'Testing invalid token rejection.' })
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      scenario: '2. Invalid Token Request',
      status: res.status,
      expected: 401,
      passed: res.status === 401,
      responseMessage: data.message || data.error
    });
  } catch (err) {
    results.push({ scenario: '2. Invalid Token Request', error: err.message, passed: false });
  }

  // Scenario 3: Valid Token Verification (/api/admin/auth/verify)
  try {
    const res = await fetch(`${baseURL}/api/admin/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: validToken })
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      scenario: '3. Valid Token Verification (/api/admin/auth/verify)',
      status: res.status,
      expected: 200,
      passed: res.status === 200 && data.valid === true,
      valid: data.valid
    });
  } catch (err) {
    results.push({ scenario: '3. Valid Token Verification', error: err.message, passed: false });
  }

  // Scenario 4: Authorized Document Upload with Valid Token
  let uploadedDocId = null;
  try {
    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        title: 'Auth Verification Test Policy',
        category: 'General',
        content: 'Section 1: Authentication Policy Verification.\nThis document verifies that genuine administrative bearer tokens allow authorized document indexing into the campus knowledge base.'
      })
    });
    const data = await res.json().catch(() => ({}));
    uploadedDocId = data.document?.id;
    results.push({
      scenario: '4. Authorized Document Upload',
      status: res.status,
      expected: 201,
      passed: res.status === 201 && Boolean(data.document?.id),
      docId: data.document?.id,
      chunkCount: data.document?.chunkCount
    });
  } catch (err) {
    results.push({ scenario: '4. Authorized Document Upload', error: err.message, passed: false });
  }

  // Scenario 5: Logout Simulation (Credential cleared from in-memory client)
  // Simulating in-memory state: client clears token and makes subsequent privileged request
  try {
    let clientMemoryToken = validToken;
    // Client logs out / revokes
    clientMemoryToken = ''; // cleared!

    const headers = { 'Content-Type': 'application/json', 'x-user-role': 'admin' };
    if (clientMemoryToken) {
      headers['Authorization'] = `Bearer ${clientMemoryToken}`;
    }

    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Post-Logout Test', content: 'Testing upload after logout.' })
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      scenario: '5. Post-Logout Request (In-memory token cleared)',
      status: res.status,
      expected: 401,
      passed: res.status === 401,
      responseMessage: data.message || data.error
    });
  } catch (err) {
    results.push({ scenario: '5. Post-Logout Request', error: err.message, passed: false });
  }

  // Scenario 6: Refresh Simulation (Fresh page load without persistent storage)
  // Since sessionStorage/localStorage is NOT used, a new tab/session starts with empty in-memory state
  try {
    const freshClientToken = ''; // Fresh page load starts with empty string
    const headers = { 'Content-Type': 'application/json', 'x-user-role': 'admin' };
    if (freshClientToken) {
      headers['Authorization'] = `Bearer ${freshClientToken}`;
    }

    const res = await fetch(`${baseURL}/api/admin/analytics`, {
      method: 'GET',
      headers
    });
    const data = await res.json().catch(() => ({}));
    results.push({
      scenario: '6. Post-Refresh Request (Fresh in-memory state)',
      status: res.status,
      expected: 401,
      passed: res.status === 401,
      responseMessage: data.message || data.error
    });
  } catch (err) {
    results.push({ scenario: '6. Post-Refresh Request', error: err.message, passed: false });
  }

  // Clean up test document if created
  if (uploadedDocId) {
    try {
      await fetch(`${baseURL}/api/documents/${uploadedDocId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'admin',
          'Authorization': `Bearer ${validToken}`
        }
      });
    } catch {}
  }

  console.log(JSON.stringify(results, null, 2));
}

runTests();
