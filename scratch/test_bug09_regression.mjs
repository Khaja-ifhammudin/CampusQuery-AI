import dotenv from 'dotenv';
dotenv.config();

const adminKey = (process.env.ADMIN_API_KEY || '').trim();
if (!adminKey) {
  console.error('Error: ADMIN_API_KEY not found in environment');
  process.exit(1);
}

const baseURL = 'http://localhost:3000';

async function runRegression() {
  const results = [];

  // 1. Valid Document Upload (Admin Action 1)
  let docId = null;
  try {
    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
        'Authorization': `Bearer ${adminKey}`
      },
      body: JSON.stringify({
        title: 'BUG-09 Verification Memo',
        category: 'General',
        content: 'Section 1: No-Reload Test.\nVerifying that uploading documents persists to database without triggering full page reload in Vite development server.'
      })
    });
    const data = await res.json().catch(() => ({}));
    docId = data.document?.id;
    results.push({
      action: '1. Valid Document Upload (Upload Memo submit)',
      status: res.status,
      expectedStatus: 201,
      passed: res.status === 201 && Boolean(docId),
      docId
    });
  } catch (err) {
    results.push({ action: '1. Valid Document Upload', passed: false, error: err.message });
  }

  // 2. Invalid Document Upload (Missing title & empty content)
  try {
    const res = await fetch(`${baseURL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
        'Authorization': `Bearer ${adminKey}`
      },
      body: JSON.stringify({
        title: '',
        category: 'General',
        content: ''
      })
    });
    results.push({
      action: '2. Invalid Document Upload (Empty submission)',
      status: res.status,
      expectedStatus: 400,
      passed: res.status === 400
    });
  } catch (err) {
    results.push({ action: '2. Invalid Document Upload', passed: false, error: err.message });
  }

  // 3. Valid Mark Resolved (Admin Action 2)
  // First fetch an unresolved query log from analytics
  try {
    const analyticsRes = await fetch(`${baseURL}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminKey}` }
    });
    const analyticsData = await analyticsRes.json();
    const targetItem = analyticsData.unansweredList?.find(item => !item.resolved) || analyticsData.unansweredList?.[0];

    if (targetItem) {
      const resolveRes = await fetch(`${baseURL}/api/admin/unanswered/${targetItem.id}/resolve`, {
        method: 'POST',
        headers: {
          'x-user-role': 'admin',
          'Authorization': `Bearer ${adminKey}`
        }
      });
      const resolveData = await resolveRes.json().catch(() => ({}));
      results.push({
        action: '3. Valid Mark Resolved',
        targetId: targetItem.id,
        status: resolveRes.status,
        expectedStatus: 200,
        passed: resolveRes.status === 200 && resolveData.success === true
      });
    } else {
      results.push({ action: '3. Valid Mark Resolved', passed: false, error: 'No query log found' });
    }
  } catch (err) {
    results.push({ action: '3. Valid Mark Resolved', passed: false, error: err.message });
  }

  // 4. Invalid Mark Resolved (Non-existent ID)
  try {
    const res = await fetch(`${baseURL}/api/admin/unanswered/non_existent_log_id_9999/resolve`, {
      method: 'POST',
      headers: {
        'x-user-role': 'admin',
        'Authorization': `Bearer ${adminKey}`
      }
    });
    results.push({
      action: '4. Invalid Mark Resolved (Non-existent ID)',
      status: res.status,
      expectedStatus: 404,
      passed: res.status === 404
    });
  } catch (err) {
    results.push({ action: '4. Invalid Mark Resolved', passed: false, error: err.message });
  }

  // 5. Cleanup test document
  if (docId) {
    try {
      await fetch(`${baseURL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'admin',
          'Authorization': `Bearer ${adminKey}`
        }
      });
    } catch {}
  }

  console.log(JSON.stringify(results, null, 2));
}

runRegression();
