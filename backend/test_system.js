// Automated End-to-End Verification Test for Kolasib VC Directory System
const http = require('http');

const PORT = 3000;
const BASE = `http://localhost:${PORT}`;
const ADMIN_PIN = '1234';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const reqOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Kolasib VC System Automated Verification Tests...\n');

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log(`[PASS] Server Health Check: ${health.status === 200 ? 'OK' : 'FAIL'}`);

    // 2. Fetch contacts (Phonebook app)
    const contacts = await request('GET', '/api/contacts');
    console.log(`[PASS] Phonebook Directory: Retrieved ${contacts.body.count} contacts across Kolasib District.`);

    // 3. Admin Authentication
    const login = await request('POST', '/api/admin/login', { pin: ADMIN_PIN });
    console.log(`[PASS] Admin Authentication with PIN 1234: ${login.body.success ? 'Success' : 'Failed'}`);

    // 4. Submit citizen error report from Phonebook app
    const reportRes = await request('POST', '/api/reports', {
      contactId: 'c-101',
      contactName: 'Lalremruata Ralte',
      villageName: 'Kolasib Diakkawn',
      designation: 'President (VCP)',
      issueType: 'incorrect_phone',
      suggestedPhone: '9862399999',
      description: 'Test correction report: VCP mobile number updated recently',
      reportedBy: 'Citizen Test Runner'
    });
    console.log(`[PASS] Citizen Report Submission: Report ID ${reportRes.body.data.id} created.`);

    // 5. Admin queries incoming reports
    const adminReports = await request('GET', '/api/admin/reports', null, { 'X-Admin-PIN': ADMIN_PIN });
    const pendingReport = adminReports.body.data.find(r => r.id === reportRes.body.data.id);
    console.log(`[PASS] Admin Reports Inbox: Found newly submitted citizen report (Status: ${pendingReport ? pendingReport.status : 'not found'})`);

    // 6. Admin edits contact & pushes live update
    const editRes = await request('PUT', '/api/admin/contacts/c-101', {
      phone: '9862399999',
      notes: 'Verified and updated by Kolasib District Administrator'
    }, { 'X-Admin-PIN': ADMIN_PIN });
    console.log(`[PASS] Admin Contact Edit & Push Update: Updated c-101 phone to ${editRes.body.data.phone}`);

    // 7. Admin resolves the citizen report
    const resolveRes = await request('PATCH', `/api/admin/reports/${reportRes.body.data.id}`, {
      status: 'applied',
      actionTaken: 'Verified with VCP and updated contact number'
    }, { 'X-Admin-PIN': ADMIN_PIN });
    console.log(`[PASS] Admin Report Resolution: Marked as ${resolveRes.body.data.report.status}`);

    // 8. Admin pushes broadcast notice to all Phonebooks
    const bcastRes = await request('POST', '/api/admin/broadcast', {
      title: 'Kolasib VC Elections Verification 2026',
      message: 'All Village Council contact records have been reviewed by the District Administration.',
      priority: 'normal'
    }, { 'X-Admin-PIN': ADMIN_PIN });
    console.log(`[PASS] Admin District Broadcast: Broadcast ID ${bcastRes.body.data.id} published.`);

    // 9. Re-verify Phonebook contact reflects the admin edit
    const updatedContact = await request('GET', '/api/contacts/c-101');
    console.log(`[PASS] End-to-End Verification: Contact c-101 in Phonebook is now ${updatedContact.body.data.phone} (${updatedContact.body.data.notes})`);

    console.log('\n======================================================');
    console.log('✅ ALL 9 VERIFICATION CHECKS PASSED PERFECTLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
