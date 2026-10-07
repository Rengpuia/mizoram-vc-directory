const fs = require('fs');
const path = require('path');
const {
  initialVillages,
  initialContacts,
  initialEmergency,
  initialOffices,
  initialDistricts,
  additionalMultiDistrictData
} = require('./seedData');
const {
  stringifyCSV,
  parseCSV,
  TEMPLATES
} = require('./csvUtils');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'kolasib_vc_store.json');

class Database {
  constructor() {
    this.data = {
      districts: [],
      villages: [],
      contacts: [],
      emergency: [],
      offices: [],
      reports: [],
      auditLogs: [],
      pushHistory: [],
      broadcasts: [],
      meta: {
        lastUpdated: new Date().toISOString(),
        version: 2
      }
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let needsSave = false;
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure all arrays exist
        if (!this.data.reports) this.data.reports = [];
        if (!this.data.auditLogs) this.data.auditLogs = [];
        if (!this.data.pushHistory) this.data.pushHistory = [];
        if (!this.data.broadcasts) this.data.broadcasts = [];
        if (!this.data.districts || this.data.districts.length === 0) {
          this.data.districts = [...initialDistricts];
          needsSave = true;
        }
        if (!this.data.offices || this.data.offices.length === 0) {
          this.data.offices = [...initialOffices];
          needsSave = true;
        }

        // Ensure district field is assigned to all existing data (default: Kolasib)
        this.data.villages.forEach(v => {
          if (!v.district) { v.district = 'Kolasib'; needsSave = true; }
        });
        this.data.contacts.forEach(c => {
          if (!c.district) { c.district = 'Kolasib'; needsSave = true; }
        });
        this.data.emergency.forEach(e => {
          if (!e.district) { e.district = 'Kolasib'; needsSave = true; }
        });
        this.data.offices.forEach(o => {
          if (!o.district) { o.district = 'Kolasib'; needsSave = true; }
        });
        this.data.broadcasts.forEach(b => {
          if (!b.district) { b.district = 'All'; needsSave = true; }
        });

        // Merge additional multi-district data (Aizawl, Lunglei, Champhai, etc.) if not yet populated
        const hasAizawl = this.data.contacts.some(c => c.district === 'Aizawl');
        if (!hasAizawl && additionalMultiDistrictData) {
          if (additionalMultiDistrictData.villages) {
            this.data.villages.push(...additionalMultiDistrictData.villages);
          }
          if (additionalMultiDistrictData.contacts) {
            this.data.contacts.push(...additionalMultiDistrictData.contacts);
          }
          if (additionalMultiDistrictData.offices) {
            this.data.offices.push(...additionalMultiDistrictData.offices);
          }
          if (additionalMultiDistrictData.emergency) {
            this.data.emergency.push(...additionalMultiDistrictData.emergency);
          }
          needsSave = true;
        }

        if (!this.data.appInfo) {
          this.data.appInfo = {
            developerName: 'Mizoram IT & e-Governance Team',
            developerEmail: 'support.vc@mizoram.gov.in',
            supportPhone: '9436123456',
            appName: 'Mizoram VC Phonebook'
          };
          needsSave = true;
        }

        if (needsSave) {
          this.save();
        }
      } catch (err) {
        console.error('Error reading DB file, re-initializing with seed data:', err);
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  seed() {
    const villages = [...initialVillages];
    const contacts = [...initialContacts];
    const emergency = [...initialEmergency];
    const offices = [...initialOffices];

    villages.forEach(v => { if (!v.district) v.district = 'Kolasib'; });
    contacts.forEach(c => { if (!c.district) c.district = 'Kolasib'; });
    emergency.forEach(e => { if (!e.district) e.district = 'Kolasib'; });
    offices.forEach(o => { if (!o.district) o.district = 'Kolasib'; });

    if (additionalMultiDistrictData) {
      if (additionalMultiDistrictData.villages) villages.push(...additionalMultiDistrictData.villages);
      if (additionalMultiDistrictData.contacts) contacts.push(...additionalMultiDistrictData.contacts);
      if (additionalMultiDistrictData.offices) offices.push(...additionalMultiDistrictData.offices);
      if (additionalMultiDistrictData.emergency) emergency.push(...additionalMultiDistrictData.emergency);
    }

    this.data = {
      appInfo: {
        developerName: 'Mizoram IT & e-Governance Team',
        developerEmail: 'support.vc@mizoram.gov.in',
        supportPhone: '9436123456',
        appName: 'Mizoram VC Phonebook'
      },
      districts: [...initialDistricts],
      villages,
      contacts,
      emergency,
      offices,
      reports: [
        {
          id: 'rep-01',
          contactId: 'c-103',
          contactName: 'Vanlalhruaia Sailo',
          villageName: 'Kolasib Diakkawn',
          designation: 'Secretary (VCS)',
          district: 'Kolasib',
          issueType: 'incorrect_phone',
          description: 'Secretary phone number was changed recently to 9436367819',
          suggestedPhone: '9436367819',
          reportedBy: 'C. Lalrinawma (Local Resident)',
          reporterPhone: '9862112233',
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ],
      auditLogs: [
        {
          id: 'log-01',
          action: 'SYSTEM_SEED',
          details: 'Initialized Mizoram Multi-District VC Directory with 11 districts',
          timestamp: new Date().toISOString()
        }
      ],
      pushHistory: [],
      broadcasts: [
        {
          id: 'bcast-1',
          title: 'Welcome to Mizoram VC Phonebook',
          message: 'Official directory for Village Councils and Local Councils across Mizoram districts.',
          priority: 'normal',
          district: 'All',
          createdAt: new Date().toISOString()
        }
      ],
      meta: {
        lastUpdated: new Date().toISOString(),
        version: 2
      }
    };
    this.save();
  }

  save() {
    try {
      this.data.meta.lastUpdated = new Date().toISOString();
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save database:', err);
    }
  }

  // --- Districts ---
  getDistricts() {
    return this.data.districts && this.data.districts.length > 0 ? this.data.districts : initialDistricts;
  }

  addDistrict(districtData) {
    if (!this.data.districts) this.data.districts = [...initialDistricts];
    const id = districtData.id || `dist-${(districtData.name || '').toLowerCase().replace(/\s+/g, '-')}`;
    const newDistrict = {
      id,
      name: districtData.name,
      code: districtData.code || districtData.name.substring(0, 3).toUpperCase(),
      headquarter: districtData.headquarter || districtData.name,
      state: 'Mizoram',
      totalVCs: districtData.totalVCs || 0
    };
    this.data.districts.push(newDistrict);
    this.addAudit('ADD_DISTRICT', `Added district: ${newDistrict.name}`, id);
    this.save();
    return newDistrict;
  }

  // --- Village Councils ---
  getVillages(filter = {}) {
    let list = this.data.villages;
    const district = typeof filter === 'string' ? filter : filter.district;
    if (district && district !== 'All') {
      list = list.filter(v => (v.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }
    return list;
  }

  addVillage(village) {
    const id = village.id || `v-${Date.now()}`;
    const newVillage = {
      id,
      name: village.name,
      category: village.category || 'Town Area',
      district: village.district || 'Kolasib',
      type: village.type || (village.name.toLowerCase().includes('local') || village.district === 'Aizawl' ? 'Local Council' : 'Village Council'),
      totalMembers: village.totalMembers || 5,
      address: village.address || `${village.name}, ${village.district || 'Kolasib'}`
    };
    this.data.villages.push(newVillage);
    this.addAudit('CREATE_VILLAGE', `Created Council: ${newVillage.name} [${newVillage.district}] (${newVillage.type})`, id);
    this.recordPush('VILLAGE_ADDED', newVillage);
    this.save();
    return newVillage;
  }

  deleteVillage(id) {
    const idx = this.data.villages.findIndex(v => v.id === id);
    if (idx === -1) return null;
    const deleted = this.data.villages.splice(idx, 1)[0];
    this.addAudit('DELETE_VILLAGE', `Removed Council: ${deleted.name} [${deleted.district}]`, id);
    this.recordPush('VILLAGE_DELETED', { id, name: deleted.name, district: deleted.district });
    this.save();
    return deleted;
  }

  // --- App & Developer Information ---
  getAppInfo() {
    return this.data.appInfo || {
      developerName: 'Mizoram IT & e-Governance Team',
      developerEmail: 'support.vc@mizoram.gov.in',
      supportPhone: '9436123456',
      appName: 'Mizoram VC Phonebook'
    };
  }

  updateAppInfo(updates = {}) {
    if (!this.data.appInfo) {
      this.data.appInfo = {
        developerName: 'Mizoram IT & e-Governance Team',
        developerEmail: 'support.vc@mizoram.gov.in',
        supportPhone: '9436123456',
        appName: 'Mizoram VC Phonebook'
      };
    }
    this.data.appInfo = {
      ...this.data.appInfo,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.addAudit('UPDATE_APP_INFO', `Updated Developer Info: ${this.data.appInfo.developerName} (${this.data.appInfo.developerEmail})`);
    this.recordPush('APP_INFO_UPDATED', this.data.appInfo);
    this.save();
    return this.data.appInfo;
  }

  // --- Contacts ---
  getContacts({ search, villageId, category, designation, since, district } = {}) {
    let list = this.data.contacts;

    if (district && district !== 'All') {
      list = list.filter(c => (c.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }

    if (since) {
      const sinceDate = new Date(since).getTime();
      list = list.filter(c => new Date(c.updatedAt).getTime() > sinceDate);
    }

    if (villageId) {
      list = list.filter(c => c.villageId === villageId);
    }

    if (category && category !== 'All') {
      list = list.filter(c => c.category === category);
    }

    if (designation && designation !== 'All') {
      list = list.filter(c => c.designation.toLowerCase().includes(designation.toLowerCase()));
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.altPhone && c.altPhone.includes(q)) ||
        c.villageName.toLowerCase().includes(q) ||
        (c.district && c.district.toLowerCase().includes(q)) ||
        c.designation.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getContactById(id) {
    return this.data.contacts.find(c => c.id === id);
  }

  addContact(contact) {
    const id = contact.id || `c-${Date.now()}`;
    const now = new Date().toISOString();
    const newContact = {
      ...contact,
      id,
      district: contact.district || 'Kolasib',
      updatedAt: now
    };
    this.data.contacts.push(newContact);
    this.addAudit('ADD_CONTACT', `Added contact ${newContact.name} (${newContact.designation}) for ${newContact.villageName} [${newContact.district}]`, id);
    this.recordPush('CONTACT_ADDED', newContact);
    this.save();
    return newContact;
  }

  updateContact(id, updates) {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const prev = this.data.contacts[idx];
    const now = new Date().toISOString();
    const updated = {
      ...prev,
      ...updates,
      id,
      updatedAt: now
    };

    this.data.contacts[idx] = updated;

    let changes = [];
    if (prev.phone !== updated.phone) changes.push(`phone: ${prev.phone} -> ${updated.phone}`);
    if (prev.name !== updated.name) changes.push(`name: ${prev.name} -> ${updated.name}`);
    if (prev.designation !== updated.designation) changes.push(`role: ${prev.designation} -> ${updated.designation}`);
    const detailStr = changes.length > 0 ? changes.join(', ') : 'Updated details';

    this.addAudit('UPDATE_CONTACT', `Updated ${updated.name} (${updated.villageName}): ${detailStr}`, id);
    this.recordPush('CONTACT_UPDATED', updated);
    this.save();
    return updated;
  }

  deleteContact(id) {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) return false;

    const deleted = this.data.contacts.splice(idx, 1)[0];
    this.addAudit('DELETE_CONTACT', `Deleted contact ${deleted.name} (${deleted.villageName})`, id);
    this.recordPush('CONTACT_DELETED', { id, villageName: deleted.villageName, name: deleted.name });
    this.save();
    return true;
  }

  // --- Emergency Services ---
  getEmergency(filter = {}) {
    let list = this.data.emergency;
    const district = typeof filter === 'string' ? filter : filter.district;
    if (district && district !== 'All') {
      list = list.filter(e => (e.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }
    return list;
  }

  getEmergencyById(id) {
    return this.data.emergency.find(e => e.id === id);
  }

  addEmergency(emergency) {
    const id = emergency.id || `em-${Date.now()}`;
    const newEmergency = {
      ...emergency,
      id,
      district: emergency.district || 'Kolasib',
      priority: emergency.priority || 2
    };
    this.data.emergency.push(newEmergency);
    this.addAudit('ADD_EMERGENCY', `Added emergency contact: ${newEmergency.service} (${newEmergency.phone}) [${newEmergency.district}]`, id);
    this.recordPush('EMERGENCY_ADDED', newEmergency);
    this.save();
    return newEmergency;
  }

  updateEmergency(id, updates) {
    const idx = this.data.emergency.findIndex(e => e.id === id);
    if (idx === -1) return null;

    const prev = this.data.emergency[idx];
    const updated = { ...prev, ...updates, id };
    this.data.emergency[idx] = updated;

    let changes = [];
    if (prev.phone !== updated.phone) changes.push(`phone: ${prev.phone} -> ${updated.phone}`);
    if (prev.service !== updated.service) changes.push(`service: ${prev.service} -> ${updated.service}`);
    const detailStr = changes.length > 0 ? changes.join(', ') : 'Updated details';

    this.addAudit('UPDATE_EMERGENCY', `Updated emergency service ${updated.service}: ${detailStr}`, id);
    this.recordPush('EMERGENCY_UPDATED', updated);
    this.save();
    return updated;
  }

  deleteEmergency(id) {
    const idx = this.data.emergency.findIndex(e => e.id === id);
    if (idx === -1) return false;

    const deleted = this.data.emergency.splice(idx, 1)[0];
    this.addAudit('DELETE_EMERGENCY', `Deleted emergency service ${deleted.service}`, id);
    this.recordPush('EMERGENCY_DELETED', { id, service: deleted.service });
    this.save();
    return true;
  }

  // --- Government & District Offices and Staff ---
  getOffices(filter = {}) {
    let result = this.data.offices || [];
    if (filter.district && filter.district !== 'All') {
      result = result.filter(o => (o.district || 'Kolasib').toLowerCase() === filter.district.toLowerCase());
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(o =>
        o.name.toLowerCase().includes(q) ||
        (o.department && o.department.toLowerCase().includes(q)) ||
        (o.category && o.category.toLowerCase().includes(q)) ||
        (o.address && o.address.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.district && o.district.toLowerCase().includes(q)) ||
        (o.staff && o.staff.some(s =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.designation && s.designation.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q))
        ))
      );
    }
    if (filter.category && filter.category !== 'All') {
      result = result.filter(o => o.category === filter.category || o.department === filter.category);
    }
    return result;
  }

  getOfficeById(id) {
    return (this.data.offices || []).find(o => o.id === id);
  }

  addOffice(officeData) {
    if (!this.data.offices) this.data.offices = [];
    const id = officeData.id || `off-${Date.now()}`;
    const newOffice = {
      id,
      name: officeData.name || 'New Office',
      department: officeData.department || 'General Administration',
      category: officeData.category || 'Administration',
      district: officeData.district || 'Kolasib',
      address: officeData.address || 'Kolasib',
      phone: officeData.phone || '',
      email: officeData.email || '',
      staff: officeData.staff || []
    };
    this.data.offices.push(newOffice);
    this.addAudit('ADD_OFFICE', `Added Office: ${newOffice.name} [${newOffice.district}]`, id);
    this.recordPush('OFFICE_ADDED', newOffice);
    this.save();
    return newOffice;
  }

  updateOffice(id, updates) {
    if (!this.data.offices) this.data.offices = [];
    const idx = this.data.offices.findIndex(o => o.id === id);
    if (idx === -1) return null;

    const prev = this.data.offices[idx];
    const updated = {
      ...prev,
      ...updates,
      id,
      staff: updates.staff !== undefined ? updates.staff : prev.staff
    };
    this.data.offices[idx] = updated;

    this.addAudit('UPDATE_OFFICE', `Updated Office: ${updated.name}`, id);
    this.recordPush('OFFICE_UPDATED', updated);
    this.save();
    return updated;
  }

  deleteOffice(id) {
    if (!this.data.offices) return false;
    const idx = this.data.offices.findIndex(o => o.id === id);
    if (idx === -1) return false;

    const deleted = this.data.offices.splice(idx, 1)[0];
    this.addAudit('DELETE_OFFICE', `Deleted Office: ${deleted.name}`, id);
    this.recordPush('OFFICE_DELETED', { id, name: deleted.name });
    this.save();
    return true;
  }

  addOfficeStaff(officeId, staffData) {
    const office = this.getOfficeById(officeId);
    if (!office) return null;
    if (!office.staff) office.staff = [];

    const staffId = staffData.id || `stf-${Date.now()}`;
    const newStaff = {
      id: staffId,
      name: staffData.name || 'Staff Member',
      designation: staffData.designation || 'Officer',
      phone: staffData.phone || '',
      altPhone: staffData.altPhone || '',
      email: staffData.email || ''
    };
    office.staff.push(newStaff);

    this.addAudit('ADD_OFFICE_STAFF', `Added staff ${newStaff.name} (${newStaff.designation}) to ${office.name}`, officeId);
    this.recordPush('OFFICE_UPDATED', office);
    this.save();
    return { office, newStaff };
  }

  updateOfficeStaff(officeId, staffId, updates) {
    const office = this.getOfficeById(officeId);
    if (!office || !office.staff) return null;

    const sIdx = office.staff.findIndex(s => s.id === staffId);
    if (sIdx === -1) return null;

    const prev = office.staff[sIdx];
    const updatedStaff = { ...prev, ...updates, id: staffId };
    office.staff[sIdx] = updatedStaff;

    this.addAudit('UPDATE_OFFICE_STAFF', `Updated staff ${updatedStaff.name} in ${office.name}`, officeId);
    this.recordPush('OFFICE_UPDATED', office);
    this.save();
    return { office, updatedStaff };
  }

  deleteOfficeStaff(officeId, staffId) {
    const office = this.getOfficeById(officeId);
    if (!office || !office.staff) return false;

    const sIdx = office.staff.findIndex(s => s.id === staffId);
    if (sIdx === -1) return false;

    const deletedStaff = office.staff.splice(sIdx, 1)[0];
    this.addAudit('DELETE_OFFICE_STAFF', `Removed staff ${deletedStaff.name} from ${office.name}`, officeId);
    this.recordPush('OFFICE_UPDATED', office);
    this.save();
    return { office, deletedStaff };
  }

  // --- Citizen Reports on Incorrect Contact Info ---
  getReports(status = null, district = null) {
    let list = this.data.reports;
    if (status) {
      list = list.filter(r => r.status === status);
    }
    if (district && district !== 'All') {
      list = list.filter(r => (r.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }
    return list;
  }

  addReport(report) {
    const id = `rep-${Date.now()}`;
    const newReport = {
      id,
      contactId: report.contactId || null,
      contactName: report.contactName || '',
      villageName: report.villageName || '',
      designation: report.designation || '',
      district: report.district || 'Kolasib',
      isEmergency: !!report.isEmergency,
      isOffice: !!report.isOffice,
      officeName: report.officeName || '',
      serviceName: report.serviceName || report.contactName || '',
      issueType: report.issueType || 'incorrect_phone', // 'incorrect_phone', 'wrong_name', 'not_in_office', 'other'
      description: report.description || '',
      suggestedPhone: report.suggestedPhone || '',
      suggestedName: report.suggestedName || '',
      reportedBy: report.reportedBy || 'Citizen',
      reporterPhone: report.reporterPhone || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.data.reports.unshift(newReport);
    const targetLabel = newReport.isOffice ? `Office: ${newReport.officeName} - ${newReport.contactName}` : (newReport.isEmergency ? `Emergency: ${newReport.serviceName}` : newReport.contactName);
    this.addAudit('NEW_REPORT', `New error report submitted for ${targetLabel} [${newReport.district}]`, id);
    this.save();
    return newReport;
  }

  resolveReport(id, resolution, actionTaken = '') {
    const idx = this.data.reports.findIndex(r => r.id === id);
    if (idx === -1) return null;

    this.data.reports[idx].status = resolution; // 'applied' or 'rejected'
    this.data.reports[idx].resolvedAt = new Date().toISOString();
    this.data.reports[idx].actionTaken = actionTaken;
    this.addAudit('RESOLVE_REPORT', `Report ${id} marked as ${resolution}. ${actionTaken}`, id);
    this.save();
    return this.data.reports[idx];
  }

  // --- Broadcasts ---
  getBroadcasts(filter = {}) {
    const list = this.data.broadcasts || [];
    const district = typeof filter === 'string' ? filter : filter.district;
    if (district && district !== 'All') {
      return list.filter(b => !b.district || b.district === 'All' || b.district.toLowerCase() === district.toLowerCase());
    }
    return list;
  }

  addBroadcast(broadcast) {
    const id = `bcast-${Date.now()}`;
    const newBroadcast = {
      id,
      title: broadcast.title || 'Important Notice',
      message: broadcast.message || '',
      priority: broadcast.priority || 'normal', // 'urgent' or 'normal'
      district: broadcast.district || 'All',
      createdAt: new Date().toISOString()
    };
    this.data.broadcasts.unshift(newBroadcast);
    this.addAudit('SEND_BROADCAST', `Broadcast sent [${newBroadcast.district}]: ${newBroadcast.title}`, id);
    this.recordPush('BROADCAST_ALERT', newBroadcast);
    this.save();
    return newBroadcast;
  }

  // --- Push Updates & Audit Logs ---
  recordPush(type, payload) {
    const pushEvent = {
      id: `push-${Date.now()}`,
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    this.data.pushHistory.unshift(pushEvent);
    // Keep last 100 push events
    if (this.data.pushHistory.length > 100) {
      this.data.pushHistory.pop();
    }
    return pushEvent;
  }

  getRecentPushes(limit = 20) {
    return this.data.pushHistory.slice(0, limit);
  }

  addAudit(action, details, targetId = null) {
    const log = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      targetId,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    return log;
  }

  getAuditLogs(limit = 50) {
    return this.data.auditLogs.slice(0, limit);
  }

  getStats(district = null) {
    let villages = this.data.villages;
    let contacts = this.data.contacts;
    let emergency = this.data.emergency;
    let offices = this.data.offices || [];
    let reports = this.data.reports;

    if (district && district !== 'All') {
      villages = villages.filter(v => (v.district || 'Kolasib').toLowerCase() === district.toLowerCase());
      contacts = contacts.filter(c => (c.district || 'Kolasib').toLowerCase() === district.toLowerCase());
      emergency = emergency.filter(e => (e.district || 'Kolasib').toLowerCase() === district.toLowerCase());
      offices = offices.filter(o => (o.district || 'Kolasib').toLowerCase() === district.toLowerCase());
      reports = reports.filter(r => (r.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }

    const totalOfficeStaff = offices.reduce((sum, o) => sum + (o.staff ? o.staff.length : 0), 0);
    return {
      district: district || 'All',
      totalDistricts: (this.data.districts || initialDistricts).length,
      totalVillages: villages.length,
      totalContacts: contacts.length,
      totalEmergency: emergency.length,
      totalOffices: offices.length,
      totalOfficeStaff,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      lastUpdated: this.data.meta.lastUpdated
    };
  }

  // -------------------------------------------------------------
  // Google Sheets CSV Export & Import (VC & Local Councils)
  // -------------------------------------------------------------
  exportContactsCSV(district = null) {
    let list = this.data.contacts || [];
    if (district && district !== 'All') {
      list = list.filter(c => (c.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }

    const rows = list.map(c => ({
      name: c.name || '',
      phone: c.phone || '',
      altPhone: c.altPhone || '',
      designation: c.designation || '',
      villageName: c.villageName || '',
      district: c.district || 'Kolasib',
      category: c.category || 'Town Area',
      term: c.term || '2025-2030',
      notes: c.notes || ''
    }));

    return stringifyCSV(TEMPLATES.contacts, rows);
  }

  importContactsCSV(csvText, options = {}) {
    const { mode = 'merge', district = 'All' } = options;
    const { rows } = parseCSV(csvText);

    if (!rows || rows.length === 0) {
      return { success: false, error: 'No data rows found in Google Sheet / CSV file.' };
    }

    const stats = {
      totalRows: rows.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    if (mode === 'replace') {
      if (district && district !== 'All') {
        this.data.contacts = this.data.contacts.filter(c => (c.district || 'Kolasib').toLowerCase() !== district.toLowerCase());
      } else {
        this.data.contacts = [];
      }
    }

    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row._get(['name', 'officialname', 'fullname', 'contactname']);
      const phone = row._get(['phone', 'primaryphone', 'mobile', 'phonenumber', 'contactphone']);
      const altPhone = row._get(['altphone', 'alternatephone', 'altmobile', 'altnumber']);
      const designation = row._get(['designation', 'role', 'post', 'position']) || 'Member (VCM)';
      const villageName = row._get(['villagename', 'councilname', 'village', 'council', 'locality']);
      const rowDistrict = row._get(['district']) || (district && district !== 'All' ? district : 'Kolasib');
      const category = row._get(['areacategory', 'category', 'area']) || 'Town Area';
      const term = row._get(['officialterm', 'term']) || '2025-2030';
      const notes = row._get(['officenotes', 'notes', 'remarks']) || '';

      if (!name || !phone) {
        stats.skipped++;
        stats.errors.push(`Row ${i + 2}: Missing required Name or Phone`);
        continue;
      }

      // Link or create Council / Village if specified
      let matchedVillage = null;
      if (villageName) {
        matchedVillage = this.data.villages.find(v =>
          v.name.toLowerCase() === villageName.toLowerCase() &&
          (v.district || 'Kolasib').toLowerCase() === rowDistrict.toLowerCase()
        );

        if (!matchedVillage) {
          const isLC = villageName.toLowerCase().includes('local') || rowDistrict === 'Aizawl';
          matchedVillage = {
            id: `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: villageName,
            category,
            district: rowDistrict,
            type: isLC ? 'Local Council' : 'Village Council',
            totalMembers: 5,
            address: `${villageName}, ${rowDistrict}`
          };
          this.data.villages.push(matchedVillage);
        }
      }

      const villageId = matchedVillage ? matchedVillage.id : `v-${Date.now()}`;

      if (mode === 'replace') {
        const newContact = {
          id: `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name,
          phone,
          altPhone,
          designation,
          villageId,
          villageName: villageName || 'General',
          district: rowDistrict,
          category,
          term,
          notes,
          updatedAt: now
        };
        this.data.contacts.push(newContact);
        stats.added++;
      } else {
        // Merge mode: match by phone or (name + villageName + district)
        const existingIdx = this.data.contacts.findIndex(c =>
          c.phone === phone ||
          (c.name.toLowerCase() === name.toLowerCase() &&
           (c.villageName || '').toLowerCase() === (villageName || '').toLowerCase() &&
           (c.district || 'Kolasib').toLowerCase() === rowDistrict.toLowerCase())
        );

        if (existingIdx !== -1) {
          const prev = this.data.contacts[existingIdx];
          this.data.contacts[existingIdx] = {
            ...prev,
            name: name || prev.name,
            phone: phone || prev.phone,
            altPhone: altPhone !== undefined && altPhone !== '' ? altPhone : prev.altPhone,
            designation: designation || prev.designation,
            villageName: villageName || prev.villageName,
            district: rowDistrict || prev.district,
            category: category || prev.category,
            term: term || prev.term,
            notes: notes !== undefined && notes !== '' ? notes : prev.notes,
            updatedAt: now
          };
          stats.updated++;
        } else {
          const newContact = {
            id: `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name,
            phone,
            altPhone,
            designation,
            villageId,
            villageName: villageName || 'General',
            district: rowDistrict,
            category,
            term,
            notes,
            updatedAt: now
          };
          this.data.contacts.push(newContact);
          stats.added++;
        }
      }
    }

    this.addAudit('IMPORT_CONTACTS_SHEET', `Imported ${stats.added} new, ${stats.updated} updated contacts from Google Sheet / CSV (${mode} mode)`);
    this.recordPush('CONTACTS_IMPORTED', { count: stats.added + stats.updated, stats });
    this.save();
    return { success: true, stats };
  }

  // -------------------------------------------------------------
  // Google Sheets CSV Export & Import (Emergency Services)
  // -------------------------------------------------------------
  exportEmergencyCSV(district = null) {
    let list = this.data.emergency || [];
    if (district && district !== 'All') {
      list = list.filter(e => (e.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }

    const rows = list.map(e => ({
      service: e.service || '',
      officer: e.officer || '',
      phone: e.phone || '',
      altPhone: e.altPhone || '',
      category: e.category || 'Emergency Services',
      district: e.district || 'Kolasib',
      priority: e.priority !== undefined ? e.priority : 2,
      address: e.address || ''
    }));

    return stringifyCSV(TEMPLATES.emergency, rows);
  }

  importEmergencyCSV(csvText, options = {}) {
    const { mode = 'merge', district = 'All' } = options;
    const { rows } = parseCSV(csvText);

    if (!rows || rows.length === 0) {
      return { success: false, error: 'No data rows found in Google Sheet / CSV file.' };
    }

    const stats = {
      totalRows: rows.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    if (mode === 'replace') {
      if (district && district !== 'All') {
        this.data.emergency = this.data.emergency.filter(e => (e.district || 'Kolasib').toLowerCase() !== district.toLowerCase());
      } else {
        this.data.emergency = [];
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const service = row._get(['service', 'servicename', 'name', 'emergencyname']);
      const officer = row._get(['officer', 'officerincharge', 'incharge', 'contactperson']);
      const phone = row._get(['phone', 'primaryphone', 'number', 'helpline', 'phonenumber']);
      const altPhone = row._get(['altphone', 'alternatephone', 'altnumber']);
      const category = row._get(['category', 'servicecategory']) || 'Emergency Services';
      const rowDistrict = row._get(['district']) || (district && district !== 'All' ? district : 'Kolasib');
      const priority = parseInt(row._get(['priority'])) || 2;
      const address = row._get(['address', 'officeaddress', 'location']) || '';

      if (!service || !phone) {
        stats.skipped++;
        stats.errors.push(`Row ${i + 2}: Missing required Service Name or Phone`);
        continue;
      }

      if (mode === 'replace') {
        const newEm = {
          id: `em-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          service,
          officer,
          phone,
          altPhone,
          category,
          district: rowDistrict,
          priority,
          address
        };
        this.data.emergency.push(newEm);
        stats.added++;
      } else {
        // Merge mode: match by (service + district) or phone
        const existingIdx = this.data.emergency.findIndex(e =>
          (e.service.toLowerCase() === service.toLowerCase() && (e.district || 'Kolasib').toLowerCase() === rowDistrict.toLowerCase()) ||
          e.phone === phone
        );

        if (existingIdx !== -1) {
          const prev = this.data.emergency[existingIdx];
          this.data.emergency[existingIdx] = {
            ...prev,
            service: service || prev.service,
            officer: officer || prev.officer,
            phone: phone || prev.phone,
            altPhone: altPhone !== undefined && altPhone !== '' ? altPhone : prev.altPhone,
            category: category || prev.category,
            district: rowDistrict || prev.district,
            priority: priority || prev.priority,
            address: address || prev.address
          };
          stats.updated++;
        } else {
          const newEm = {
            id: `em-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            service,
            officer,
            phone,
            altPhone,
            category,
            district: rowDistrict,
            priority,
            address
          };
          this.data.emergency.push(newEm);
          stats.added++;
        }
      }
    }

    this.addAudit('IMPORT_EMERGENCY_SHEET', `Imported ${stats.added} new, ${stats.updated} updated emergency contacts from Google Sheet / CSV (${mode} mode)`);
    this.recordPush('EMERGENCY_IMPORTED', { count: stats.added + stats.updated, stats });
    this.save();
    return { success: true, stats };
  }

  // -------------------------------------------------------------
  // Google Sheets CSV Export & Import (Offices & Staff Directory)
  // -------------------------------------------------------------
  exportOfficesCSV(district = null) {
    let list = this.data.offices || [];
    if (district && district !== 'All') {
      list = list.filter(o => (o.district || 'Kolasib').toLowerCase() === district.toLowerCase());
    }

    const rows = [];
    list.forEach(o => {
      if (o.staff && o.staff.length > 0) {
        o.staff.forEach(s => {
          rows.push({
            name: o.name || '',
            department: o.department || '',
            category: o.category || 'Administration',
            district: o.district || 'Kolasib',
            phone: o.phone || '',
            email: o.email || '',
            address: o.address || '',
            staffName: s.name || '',
            staffDesignation: s.designation || '',
            staffPhone: s.phone || '',
            staffAltPhone: s.altPhone || '',
            staffEmail: s.email || ''
          });
        });
      } else {
        rows.push({
          name: o.name || '',
          department: o.department || '',
          category: o.category || 'Administration',
          district: o.district || 'Kolasib',
          phone: o.phone || '',
          email: o.email || '',
          address: o.address || '',
          staffName: '',
          staffDesignation: '',
          staffPhone: '',
          staffAltPhone: '',
          staffEmail: ''
        });
      }
    });

    return stringifyCSV(TEMPLATES.offices, rows);
  }

  importOfficesCSV(csvText, options = {}) {
    const { mode = 'merge', district = 'All' } = options;
    const { rows } = parseCSV(csvText);

    if (!rows || rows.length === 0) {
      return { success: false, error: 'No data rows found in Google Sheet / CSV file.' };
    }

    const stats = {
      totalRows: rows.length,
      officesAdded: 0,
      officesUpdated: 0,
      staffAdded: 0,
      staffUpdated: 0,
      skipped: 0,
      errors: []
    };

    if (mode === 'replace') {
      if (district && district !== 'All') {
        this.data.offices = (this.data.offices || []).filter(o => (o.district || 'Kolasib').toLowerCase() !== district.toLowerCase());
      } else {
        this.data.offices = [];
      }
    }

    // Group rows by Office (Name + District)
    const officeGroups = new Map();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const officeName = row._get(['officename', 'name', 'office', 'departmentname']);
      const rowDistrict = row._get(['district']) || (district && district !== 'All' ? district : 'Kolasib');

      if (!officeName) {
        stats.skipped++;
        stats.errors.push(`Row ${i + 2}: Missing Office Name`);
        continue;
      }

      const key = `${officeName.trim().toLowerCase()}:::${rowDistrict.trim().toLowerCase()}`;
      if (!officeGroups.has(key)) {
        officeGroups.set(key, {
          officeMeta: {
            name: officeName.trim(),
            department: row._get(['department', 'dept']) || 'General Administration',
            category: row._get(['category', 'officecategory']) || 'Administration',
            district: rowDistrict,
            phone: row._get(['officephone', 'phone', 'landline']) || '',
            email: row._get(['officeemail', 'email']) || '',
            address: row._get(['officeaddress', 'address', 'location']) || `${officeName.trim()}, ${rowDistrict}`
          },
          staffRows: []
        });
      }

      const staffName = row._get(['staffname', 'staff', 'employeename', 'officername']);
      if (staffName) {
        officeGroups.get(key).staffRows.push({
          name: staffName.trim(),
          designation: row._get(['staffdesignation', 'designation', 'role', 'post']) || 'Officer',
          phone: row._get(['staffphone', 'phone', 'mobile', 'staffmobile']) || '',
          altPhone: row._get(['staffaltphone', 'altphone', 'staffaltmobile']) || '',
          email: row._get(['staffemail', 'email', 'staffmail']) || ''
        });
      }
    }

    if (!this.data.offices) this.data.offices = [];

    // Process each office group
    for (const [, group] of officeGroups) {
      let office = null;

      if (mode !== 'replace') {
        office = this.data.offices.find(o =>
          o.name.toLowerCase() === group.officeMeta.name.toLowerCase() &&
          (o.district || 'Kolasib').toLowerCase() === group.officeMeta.district.toLowerCase()
        );
      }

      if (office) {
        // Update office info
        office.department = group.officeMeta.department || office.department;
        office.category = group.officeMeta.category || office.category;
        if (group.officeMeta.phone) office.phone = group.officeMeta.phone;
        if (group.officeMeta.email) office.email = group.officeMeta.email;
        if (group.officeMeta.address) office.address = group.officeMeta.address;
        if (!office.staff) office.staff = [];
        stats.officesUpdated++;
      } else {
        office = {
          id: `off-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          ...group.officeMeta,
          staff: []
        };
        this.data.offices.push(office);
        stats.officesAdded++;
      }

      // Process staff for this office
      for (const st of group.staffRows) {
        const existingStaff = office.staff.find(s =>
          (s.name.toLowerCase() === st.name.toLowerCase()) ||
          (st.phone && s.phone === st.phone)
        );

        if (existingStaff) {
          existingStaff.name = st.name || existingStaff.name;
          existingStaff.designation = st.designation || existingStaff.designation;
          if (st.phone) existingStaff.phone = st.phone;
          if (st.altPhone) existingStaff.altPhone = st.altPhone;
          if (st.email) existingStaff.email = st.email;
          stats.staffUpdated++;
        } else {
          office.staff.push({
            id: `stf-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            ...st
          });
          stats.staffAdded++;
        }
      }
    }

    this.addAudit('IMPORT_OFFICES_SHEET', `Imported ${stats.officesAdded} new offices, ${stats.officesUpdated} updated offices, ${stats.staffAdded} staff added from Google Sheet / CSV (${mode} mode)`);
    this.recordPush('OFFICES_IMPORTED', { stats });
    this.save();
    return { success: true, stats };
  }

  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.contacts && parsed.villages) {
        this.data = parsed;
        this.save();
        this.recordPush('FULL_DATABASE_RESTORE', { time: new Date().toISOString() });
        return { success: true, count: this.data.contacts.length };
      }
      return { success: false, error: 'Invalid data format' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = new Database();
