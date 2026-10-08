const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const {
  resolveGoogleSheetCsvUrl,
  fetchUrlWithRedirects,
  getTemplateCSV
} = require('./csvUtils');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || 'sab&u7tAs'; // Administrator Security PIN

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb', type: ['text/csv', 'text/plain'] }));

// List of connected SSE clients (Phonebook apps listening for live push updates)
let sseClients = [];

function broadcastToClients(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (e) {
      console.error('Error writing to client:', e);
    }
  });
}

// -------------------------------------------------------------
// SSE Endpoint for Real-Time Push to Phonebook Apps
// -------------------------------------------------------------
app.get('/api/sync/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// -------------------------------------------------------------
// Public Endpoints (Consumed by VC Phonebook App)
// -------------------------------------------------------------

// Get all districts in Mizoram
app.get('/api/districts', (req, res) => {
  try {
    const districts = db.getDistricts();
    res.json({ success: true, count: districts.length, data: districts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get application & developer information
app.get('/api/app-info', (req, res) => {
  try {
    const info = db.getAppInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all villages / localities (optionally filtered by district)
app.get('/api/villages', (req, res) => {
  try {
    const { district } = req.query;
    const villages = db.getVillages({ district });
    res.json({ success: true, count: villages.length, district: district || 'All', data: villages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get contacts with search, filter, district, and delta-sync support
app.get('/api/contacts', (req, res) => {
  try {
    const { search, villageId, category, designation, since, district } = req.query;
    const contacts = db.getContacts({ search, villageId, category, designation, since, district });
    res.json({
      success: true,
      count: contacts.length,
      district: district || 'All',
      lastUpdated: db.data.meta.lastUpdated,
      data: contacts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get specific contact
app.get('/api/contacts/:id', (req, res) => {
  try {
    const contact = db.getContactById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get emergency services (optionally filtered by district)
app.get('/api/emergency', (req, res) => {
  try {
    const { district } = req.query;
    const list = db.getEmergency({ district });
    res.json({ success: true, count: list.length, district: district || 'All', data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Government & District Offices and Staff (optionally filtered by district)
app.get('/api/offices', (req, res) => {
  try {
    const { search, category, district } = req.query;
    const offices = db.getOffices({ search, category, district });
    res.json({ success: true, count: offices.length, district: district || 'All', data: offices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/offices/:id', (req, res) => {
  try {
    const office = db.getOfficeById(req.params.id);
    if (!office) {
      return res.status(404).json({ success: false, error: 'Office not found' });
    }
    res.json({ success: true, data: office });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current broadcasts (state-wide or district-specific)
app.get('/api/broadcasts', (req, res) => {
  try {
    const { district } = req.query;
    const list = db.getBroadcasts({ district });
    res.json({ success: true, district: district || 'All', data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit a correction report for incorrect contact information
app.post('/api/reports', (req, res) => {
  try {
    const { contactId, contactName, villageName, designation, issueType, description, suggestedPhone, suggestedName, reportedBy, reporterPhone, isEmergency, serviceName, isOffice, officeName, staffId, district } = req.body;

    if (!description && !suggestedPhone) {
      return res.status(400).json({ success: false, error: 'Please provide issue details or suggested phone number' });
    }

    const report = db.addReport({
      contactId: contactId || staffId,
      contactName,
      villageName,
      designation,
      district: district || 'Kolasib',
      isEmergency,
      serviceName,
      isOffice,
      officeName,
      issueType,
      description,
      suggestedPhone,
      suggestedName,
      reportedBy,
      reporterPhone
    });

    // Notify admin clients
    broadcastToClients('new_report', { report });

    res.status(201).json({
      success: true,
      message: 'Correction report submitted successfully. Admin will review and update.',
      data: report
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Admin Middleware & Authentication
// -------------------------------------------------------------
function verifyAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.query.pin || req.body.pin;
  if (!pin || pin !== ADMIN_PIN) {
    return res.status(401).json({ success: false, error: 'Invalid or missing Admin PIN' });
  }
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    return res.json({
      success: true,
      token: 'admin-kolasib-session-valid',
      message: 'Admin authenticated successfully'
    });
  }
  return res.status(401).json({ success: false, error: 'Incorrect Administrator PIN' });
});

// -------------------------------------------------------------
// Admin Endpoints (Push updates, Edit incorrect contacts)
// -------------------------------------------------------------

// Admin Dashboard stats (all districts or filtered by district)
app.get('/api/admin/stats', verifyAdmin, (req, res) => {
  try {
    const { district } = req.query;
    const stats = db.getStats(district);
    stats.connectedPhonebookApps = sseClients.length;
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Add Contact -> PUSH UPDATE TO ALL PHONEBOOKS
app.post('/api/admin/contacts', verifyAdmin, (req, res) => {
  try {
    const { name, phone, designation, villageId, villageName, category, altPhone, term, notes, district } = req.body;

    if (!name || !phone || !villageName) {
      return res.status(400).json({ success: false, error: 'Name, phone, and village name are required' });
    }

    const newContact = db.addContact({
      name,
      phone,
      designation: designation || 'Member (VCM)',
      villageId: villageId || `v-${Date.now()}`,
      villageName,
      district: district || 'Kolasib',
      category: category || 'Town Area',
      altPhone: altPhone || '',
      term: term || '2025-2030',
      notes: notes || ''
    });

    // PUSH EVENT IMMEDIATELY TO ALL PHONEBOOK APPS
    broadcastToClients('contact_added', {
      action: 'added',
      contact: newContact,
      message: `New contact added: ${newContact.name} (${newContact.villageName} [${newContact.district}])`
    });

    res.status(201).json({
      success: true,
      message: 'Contact added and pushed to phonebooks in real-time!',
      data: newContact
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Edit / Correct Contact -> PUSH UPDATE TO ALL PHONEBOOKS
app.put('/api/admin/contacts/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const updated = db.updateContact(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    // PUSH REAL-TIME UPDATE TO ALL ACTIVE PHONEBOOK APPS
    broadcastToClients('contact_updated', {
      action: 'updated',
      contact: updated,
      message: `Updated: ${updated.name} (${updated.villageName})`
    });

    res.json({
      success: true,
      message: 'Contact updated and pushed to phonebook apps!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Contact -> PUSH UPDATE TO ALL PHONEBOOKS
app.delete('/api/admin/contacts/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteContact(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    // PUSH DELETE EVENT TO ALL ACTIVE PHONEBOOK APPS
    broadcastToClients('contact_deleted', {
      action: 'deleted',
      id,
      message: `Contact removed by administrator`
    });

    res.json({
      success: true,
      message: 'Contact deleted and removed from phonebooks in real-time.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Add Village / Local Council -> PUSH UPDATE TO ALL PHONEBOOKS
app.post('/api/admin/villages', verifyAdmin, (req, res) => {
  try {
    const { name, category, district, type, address } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Council name is required' });
    }

    const newVillage = db.addVillage({ name, category, district, type, address });

    broadcastToClients('village_added', {
      action: 'added',
      village: newVillage,
      message: `New Council added: ${newVillage.name} [${newVillage.district}]`
    });

    res.status(201).json({
      success: true,
      message: 'Village/Local Council added and synced in real-time!',
      data: newVillage
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Remove Village / Local Council -> PUSH UPDATE TO ALL PHONEBOOKS
app.delete('/api/admin/villages/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteVillage(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Council not found' });
    }

    broadcastToClients('village_deleted', {
      action: 'deleted',
      id: deleted.id || id,
      name: deleted.name,
      district: deleted.district,
      village: deleted,
      removedContactsCount: deleted.removedContactsCount || 0,
      message: `Council removed: ${deleted.name}`
    });

    broadcastToClients('full_sync_required', {
      reason: 'village_deleted',
      villageId: deleted.id || id,
      villageName: deleted.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Council deleted and removed in real-time.',
      data: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Update Developer / App Information -> PUSH UPDATE TO ALL PHONEBOOKS
app.put('/api/admin/app-info', verifyAdmin, (req, res) => {
  try {
    const { developerName, developerEmail, supportPhone } = req.body;
    if (!developerName || !developerEmail) {
      return res.status(400).json({ success: false, error: 'Developer name and email are required' });
    }

    const updated = db.updateAppInfo({ developerName, developerEmail, supportPhone });

    broadcastToClients('app_info_updated', {
      appInfo: updated,
      message: `Developer info updated: ${updated.developerName}`
    });

    res.json({
      success: true,
      message: 'Developer info updated and pushed to all Phonebooks!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Add Emergency Contact -> PUSH UPDATE TO ALL PHONEBOOKS
app.post('/api/admin/emergency', verifyAdmin, (req, res) => {
  try {
    const { service, officer, phone, altPhone, category, address, priority, district } = req.body;

    if (!service || !phone) {
      return res.status(400).json({ success: false, error: 'Service name and phone number are required' });
    }

    const newEmergency = db.addEmergency({
      service,
      officer: officer || 'In-Charge',
      phone,
      altPhone: altPhone || '',
      category: category || 'General Emergency',
      district: district || 'Kolasib',
      address: address || 'Kolasib',
      priority: priority || 2
    });

    // PUSH REAL-TIME UPDATE TO ALL ACTIVE PHONEBOOK APPS
    broadcastToClients('emergency_added', {
      action: 'added',
      emergency: newEmergency,
      message: `Emergency contact added: ${newEmergency.service} [${newEmergency.district}]`
    });

    res.status(201).json({
      success: true,
      message: 'Emergency contact added and pushed to all phonebooks in real-time!',
      data: newEmergency
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Edit Emergency Contact -> PUSH UPDATE TO ALL PHONEBOOKS
app.put('/api/admin/emergency/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    const updated = db.updateEmergency(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Emergency contact not found' });
    }

    // PUSH REAL-TIME UPDATE TO ALL ACTIVE PHONEBOOK APPS
    broadcastToClients('emergency_updated', {
      action: 'updated',
      emergency: updated,
      message: `Emergency updated: ${updated.service}`
    });

    res.json({
      success: true,
      message: 'Emergency contact updated and pushed to all phonebooks in real-time!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Emergency Contact -> PUSH UPDATE TO ALL PHONEBOOKS
app.delete('/api/admin/emergency/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteEmergency(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Emergency contact not found' });
    }

    // PUSH DELETE EVENT TO ALL ACTIVE PHONEBOOK APPS
    broadcastToClients('emergency_deleted', {
      action: 'deleted',
      id,
      message: `Emergency contact removed by administrator`
    });

    res.json({
      success: true,
      message: 'Emergency contact deleted and removed from phonebooks in real-time.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Add Office -> PUSH UPDATE TO ALL PHONEBOOKS
app.post('/api/admin/offices', verifyAdmin, (req, res) => {
  try {
    const { name, department, category, address, phone, email, staff, district } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Office name is required' });
    }

    const newOffice = db.addOffice({
      name,
      department: department || 'General Administration',
      category: category || 'Administration',
      district: district || 'Kolasib',
      address: address || 'Kolasib',
      phone: phone || '',
      email: email || '',
      staff: Array.isArray(staff) ? staff : []
    });

    broadcastToClients('office_added', {
      action: 'added',
      office: newOffice,
      message: `New Office added: ${newOffice.name} [${newOffice.district}]`
    });

    res.status(201).json({
      success: true,
      message: 'Office created and pushed to all phonebooks in real-time!',
      data: newOffice
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Edit Office -> PUSH UPDATE TO ALL PHONEBOOKS
app.put('/api/admin/offices/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const updated = db.updateOffice(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Office not found' });
    }

    broadcastToClients('office_updated', {
      action: 'updated',
      office: updated,
      message: `Office updated: ${updated.name}`
    });

    res.json({
      success: true,
      message: 'Office updated and pushed to all phonebooks in real-time!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Office -> PUSH UPDATE TO ALL PHONEBOOKS
app.delete('/api/admin/offices/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteOffice(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Office not found' });
    }

    broadcastToClients('office_deleted', {
      action: 'deleted',
      id,
      message: 'Office removed by administrator'
    });

    res.json({
      success: true,
      message: 'Office deleted and removed from phonebooks in real-time.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Add Staff Member to Office -> PUSH UPDATE TO ALL PHONEBOOKS
app.post('/api/admin/offices/:id/staff', verifyAdmin, (req, res) => {
  try {
    const officeId = req.params.id;
    const { name, designation, phone, altPhone, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Staff name and phone number are required' });
    }

    const result = db.addOfficeStaff(officeId, { name, designation, phone, altPhone, email });
    if (!result) {
      return res.status(404).json({ success: false, error: 'Office not found' });
    }

    broadcastToClients('office_updated', {
      action: 'updated',
      office: result.office,
      message: `Staff added: ${result.newStaff.name} (${result.office.name})`
    });

    res.status(201).json({
      success: true,
      message: 'Office staff added and pushed in real-time!',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Update Staff Member in Office -> PUSH UPDATE TO ALL PHONEBOOKS
app.put('/api/admin/offices/:id/staff/:staffId', verifyAdmin, (req, res) => {
  try {
    const { id: officeId, staffId } = req.params;
    const result = db.updateOfficeStaff(officeId, staffId, req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Office or staff member not found' });
    }

    broadcastToClients('office_updated', {
      action: 'updated',
      office: result.office,
      message: `Staff updated: ${result.updatedStaff.name}`
    });

    res.json({
      success: true,
      message: 'Staff updated and pushed in real-time!',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Staff Member from Office -> PUSH UPDATE TO ALL PHONEBOOKS
app.delete('/api/admin/offices/:id/staff/:staffId', verifyAdmin, (req, res) => {
  try {
    const { id: officeId, staffId } = req.params;
    const result = db.deleteOfficeStaff(officeId, staffId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Office or staff member not found' });
    }

    broadcastToClients('office_updated', {
      action: 'updated',
      office: result.office,
      message: `Staff removed: ${result.deletedStaff.name}`
    });

    res.json({
      success: true,
      message: 'Staff removed and pushed in real-time!',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin review user-reported incorrect contact reports
app.get('/api/admin/reports', verifyAdmin, (req, res) => {
  try {
    const { status, district } = req.query;
    const reports = db.getReports(status, district);
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin resolve report (Apply suggested correction or Reject)
app.patch('/api/admin/reports/:id', verifyAdmin, (req, res) => {
  try {
    const { status, actionTaken, applyChanges, contactUpdates, isEmergency, isOffice } = req.body;
    const reportId = req.params.id;

    let updatedContact = null;

    // If admin approves and wants to automatically apply changes
    if (applyChanges && contactUpdates && contactUpdates.id) {
      if (isEmergency || (contactUpdates.id && contactUpdates.id.startsWith('em-'))) {
        updatedContact = db.updateEmergency(contactUpdates.id, contactUpdates);
        broadcastToClients('emergency_updated', {
          action: 'updated',
          emergency: updatedContact,
          message: `Correction applied for Emergency: ${updatedContact.service}`
        });
      } else if (isOffice || (contactUpdates.id && contactUpdates.id.startsWith('stf-'))) {
        const offices = db.getOffices();
        for (const off of offices) {
          const s = (off.staff || []).find(st => st.id === contactUpdates.id);
          if (s) {
            const updRes = db.updateOfficeStaff(off.id, s.id, { phone: contactUpdates.phone });
            if (updRes) {
              updatedContact = updRes.updatedStaff;
              broadcastToClients('office_updated', {
                action: 'updated',
                office: updRes.office,
                message: `Correction applied for ${updRes.updatedStaff.name}`
              });
            }
            break;
          }
        }
      } else {
        updatedContact = db.updateContact(contactUpdates.id, contactUpdates);
        broadcastToClients('contact_updated', {
          action: 'updated',
          contact: updatedContact,
          message: `Correction applied for ${updatedContact.name} (${updatedContact.villageName})`
        });
      }
    }

    const resolved = db.resolveReport(reportId, status, actionTaken);
    if (!resolved) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({
      success: true,
      message: `Report marked as ${status}. ${updatedContact ? 'Contact updated and pushed to phonebooks!' : ''}`,
      data: { report: resolved, updatedContact }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Broadcast Push Announcement to all phonebook users (statewide or district-targeted)
app.post('/api/admin/broadcast', verifyAdmin, (req, res) => {
  try {
    const { title, message, priority, district } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const bcast = db.addBroadcast({ title, message, priority, district: district || 'All' });

    // PUSH BROADCAST TO ALL PHONEBOOKS
    broadcastToClients('broadcast_received', {
      broadcast: bcast
    });

    res.status(201).json({
      success: true,
      message: 'Broadcast notification pushed to phonebooks!',
      data: bcast
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Delete Broadcast / Announcement -> PUSH UPDATE TO ALL PHONEBOOKS
app.delete('/api/admin/broadcasts/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteBroadcast(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Broadcast notification not found' });
    }

    broadcastToClients('broadcast_deleted', {
      action: 'deleted',
      id,
      broadcast: deleted,
      message: `Notification removed: ${deleted.title}`
    });

    res.json({
      success: true,
      message: 'Broadcast notification deleted in real-time.',
      data: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/broadcast/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteBroadcast(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Broadcast notification not found' });
    }

    broadcastToClients('broadcast_deleted', {
      action: 'deleted',
      id,
      broadcast: deleted,
      message: `Notification removed: ${deleted.title}`
    });

    res.json({
      success: true,
      message: 'Broadcast notification deleted in real-time.',
      data: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Audit Logs & Push History
app.get('/api/admin/audit-logs', verifyAdmin, (req, res) => {
  try {
    const logs = db.getAuditLogs();
    const pushes = db.getRecentPushes();
    res.json({ success: true, logs, recentPushes: pushes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Backup & Export
app.get('/api/admin/export', verifyAdmin, (req, res) => {
  try {
    const exportData = db.exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="kolasib_vc_directory_backup.json"');
    res.send(exportData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import / Restore backup
app.post('/api/admin/import', verifyAdmin, (req, res) => {
  try {
    const result = db.importData(JSON.stringify(req.body));
    if (result.success) {
      broadcastToClients('full_sync_required', { timestamp: new Date().toISOString() });
      return res.json({ success: true, message: `Successfully restored ${result.count} contacts!` });
    }
    res.status(400).json({ success: false, error: result.error });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Google Sheets CSV Export, Template & Import Endpoints
// -------------------------------------------------------------

// Export to Google Sheet CSV (contacts, emergency, or offices)
app.get('/api/admin/export/csv', verifyAdmin, (req, res) => {
  try {
    const type = req.query.type || 'contacts'; // contacts | emergency | offices
    const district = req.query.district || 'All';
    let csvData = '';
    let filename = '';

    if (type === 'emergency') {
      csvData = db.exportEmergencyCSV(district);
      filename = `Emergency_Contacts_${district.replace(/\s+/g, '_')}_Mizoram.csv`;
    } else if (type === 'offices') {
      csvData = db.exportOfficesCSV(district);
      filename = `Offices_and_Staff_${district.replace(/\s+/g, '_')}_Mizoram.csv`;
    } else {
      csvData = db.exportContactsCSV(district);
      filename = `VC_and_LC_Contacts_${district.replace(/\s+/g, '_')}_Mizoram.csv`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Download sample Google Sheet CSV template
app.get('/api/admin/template/csv', (req, res) => {
  try {
    const type = req.query.type || 'contacts'; // contacts | emergency | offices
    const templateCSV = getTemplateCSV(type);
    const filename = `Sample_Template_${type.toUpperCase()}_Google_Sheets.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(templateCSV);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import from Google Sheets (direct URL or CSV payload)
app.post('/api/admin/import/csv', verifyAdmin, async (req, res) => {
  try {
    const { type = 'contacts', googleSheetUrl, mode = 'merge', district = 'All' } = req.body;
    let csvText = req.body.csvText;

    // If Google Sheets sharing URL was provided, fetch the live CSV export directly from Google
    if (googleSheetUrl && googleSheetUrl.trim()) {
      const resolvedUrl = resolveGoogleSheetCsvUrl(googleSheetUrl.trim());
      if (!resolvedUrl) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Google Sheet URL. Please ensure it is a valid Google Sheets link (e.g. https://docs.google.com/spreadsheets/d/...)'
        });
      }

      try {
        csvText = await fetchUrlWithRedirects(resolvedUrl);
      } catch (fetchErr) {
        return res.status(400).json({
          success: false,
          error: `Failed to fetch Google Sheet: ${fetchErr.message}`
        });
      }
    }

    if (!csvText || typeof csvText !== 'string' || csvText.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'No CSV content provided. Either provide a valid Google Sheet URL or paste/upload CSV content.'
      });
    }

    let result;
    let eventName = 'full_sync_required';
    let broadcastMsg = '';

    if (type === 'emergency') {
      result = db.importEmergencyCSV(csvText, { mode, district });
      eventName = 'emergency_imported';
      broadcastMsg = `Emergency contacts updated via Google Sheets import (${result.stats ? result.stats.added + ' added, ' + result.stats.updated + ' updated' : ''})`;
    } else if (type === 'offices') {
      result = db.importOfficesCSV(csvText, { mode, district });
      eventName = 'offices_imported';
      broadcastMsg = `Offices & staff directory updated via Google Sheets import`;
    } else {
      result = db.importContactsCSV(csvText, { mode, district });
      eventName = 'contacts_imported';
      broadcastMsg = `VC & LC Directory updated via Google Sheets import (${result.stats ? result.stats.added + ' added, ' + result.stats.updated + ' updated' : ''})`;
    }

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    // Trigger instant real-time push to all connected Phonebook apps across Mizoram!
    broadcastToClients(eventName, {
      type,
      mode,
      district,
      message: broadcastMsg,
      timestamp: new Date().toISOString()
    });
    broadcastToClients('full_sync_required', { timestamp: new Date().toISOString() });

    res.json({
      success: true,
      message: `Successfully imported ${type} from Google Sheets!`,
      stats: result.stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Kolasib VC Sync Server',
    activePushClients: sseClients.length,
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// Static File Serving
// -------------------------------------------------------------
const phonebookPath = path.join(__dirname, '..', 'kolasib-vc-phonebook', 'www');
const adminPath = path.join(__dirname, '..', 'kolasib-vc-admin', 'www');
const simulatorPath = path.join(__dirname, '..', 'simulator');
const releaseApksPath = path.join(__dirname, '..', 'release_apks');

app.get('/downloads/kolasib-vc-phonebook.apk', (req, res) => {
  res.redirect(301, '/downloads/Mizoram_VC_Phonebook.apk');
});
app.get('/downloads/kolasib-vc-admin.apk', (req, res) => {
  res.redirect(301, '/downloads/Mizoram_VC_Admin.apk');
});
app.use('/downloads', express.static(releaseApksPath));
app.use('/phonebook', express.static(phonebookPath));
app.use('/admin', express.static(adminPath));
app.use('/', express.static(simulatorPath));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏛️ KOLASIB VC DIRECTORY SYSTEM RUNNING`);
  console.log(`=======================================================`);
  console.log(`📱 Dual Device Simulator:  http://localhost:${PORT}/`);
  console.log(`📞 VC Phonebook App:       http://localhost:${PORT}/phonebook/`);
  console.log(`🛡️ VC Admin App:           http://localhost:${PORT}/admin/`);
  console.log(`⚡ Sync & REST API:        http://localhost:${PORT}/api/contacts`);
  console.log(`🔑 Admin Default PIN:      ${ADMIN_PIN}`);
  console.log(`=======================================================`);
});
