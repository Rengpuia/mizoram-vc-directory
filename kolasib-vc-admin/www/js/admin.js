// Mizoram VC Admin App - Application Logic (Multi-District Control)
// Handles PIN Authentication, Multi-District Management, Live Push Updates & Citizen Reports

const isLocalBrowser = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '';
const isWebHosting = window.location.protocol.startsWith('http') && 
                     !['localhost', '127.0.0.1'].includes(window.location.hostname);

const _0xsec = (function() {
  const enc = [47, 60, 61, 58, 56, 118, 98, 104, 37, 32, 48, 36, 62, 44, 42, 101, 63, 41, 102, 40, 36, 53, 45, 42, 62, 36, 62, 52, 105, 39, 39, 56, 46, 34, 41, 34, 58, 103, 41, 36, 33];
  return enc.map((b, i) => String.fromCharCode(b ^ (0x47 + (i % 7)))).join('');
})();

const API_BASE = (isLocalBrowser || isWebHosting)
  ? window.location.origin
  : _0xsec;

let adminState = {
  pin: localStorage.getItem('kolasib_admin_pin') || '',
  selectedDistrict: localStorage.getItem('kolasib_admin_selected_district') || 'All',
  districts: [],
  contacts: [],
  villages: [],
  emergency: [],
  offices: [],
  reports: [],
  auditLogs: [],
  broadcasts: [],
  stats: {},
  appInfo: null,
  filterCategory: 'All',
  councilTypeFilter: 'All',
  reportStatusFilter: 'pending',
  searchQuery: '',
  councilSearch: '',
  emergencySearch: '',
  officeSearch: '',
  eventSource: null
};

document.addEventListener('DOMContentLoaded', () => {
  const distSelect = document.getElementById('adminDistrictSelect');
  if (distSelect) distSelect.value = adminState.selectedDistrict;
  updateActiveDistrictBadge();

  if (adminState.pin) {
    verifyStoredPin();
  }
  setupAdminListeners();
});

// -------------------------------------------------------------
// Multi-District Admin Switcher
// -------------------------------------------------------------
function changeAdminDistrict(district) {
  adminState.selectedDistrict = district;
  localStorage.setItem('kolasib_admin_selected_district', district);
  updateActiveDistrictBadge();

  // Pre-set district on all add-modals to match current view
  const modalDistSelects = ['addDistrict', 'addCouncilDistrict', 'addEmDistrict', 'addOffDistrict', 'bcastDistrict'];
  modalDistSelects.forEach(id => {
    const el = document.getElementById(id);
    if (el && district !== 'All') el.value = district;
  });

  renderAdminContacts();
  renderAdminCouncils();
  renderAdminEmergency();
  renderAdminOffices();
  renderAdminReports();
  updateAdminStats();
}

function updateActiveDistrictBadge() {
  const badge = document.getElementById('activeDistrictBadge');
  if (badge) {
    badge.textContent = adminState.selectedDistrict === 'All' ? 'All Districts' : `${adminState.selectedDistrict} District`;
  }
  const brandTitle = document.getElementById('adminBrandTitle');
  if (brandTitle) {
    brandTitle.textContent = adminState.selectedDistrict === 'All' ? 'Mizoram VC Admin' : `${adminState.selectedDistrict} VC Admin`;
  }
}

function updateAdminStats() {
  let contacts = adminState.contacts;
  let offices = adminState.offices;
  let reports = adminState.reports;
  let villages = adminState.villages;
  const d = adminState.selectedDistrict;

  if (d && d !== 'All') {
    contacts = contacts.filter(c => (c.district || 'Kolasib').toLowerCase() === d.toLowerCase());
    offices = offices.filter(o => (o.district || 'Kolasib').toLowerCase() === d.toLowerCase());
    reports = reports.filter(r => (r.district || 'Kolasib').toLowerCase() === d.toLowerCase());
    villages = villages.filter(v => (v.district || 'Kolasib').toLowerCase() === d.toLowerCase());
  }

  const countVillages = villages.length > 0 ? villages.length : new Set(contacts.map(c => c.villageName)).size;
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const statContacts = document.getElementById('statContacts');
  const statVillages = document.getElementById('statVillages');
  const statReports = document.getElementById('statPendingReports');

  if (statContacts) statContacts.textContent = contacts.length;
  if (statVillages) statVillages.textContent = countVillages;
  if (statReports) statReports.textContent = pendingReports;
}

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
async function handleLogin(e) {
  e.preventDefault();
  const pinInput = document.getElementById('adminPinInput');
  const errorEl = document.getElementById('loginError');
  const pin = pinInput.value.trim();

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    }).then(r => r.json());

    if (res.success) {
      adminState.pin = pin;
      localStorage.setItem('kolasib_admin_pin', pin);
      showMainScreen();
      fetchAdminData();
      initAdminSSE();
    } else {
      errorEl.textContent = res.error || 'Invalid Admin PIN';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Server connection error. Please ensure backend is running.';
    errorEl.style.display = 'block';
  }
}

async function verifyStoredPin() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: adminState.pin })
    }).then(r => r.json());

    if (res.success) {
      showMainScreen();
      fetchAdminData();
      initAdminSSE();
    } else {
      handleLogout();
    }
  } catch (e) {
    handleLogout();
  }
}

function handleLogout() {
  adminState.pin = '';
  localStorage.removeItem('kolasib_admin_pin');
  document.getElementById('loginScreen').classList.add('active');
  document.getElementById('adminMainScreen').classList.remove('active');
  document.getElementById('adminPinInput').value = '';
}

function showMainScreen() {
  document.getElementById('loginScreen').classList.remove('active');
  document.getElementById('adminMainScreen').classList.add('active');
}

// -------------------------------------------------------------
// Data Fetching
// -------------------------------------------------------------
async function fetchAdminData() {
  try {
    const headers = { 'X-Admin-PIN': adminState.pin };

    const [contactsRes, emergencyRes, officesRes, reportsRes, statsRes, auditRes, villagesRes, appInfoRes, bcastsRes] = await Promise.all([
      fetch(`${API_BASE}/api/contacts`).then(r => r.json()),
      fetch(`${API_BASE}/api/emergency`).then(r => r.json()),
      fetch(`${API_BASE}/api/offices`).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/reports`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/stats`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/audit-logs`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/api/villages`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API_BASE}/api/app-info`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API_BASE}/api/broadcasts`).then(r => r.json()).catch(() => ({ success: false }))
    ]);

    if (bcastsRes && bcastsRes.success && bcastsRes.data) {
      adminState.broadcasts = bcastsRes.data;
      renderAdminBroadcasts();
    }

    if (contactsRes.success) {
      adminState.contacts = contactsRes.data;
      renderAdminContacts();
    }

    if (emergencyRes.success) {
      adminState.emergency = emergencyRes.data;
      renderAdminEmergency();
    }

    if (officesRes.success) {
      adminState.offices = officesRes.data;
      renderAdminOffices();
    }

    if (villagesRes && villagesRes.success) {
      adminState.villages = villagesRes.data;
      renderAdminCouncils();
    }

    if (appInfoRes && appInfoRes.success && appInfoRes.data) {
      adminState.appInfo = appInfoRes.data;
      populateDeveloperInfoForm();
    }

    if (reportsRes.success) {
      adminState.reports = reportsRes.data;
      renderAdminReports();
      updatePendingReportBadge();
    }

    if (statsRes.success) {
      adminState.stats = statsRes.data;
      updateAdminStats();
    }

    if (auditRes.success) {
      adminState.auditLogs = auditRes.logs;
      renderAuditLogs();
    }
  } catch (err) {
    console.error('Failed to fetch admin data:', err);
  }
}

// -------------------------------------------------------------
// Real-Time SSE Listener for Admin App
// -------------------------------------------------------------
function initAdminSSE() {
  if (adminState.eventSource) adminState.eventSource.close();

  try {
    const sse = new EventSource(`${API_BASE}/api/sync/events`);
    adminState.eventSource = sse;

    sse.addEventListener('new_report', (e) => {
      showAdminToast(`📥 New citizen correction report received!`);
      fetchAdminData();
    });

    sse.addEventListener('contact_updated', () => { fetchAdminData(); });
    sse.addEventListener('contact_added', () => { fetchAdminData(); });
    sse.addEventListener('contact_deleted', () => { fetchAdminData(); });

    sse.addEventListener('emergency_updated', (e) => {
      showAdminToast(`🚨 Emergency service updated & synced`);
      fetchAdminData();
    });

    sse.addEventListener('emergency_added', (e) => {
      showAdminToast(`🚨 Emergency service added & synced`);
      fetchAdminData();
    });

    sse.addEventListener('emergency_deleted', (e) => {
      showAdminToast(`🚨 Emergency service removed`);
      fetchAdminData();
    });

    sse.addEventListener('office_added', (e) => {
      showAdminToast(`🏛️ Office added & synced`);
      fetchAdminData();
    });

    sse.addEventListener('office_updated', (e) => {
      showAdminToast(`🏛️ Office directory updated`);
      fetchAdminData();
    });

    sse.addEventListener('office_deleted', (e) => {
      showAdminToast(`🏛️ Office removed`);
      fetchAdminData();
    });

    sse.addEventListener('village_added', (e) => {
      showAdminToast(`🏛️ Council added & synced`);
      fetchAdminData();
    });

    sse.addEventListener('village_deleted', (e) => {
      showAdminToast(`🗑️ Council removed & synced`);
      fetchAdminData();
    });

    sse.addEventListener('app_info_updated', (e) => {
      showAdminToast(`ℹ️ Developer info updated & pushed`);
      fetchAdminData();
    });

    sse.addEventListener('broadcast_received', (e) => {
      fetchAdminData();
    });

    sse.addEventListener('broadcast_deleted', (e) => {
      showAdminToast(`🗑️ Notice deleted`);
      fetchAdminData();
    });
  } catch (e) {
    console.warn('Admin SSE error:', e);
  }
}

// -------------------------------------------------------------
// Contact Management (Add, Edit, Delete & Push)
// -------------------------------------------------------------
function setupAdminListeners() {
  // Search filter
  const searchInput = document.getElementById('adminSearchInput');
  searchInput.addEventListener('input', (e) => {
    adminState.searchQuery = e.target.value.trim().toLowerCase();
    renderAdminContacts();
  });

  // Emergency Search filter
  const emSearchInput = document.getElementById('adminEmergencySearch');
  if (emSearchInput) {
    emSearchInput.addEventListener('input', (e) => {
      adminState.emergencySearch = e.target.value.trim().toLowerCase();
      renderAdminEmergency();
    });
  }

  // Office Search filter
  const offSearchInput = document.getElementById('adminOfficeSearch');
  if (offSearchInput) {
    offSearchInput.addEventListener('input', (e) => {
      adminState.officeSearch = e.target.value.trim().toLowerCase();
      renderAdminOffices();
    });
  }

  // Category pills
  const pills = document.querySelectorAll('#adminCategoryPills .pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      adminState.filterCategory = pill.getAttribute('data-cat');
      renderAdminContacts();
    });
  });

  // Council Search filter
  const councilSearchInput = document.getElementById('adminCouncilSearch');
  if (councilSearchInput) {
    councilSearchInput.addEventListener('input', (e) => {
      adminState.councilSearch = e.target.value.trim().toLowerCase();
      renderAdminCouncils();
    });
  }

  // Council Type pills
  const councilPills = document.querySelectorAll('#adminCouncilTypePills .pill');
  councilPills.forEach(pill => {
    pill.addEventListener('click', () => {
      councilPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      adminState.councilTypeFilter = pill.getAttribute('data-ctype');
      renderAdminCouncils();
    });
  });
}

function renderAdminContacts() {
  const container = document.getElementById('adminContactsList');
  let list = [...adminState.contacts];

  if (adminState.selectedDistrict && adminState.selectedDistrict !== 'All') {
    list = list.filter(c => (c.district || 'Kolasib').toLowerCase() === adminState.selectedDistrict.toLowerCase());
  }

  if (adminState.filterCategory !== 'All') {
    list = list.filter(c => c.category === adminState.filterCategory);
  }

  if (adminState.searchQuery) {
    const q = adminState.searchQuery;
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.villageName.toLowerCase().includes(q) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      c.phone.includes(q) ||
      c.designation.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No contacts found matching search / active district filter.</div>`;
    return;
  }

  const html = list.map(c => `
    <div class="admin-contact-card" id="admin-card-${c.id}">
      <div class="admin-card-header">
        <div>
          <div style="display:flex; align-items:center; gap:6px;">
            <h4 class="admin-card-title">${escapeHtml(c.name)}</h4>
            <span class="district-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.district || 'Kolasib')}</span>
          </div>
          <span class="admin-card-subtitle">${escapeHtml(c.designation)}</span>
        </div>
        <span class="admin-card-village"><i class="fa-solid fa-landmark"></i> ${escapeHtml(c.villageName)}</span>
      </div>

      <div class="admin-card-phone">
        <i class="fa-solid fa-phone" style="color:#3b82f6;"></i>
        <span>${escapeHtml(c.phone)}</span>
        ${c.altPhone ? `<span style="color:#64748b;">(${escapeHtml(c.altPhone)})</span>` : ''}
      </div>

      <div class="admin-card-actions">
        <button class="btn-card-edit" onclick="openEditModal('${c.id}')">
          <i class="fa-solid fa-pen-to-square"></i> Edit & Push Update
        </button>
        <button class="btn-card-del" onclick="deleteContactConfirm('${c.id}', '${escapeHtml(c.name)}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

function openEditModal(contactId) {
  const contact = adminState.contacts.find(c => c.id === contactId);
  if (!contact) return;

  document.getElementById('editContactId').value = contact.id;
  document.getElementById('editName').value = contact.name;
  document.getElementById('editPhone').value = contact.phone;
  document.getElementById('editAltPhone').value = contact.altPhone || '';
  document.getElementById('editDesignation').value = contact.designation;
  document.getElementById('editTerm').value = contact.term || '2025-2030';
  document.getElementById('editVillageName').value = contact.villageName;
  const editDistEl = document.getElementById('editDistrict');
  if (editDistEl) editDistEl.value = contact.district || 'Kolasib';
  document.getElementById('editCategory').value = contact.category || 'Town Area';
  document.getElementById('editNotes').value = contact.notes || '';

  document.getElementById('editContactModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editContactModal').style.display = 'none';
}

async function saveContactChanges(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSavePush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pushing Update...`;

  const contactId = document.getElementById('editContactId').value;
  const updates = {
    name: document.getElementById('editName').value.trim(),
    phone: document.getElementById('editPhone').value.trim(),
    altPhone: document.getElementById('editAltPhone').value.trim(),
    designation: document.getElementById('editDesignation').value,
    term: document.getElementById('editTerm').value.trim(),
    villageName: document.getElementById('editVillageName').value.trim(),
    district: document.getElementById('editDistrict') ? document.getElementById('editDistrict').value : 'Kolasib',
    category: document.getElementById('editCategory').value,
    notes: document.getElementById('editNotes').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(updates)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`⚡ Update pushed to all active Phonebooks!`);
      closeEditModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to save changes. Please check server connection.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Save & Push Update`;
  }
}

function openAddModal() {
  document.getElementById('addName').value = '';
  document.getElementById('addPhone').value = '';
  document.getElementById('addAltPhone').value = '';
  document.getElementById('addVillageName').value = '';
  document.getElementById('addNotes').value = '';
  const addDistEl = document.getElementById('addDistrict');
  if (addDistEl) {
    addDistEl.value = adminState.selectedDistrict !== 'All' ? adminState.selectedDistrict : 'Kolasib';
  }
  document.getElementById('addContactModal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('addContactModal').style.display = 'none';
}

async function submitNewContact(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('addName').value.trim(),
    phone: document.getElementById('addPhone').value.trim(),
    altPhone: document.getElementById('addAltPhone').value.trim(),
    designation: document.getElementById('addDesignation').value,
    term: document.getElementById('addTerm').value.trim(),
    villageName: document.getElementById('addVillageName').value.trim(),
    district: document.getElementById('addDistrict') ? document.getElementById('addDistrict').value : 'Kolasib',
    category: document.getElementById('addCategory').value,
    notes: document.getElementById('addNotes').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🟢 Contact created and pushed to Phonebooks!`);
      closeAddModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to add contact.');
  }
}

async function deleteContactConfirm(contactId, name) {
  if (!confirm(`Are you sure you want to delete ${name}? This will remove the contact from all Phonebook apps in real-time.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-PIN': adminState.pin }
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🗑️ Contact removed from Phonebooks!`);
      fetchAdminData();
    } else {
      alert(`Delete error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to delete contact.');
  }
}

// -------------------------------------------------------------
// Citizen Correction Reports Review & Instant Resolution
// -------------------------------------------------------------
function filterReports(status, btn) {
  adminState.reportStatusFilter = status;
  document.querySelectorAll('.report-filter-bar .sub-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAdminReports();
}

function renderAdminReports() {
  const container = document.getElementById('adminReportsList');
  let list = [...adminState.reports];

  if (adminState.selectedDistrict && adminState.selectedDistrict !== 'All') {
    list = list.filter(r => (r.district || 'Kolasib').toLowerCase() === adminState.selectedDistrict.toLowerCase());
  }

  if (adminState.reportStatusFilter !== 'all') {
    list = list.filter(r => r.status === adminState.reportStatusFilter);
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No ${adminState.reportStatusFilter} correction reports found.</div>`;
    return;
  }

  const html = list.map(r => {
    const isPending = r.status === 'pending';
    const isEmergency = r.isEmergency || (r.contactId && r.contactId.startsWith('em-'));
    const isOffice = r.isOffice || (r.contactId && r.contactId.startsWith('stf-'));
    return `
      <div class="report-card ${r.status}">
        <div class="report-top">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <h4 class="report-target">${isOffice ? '🏛️ ' : (isEmergency ? '🚨 ' : '')}${escapeHtml(r.serviceName || r.contactName || 'General Contact')}</h4>
              <span class="district-badge" style="font-size:0.7rem; padding:1px 6px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(r.district || 'Kolasib')}</span>
            </div>
            <span class="report-subtarget">${escapeHtml(r.designation || '')} • ${escapeHtml(r.officeName || r.villageName || '')}</span>
          </div>
          <div style="display:flex; gap:4px;">
            ${isOffice ? `<span class="report-tag" style="background:rgba(2,132,199,0.2); color:#38bdf8;"><i class="fa-solid fa-building-columns"></i> OFFICE</span>` : ''}
            ${isEmergency ? `<span class="report-tag" style="background:rgba(239,68,68,0.2); color:#f87171;"><i class="fa-solid fa-shield-heart"></i> EMERGENCY</span>` : ''}
            <span class="report-tag tag-${r.status}">${escapeHtml(r.status)}</span>
          </div>
        </div>

        <div class="report-detail-box">
          <div><strong>Issue:</strong> ${escapeHtml(r.issueType)}</div>
          ${r.suggestedPhone ? `<div><strong>Suggested Number:</strong> <span class="report-suggested-val">${escapeHtml(r.suggestedPhone)}</span></div>` : ''}
          ${r.description ? `<div><strong>Note:</strong> ${escapeHtml(r.description)}</div>` : ''}
        </div>

        <div class="report-meta">
          <span>Reported by: ${escapeHtml(r.reportedBy || 'Citizen')} ${r.reporterPhone ? `(${escapeHtml(r.reporterPhone)})` : ''}</span> • 
          <span>${formatDate(r.createdAt)}</span>
        </div>

        ${isPending ? `
          <div class="report-actions">
            <button class="btn-apply-corr" onclick="applyCorrectionReport('${r.id}', '${r.contactId}', '${escapeHtml(r.suggestedPhone)}', ${isEmergency}, ${isOffice})">
              <i class="fa-solid fa-check-double"></i> Apply Correction & Push Update
            </button>
            <button class="btn-reject-corr" onclick="rejectReport('${r.id}')">
              <i class="fa-solid fa-xmark"></i> Reject
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function updatePendingReportBadge() {
  const count = adminState.reports.filter(r => r.status === 'pending').length;
  const bubble = document.getElementById('pendingBubble');
  if (count > 0) {
    bubble.textContent = count;
    bubble.style.display = 'inline-block';
  } else {
    bubble.style.display = 'none';
  }
}

async function applyCorrectionReport(reportId, contactId, suggestedPhone, isEmergency = false, isOffice = false) {
  const note = prompt('Confirm action note (optional):', `Applied suggested phone: ${suggestedPhone}`);
  if (note === null) return;

  let contactUpdates = null;
  if (isEmergency || (contactId && contactId.startsWith('em-'))) {
    const targetEm = adminState.emergency.find(e => e.id === contactId);
    contactUpdates = targetEm ? {
      ...targetEm,
      phone: suggestedPhone || targetEm.phone
    } : { id: contactId, phone: suggestedPhone };
  } else if (isOffice || (contactId && contactId.startsWith('stf-'))) {
    contactUpdates = { id: contactId, phone: suggestedPhone };
  } else {
    const targetContact = adminState.contacts.find(c => c.id === contactId);
    contactUpdates = targetContact ? {
      ...targetContact,
      phone: suggestedPhone || targetContact.phone
    } : null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify({
        status: 'applied',
        actionTaken: note,
        applyChanges: !!contactUpdates,
        contactUpdates,
        isEmergency: !!isEmergency,
        isOffice: !!isOffice
      })
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`✅ Correction applied & pushed to all phonebooks!`);
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to resolve report.');
  }
}

async function rejectReport(reportId) {
  const reason = prompt('Reason for rejection (e.g., Number verified as active):', 'Information not verified');
  if (reason === null) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify({
        status: 'rejected',
        actionTaken: reason,
        applyChanges: false
      })
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`Report marked as rejected.`);
      fetchAdminData();
    }
  } catch (e) {
    alert('Failed to reject report.');
  }
}

// -------------------------------------------------------------
// Broadcast Announcement
// -------------------------------------------------------------
async function submitBroadcast(e) {
  e.preventDefault();
  const title = document.getElementById('bcastTitle').value.trim();
  const message = document.getElementById('bcastMessage').value.trim();
  const priority = document.getElementById('bcastPriority').value;
  const district = document.getElementById('bcastDistrict') ? document.getElementById('bcastDistrict').value : 'All';

  try {
    const res = await fetch(`${API_BASE}/api/admin/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify({ title, message, priority, district })
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`📢 Announcement pushed${district && district !== 'All' ? ' to ' + district : ' to all active Phonebooks'}!`);
      document.getElementById('bcastTitle').value = '';
      document.getElementById('bcastMessage').value = '';
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (e) {
    alert('Failed to broadcast.');
  }
}

function renderAdminBroadcasts() {
  const container = document.getElementById('adminBroadcastsList');
  const countBadge = document.getElementById('adminBroadcastCountBadge');
  if (!container) return;

  const list = adminState.broadcasts || [];
  if (countBadge) {
    countBadge.textContent = `${list.length} Active`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:24px; color:#94a3b8; font-size:0.85rem; background:rgba(255,255,255,0.02); border-radius:8px; border:1px dashed #334155;">
        <i class="fa-solid fa-bullhorn" style="font-size:1.6rem; margin-bottom:8px; color:#64748b; display:block;"></i>
        <span>No active announcements sent yet. Use the form above to push a notice.</span>
      </div>
    `;
    return;
  }

  const html = list.map(b => {
    const isUrgent = b.priority === 'urgent';
    const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Recent';

    return `
      <div class="admin-contact-card" style="padding:14px; margin-bottom:10px; border-left: 4px solid ${isUrgent ? '#ef4444' : '#38bdf8'}; background:#1e293b; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
              <span style="font-size:0.72rem; padding:2px 8px; border-radius:4px; font-weight:700; background:${isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.18)'}; color:${isUrgent ? '#ef4444' : '#38bdf8'};">
                <i class="fa-solid ${isUrgent ? 'fa-triangle-exclamation' : 'fa-bullhorn'}"></i> ${isUrgent ? 'Urgent Alert' : 'Normal Notice'}
              </span>
              <span class="district-badge" style="font-size:0.72rem; padding:2px 8px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(b.district || 'All Districts')}</span>
              <span style="font-size:0.72rem; color:#94a3b8;"><i class="fa-solid fa-clock"></i> ${escapeHtml(dateStr)}</span>
            </div>
            <h4 style="font-size:0.95rem; font-weight:700; color:#f8fafc; margin:4px 0 6px 0;">${escapeHtml(b.title)}</h4>
            <p style="font-size:0.84rem; color:#cbd5e1; margin:0; line-height:1.45;">${escapeHtml(b.message)}</p>
          </div>
          <button class="btn-card-del" onclick="deleteBroadcastConfirm('${b.id}')" title="Delete Announcement" style="padding:6px 12px; font-size:0.78rem; white-space:nowrap; align-self:flex-start;">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

async function deleteBroadcastConfirm(id) {
  const b = (adminState.broadcasts || []).find(x => x.id === id);
  const title = b ? b.title : 'this announcement';
  if (!confirm(`Are you sure you want to delete "${title}"? This will remove the notice from all Citizen phonebook apps in real-time.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/broadcasts/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-PIN': adminState.pin }
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🗑️ Announcement removed from citizen apps!`);
      fetchAdminData();
    } else {
      alert(`Delete error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to delete announcement.');
  }
}

// -------------------------------------------------------------
// Audit Logs
// -------------------------------------------------------------
function renderAuditLogs() {
  const container = document.getElementById('auditLogList');
  if (!container) return;

  const html = adminState.auditLogs.map(log => `
    <div class="audit-entry">
      <div class="audit-action">
        <span>${escapeHtml(log.action)}</span>
        <span class="audit-time">${formatDate(log.timestamp)}</span>
      </div>
      <div class="audit-desc">${escapeHtml(log.details)}</div>
    </div>
  `).join('');

  container.innerHTML = html;
}

// -------------------------------------------------------------
// Export Backup
// -------------------------------------------------------------
function exportBackup() {
  window.open(`${API_BASE}/api/admin/export?pin=${adminState.pin}`, '_blank');
}

// -------------------------------------------------------------
// Google Sheets Import & Export Hub
// -------------------------------------------------------------
let sheetsHubState = {
  activeType: 'contacts', // 'contacts', 'emergency', 'offices'
  activeAction: 'export', // 'export', 'import'
  importMethod: 'url'     // 'url', 'file'
};

const SHEET_METADATA = {
  contacts: {
    title: 'VC & Local Council Directory',
    desc: 'All elected members, designations (VCP, VCS, VCT), council names & districts.',
    icon: 'fa-users'
  },
  emergency: {
    title: 'Emergency Services & Helplines',
    desc: 'Hospitals, Police, Fire, Disaster Management, and District Helplines.',
    icon: 'fa-shield-heart'
  },
  offices: {
    title: 'Government Offices & Staff Directory',
    desc: 'DC Office, SP Office, Line Departments with nested officers and staff.',
    icon: 'fa-building-columns'
  }
};

function openSheetsModal(sheetType = 'contacts', action = 'export') {
  const modal = document.getElementById('sheetsHubModal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Set export district selector to current district
  const expDist = document.getElementById('sheetExportDistrictSelect');
  if (expDist) expDist.value = adminState.selectedDistrict || 'All';
  const impDist = document.getElementById('sheetImportDistrictSelect');
  if (impDist) impDist.value = adminState.selectedDistrict || 'All';

  selectSheetType(sheetType);
  selectSheetAction(action);
}

function closeSheetsModal() {
  const modal = document.getElementById('sheetsHubModal');
  if (modal) modal.style.display = 'none';
  const resCard = document.getElementById('sheetImportResult');
  if (resCard) resCard.style.display = 'none';
}

function selectSheetType(type) {
  sheetsHubState.activeType = type;

  // Toggle selector buttons
  ['contacts', 'emergency', 'offices'].forEach(t => {
    const btn = document.getElementById(`sheetType${t.charAt(0).toUpperCase() + t.slice(1)}Btn`);
    if (btn) btn.classList.toggle('active', t === type);
  });

  // Update banner
  const meta = SHEET_METADATA[type] || SHEET_METADATA.contacts;
  const titleEl = document.getElementById('activeSheetTitle');
  const descEl = document.getElementById('activeSheetDesc');
  if (titleEl) titleEl.textContent = meta.title;
  if (descEl) descEl.textContent = meta.desc;

  const resCard = document.getElementById('sheetImportResult');
  if (resCard) resCard.style.display = 'none';
}

function selectSheetAction(action) {
  sheetsHubState.activeAction = action;

  const expBtn = document.getElementById('sheetActionExportBtn');
  const impBtn = document.getElementById('sheetActionImportBtn');
  const expPanel = document.getElementById('sheetsExportPanel');
  const impPanel = document.getElementById('sheetsImportPanel');

  if (action === 'export') {
    if (expBtn) expBtn.classList.add('active');
    if (impBtn) impBtn.classList.remove('active');
    if (expPanel) { expPanel.style.display = 'block'; expPanel.classList.add('active'); }
    if (impPanel) { impPanel.style.display = 'none'; impPanel.classList.remove('active'); }
  } else {
    if (expBtn) expBtn.classList.remove('active');
    if (impBtn) impBtn.classList.add('active');
    if (expPanel) { expPanel.style.display = 'none'; expPanel.classList.remove('active'); }
    if (impPanel) { impPanel.style.display = 'block'; impPanel.classList.add('active'); }
  }
}

function toggleImportMethod(method) {
  sheetsHubState.importMethod = method;
  const urlGroup = document.getElementById('methodUrlGroup');
  const fileGroup = document.getElementById('methodFileGroup');
  const textGroup = document.getElementById('methodTextGroup');

  if (urlGroup) urlGroup.style.display = method === 'url' ? 'block' : 'none';
  if (fileGroup) fileGroup.style.display = method === 'file' ? 'block' : 'none';
  if (textGroup) textGroup.style.display = method === 'text' ? 'block' : 'none';
}

async function executeSheetExport() {
  const type = sheetsHubState.activeType;
  const distSelect = document.getElementById('sheetExportDistrictSelect');
  const district = distSelect ? distSelect.value : (adminState.selectedDistrict || 'All');
  const pin = adminState.pin || localStorage.getItem('kolasib_admin_pin') || '';
  const exportUrl = `${API_BASE}/api/admin/export/csv?type=${type}&district=${encodeURIComponent(district)}&pin=${encodeURIComponent(pin)}`;
  const filename = `${type}_${district.replace(/\s+/g, '_')}_mizoram_vc.csv`;

  showAdminToast(`📥 Downloading ${type} CSV for Google Sheets...`);

  try {
    const res = await fetch(exportUrl, {
      headers: { 'X-Admin-PIN': pin }
    });
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);
  } catch (err) {
    console.warn('Fallback to window.open for CSV download:', err);
    window.open(exportUrl, '_blank');
  }
}

async function copySheetCsvToClipboard() {
  const type = sheetsHubState.activeType;
  const distSelect = document.getElementById('sheetExportDistrictSelect');
  const district = distSelect ? distSelect.value : (adminState.selectedDistrict || 'All');
  const pin = adminState.pin || localStorage.getItem('kolasib_admin_pin') || '';
  const exportUrl = `${API_BASE}/api/admin/export/csv?type=${type}&district=${encodeURIComponent(district)}&pin=${encodeURIComponent(pin)}`;

  showAdminToast(`📋 Fetching CSV data for clipboard...`);

  try {
    const res = await fetch(exportUrl, {
      headers: { 'X-Admin-PIN': pin }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showAdminToast(`✅ CSV copied to clipboard! Paste directly into Google Sheets.`);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showAdminToast(`✅ CSV copied to clipboard!`);
    }
  } catch (err) {
    alert(`Could not copy to clipboard: ${err.message}`);
  }
}

async function downloadSheetTemplate() {
  const type = sheetsHubState.activeType;
  const tmplUrl = `${API_BASE}/api/admin/template/csv?type=${type}`;
  const filename = `Sample_Template_${type.toUpperCase()}_Google_Sheets.csv`;

  showAdminToast(`📥 Downloading empty ${type} template...`);

  try {
    const res = await fetch(tmplUrl);
    if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);
  } catch (err) {
    window.open(tmplUrl, '_blank');
  }
}

async function executeSheetImport() {
  const type = sheetsHubState.activeType;
  const modeSelect = document.getElementById('sheetImportModeSelect');
  const distSelect = document.getElementById('sheetImportDistrictSelect');
  const mode = modeSelect ? modeSelect.value : 'merge';
  const district = distSelect ? distSelect.value : (adminState.selectedDistrict || 'All');
  const method = sheetsHubState.importMethod;
  const pin = adminState.pin || localStorage.getItem('kolasib_admin_pin') || '';

  const btn = document.getElementById('btnExecuteImport');
  const resultCard = document.getElementById('sheetImportResult');
  if (resultCard) {
    resultCard.style.display = 'none';
    resultCard.className = 'sheet-result-card';
  }

  let payload = {
    type,
    mode,
    district,
    pin
  };

  if (method === 'url') {
    const urlInput = document.getElementById('sheetImportUrlInput');
    const rawUrl = urlInput ? urlInput.value.trim() : '';
    if (!rawUrl) {
      alert('Please enter a valid Google Sheets shared link.');
      if (urlInput) urlInput.focus();
      return;
    }
    payload.googleSheetUrl = rawUrl;
  } else if (method === 'text') {
    const textInput = document.getElementById('sheetImportTextInput');
    const rawText = textInput ? textInput.value.trim() : '';
    if (!rawText) {
      alert('Please paste CSV rows or copied spreadsheet data into the text box.');
      if (textInput) textInput.focus();
      return;
    }
    // If copied directly from spreadsheet (tab-separated), convert tabs to CSV format
    if (rawText.includes('\t') && !rawText.includes(',')) {
      payload.csvText = rawText.split('\n').map(line =>
        line.split('\t').map(cell => `"${cell.trim().replace(/"/g, '""')}"`).join(',')
      ).join('\n');
    } else {
      payload.csvText = rawText;
    }
  } else {
    const fileInput = document.getElementById('sheetImportFileInput');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please choose a .csv file to import.');
      return;
    }

    const file = fileInput.files[0];
    try {
      const csvContent = await readFileAsText(file);
      payload.csvText = csvContent;
    } catch (readErr) {
      alert(`Could not read file: ${readErr.message}`);
      return;
    }
  }

  // Visual loading feedback
  const originalBtnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching & Importing Google Sheet...`;

  try {
    const response = await fetch(`${API_BASE}/api/admin/import/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': pin
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showAdminToast(`✅ Google Sheet imported & pushed to phonebooks!`);
      if (resultCard) {
        resultCard.style.display = 'block';
        resultCard.className = 'sheet-result-card success';
        const s = result.stats || {};
        let statsHtml = '';
        if (type === 'offices') {
          statsHtml = `
            <div class="result-stats">
              <span><strong>Total Rows:</strong> ${s.totalRows || 0}</span>
              <span><strong>Offices Added:</strong> ${s.officesAdded || 0}</span>
              <span><strong>Offices Updated:</strong> ${s.officesUpdated || 0}</span>
              <span><strong>Staff Added:</strong> ${s.staffAdded || 0}</span>
              <span><strong>Staff Updated:</strong> ${s.staffUpdated || 0}</span>
            </div>
          `;
        } else {
          statsHtml = `
            <div class="result-stats">
              <span><strong>Total Rows:</strong> ${s.totalRows || 0}</span>
              <span><strong>Added:</strong> ${s.added || 0}</span>
              <span><strong>Updated:</strong> ${s.updated || 0}</span>
              <span><strong>Skipped:</strong> ${s.skipped || 0}</span>
            </div>
          `;
        }

        resultCard.innerHTML = `
          <h4><i class="fa-solid fa-circle-check"></i> Import Successful!</h4>
          <p>${escapeHtml(result.message)}</p>
          ${statsHtml}
          <div class="result-push-badge"><i class="fa-solid fa-bolt"></i> Live push sent to all citizen phonebooks!</div>
        `;
      }

      // Reload admin state
      fetchAdminData();
    } else {
      if (resultCard) {
        resultCard.style.display = 'block';
        resultCard.className = 'sheet-result-card error';
        resultCard.innerHTML = `
          <h4><i class="fa-solid fa-circle-exclamation"></i> Import Failed</h4>
          <p>${escapeHtml(result.error || 'Unknown error occurred while importing Google Sheet.')}</p>
        `;
      }
    }
  } catch (err) {
    if (resultCard) {
      resultCard.style.display = 'block';
      resultCard.className = 'sheet-result-card error';
      resultCard.innerHTML = `
        <h4><i class="fa-solid fa-circle-exclamation"></i> Network / Connection Error</h4>
        <p>${escapeHtml(err.message)}</p>
      `;
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnText;
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });
}

// -------------------------------------------------------------
// Admin Tab Navigation
// -------------------------------------------------------------
function switchAdminTab(tabId, btn) {
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.admin-nav-tabs .tab-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}

function showAdminToast(msg) {
  const toast = document.getElementById('adminToast');
  const msgEl = document.getElementById('adminToastMsg');
  msgEl.textContent = msg;
  toast.style.display = 'flex';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// -------------------------------------------------------------
// Emergency Contact Management (Add, Edit, Delete & Push)
// -------------------------------------------------------------
function renderAdminEmergency() {
  const container = document.getElementById('adminEmergencyList');
  if (!container) return;

  let list = [...adminState.emergency];

  if (adminState.selectedDistrict && adminState.selectedDistrict !== 'All') {
    list = list.filter(e => (e.district || 'Kolasib').toLowerCase() === adminState.selectedDistrict.toLowerCase());
  }

  if (adminState.emergencySearch) {
    const q = adminState.emergencySearch;
    list = list.filter(e =>
      (e.service && e.service.toLowerCase().includes(q)) ||
      (e.officer && e.officer.toLowerCase().includes(q)) ||
      (e.phone && e.phone.includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.district && e.district.toLowerCase().includes(q)) ||
      (e.address && e.address.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No emergency contacts found matching search / active district filter.</div>`;
    return;
  }

  // Sort: Priority 1 first, then alphabetical by service
  list.sort((a, b) => {
    if (a.priority !== b.priority) return (a.priority || 2) - (b.priority || 2);
    return a.service.localeCompare(b.service);
  });

  const html = list.map(em => `
    <div class="admin-contact-card admin-emergency-card" id="admin-em-${em.id}">
      <div class="admin-card-header">
        <div>
          <div style="display:flex; align-items:center; gap:6px;">
            <h4 class="admin-card-title">${escapeHtml(em.service)}</h4>
            <span class="district-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(em.district || 'Kolasib')}</span>
            ${em.priority === 1 ? `<span class="em-p1-tag"><i class="fa-solid fa-triangle-exclamation"></i> PRIORITY 1</span>` : ''}
          </div>
          <span class="admin-card-subtitle">${escapeHtml(em.officer || 'Emergency In-Charge')}</span>
        </div>
        <span class="admin-card-village" style="background:rgba(239,68,68,0.15); color:#f87171;">
          <i class="fa-solid fa-tag"></i> ${escapeHtml(em.category || 'Emergency')}
        </span>
      </div>

      <div class="admin-card-phone">
        <i class="fa-solid fa-phone" style="color:#ef4444;"></i>
        <strong style="color:#ef4444;">${escapeHtml(em.phone)}</strong>
        ${em.altPhone ? `<span style="color:#64748b; margin-left:6px;">(${escapeHtml(em.altPhone)})</span>` : ''}
        ${em.address ? `<span style="margin-left:auto; font-size:12px; color:#94a3b8;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(em.address)}</span>` : ''}
      </div>

      <div class="admin-card-actions">
        <button class="btn-card-edit" style="border-color:#ef4444; color:#f87171;" onclick="openEditEmergencyModal('${em.id}')">
          <i class="fa-solid fa-pen-to-square"></i> Edit &amp; Push Update
        </button>
        <button class="btn-card-del" onclick="deleteEmergencyConfirm('${em.id}', '${escapeHtml(em.service)}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

function openEditEmergencyModal(emId) {
  const em = adminState.emergency.find(e => e.id === emId);
  if (!em) return;

  document.getElementById('editEmId').value = em.id;
  document.getElementById('editEmService').value = em.service || '';
  document.getElementById('editEmOfficer').value = em.officer || '';
  document.getElementById('editEmPhone').value = em.phone || '';
  document.getElementById('editEmAltPhone').value = em.altPhone || '';
  document.getElementById('editEmCategory').value = em.category || 'Health & Medical';
  document.getElementById('editEmPriority').value = em.priority || '2';
  const editEmDistEl = document.getElementById('editEmDistrict');
  if (editEmDistEl) editEmDistEl.value = em.district || 'Kolasib';
  document.getElementById('editEmAddress').value = em.address || '';

  document.getElementById('editEmergencyModal').style.display = 'flex';
}

function closeEditEmergencyModal() {
  document.getElementById('editEmergencyModal').style.display = 'none';
}

async function saveEmergencyChanges(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveEmPush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pushing Update...`;

  const emId = document.getElementById('editEmId').value;
  const updates = {
    service: document.getElementById('editEmService').value.trim(),
    officer: document.getElementById('editEmOfficer').value.trim(),
    phone: document.getElementById('editEmPhone').value.trim(),
    altPhone: document.getElementById('editEmAltPhone').value.trim(),
    category: document.getElementById('editEmCategory').value,
    priority: parseInt(document.getElementById('editEmPriority').value) || 2,
    district: document.getElementById('editEmDistrict') ? document.getElementById('editEmDistrict').value : 'Kolasib',
    address: document.getElementById('editEmAddress').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/emergency/${emId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(updates)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🚨 Emergency update pushed to all active Phonebooks!`);
      closeEditEmergencyModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to save emergency changes.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Save &amp; Push Update`;
  }
}

function openAddEmergencyModal() {
  document.getElementById('addEmService').value = '';
  document.getElementById('addEmOfficer').value = '';
  document.getElementById('addEmPhone').value = '';
  document.getElementById('addEmAltPhone').value = '';
  document.getElementById('addEmAddress').value = '';
  const addEmDistEl = document.getElementById('addEmDistrict');
  if (addEmDistEl) {
    addEmDistEl.value = adminState.selectedDistrict !== 'All' ? adminState.selectedDistrict : 'Kolasib';
  }
  document.getElementById('addEmergencyModal').style.display = 'flex';
}

function closeAddEmergencyModal() {
  document.getElementById('addEmergencyModal').style.display = 'none';
}

async function submitNewEmergency(e) {
  e.preventDefault();
  const btn = document.getElementById('btnAddEmPush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pushing...`;

  const payload = {
    service: document.getElementById('addEmService').value.trim(),
    officer: document.getElementById('addEmOfficer').value.trim(),
    phone: document.getElementById('addEmPhone').value.trim(),
    altPhone: document.getElementById('addEmAltPhone').value.trim(),
    category: document.getElementById('addEmCategory').value,
    priority: parseInt(document.getElementById('addEmPriority').value) || 2,
    district: document.getElementById('addEmDistrict') ? document.getElementById('addEmDistrict').value : 'Kolasib',
    address: document.getElementById('addEmAddress').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/emergency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🚨 New emergency service added & pushed to all Phonebooks!`);
      closeAddEmergencyModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to add emergency service.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Add &amp; Push to Phonebooks`;
  }
}

async function deleteEmergencyConfirm(emId, service) {
  if (!confirm(`Are you sure you want to delete ${service}? This will remove it from all citizen Phonebook apps in real-time.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/emergency/${emId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-PIN': adminState.pin }
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🗑️ Emergency contact removed from Phonebooks!`);
      fetchAdminData();
    } else {
      alert(`Delete error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to delete emergency contact.');
  }
}

// -------------------------------------------------------------
// Government Offices & Staff Management
// -------------------------------------------------------------
function renderAdminOffices() {
  const container = document.getElementById('adminOfficesList');
  if (!container) return;

  let list = [...adminState.offices];

  if (adminState.selectedDistrict && adminState.selectedDistrict !== 'All') {
    list = list.filter(o => (o.district || 'Kolasib').toLowerCase() === adminState.selectedDistrict.toLowerCase());
  }

  if (adminState.officeSearch) {
    const q = adminState.officeSearch;
    list = list.filter(o =>
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.department && o.department.toLowerCase().includes(q)) ||
      (o.category && o.category.toLowerCase().includes(q)) ||
      (o.district && o.district.toLowerCase().includes(q)) ||
      (o.address && o.address.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q)) ||
      (o.staff && o.staff.some(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      ))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No government offices found matching search / active district filter.</div>`;
    return;
  }

  const html = list.map(off => {
    const staffList = off.staff || [];

    const staffHtml = staffList.length === 0 ? `
      <div style="font-size:0.75rem; color:#64748b; padding:8px 0; font-style:italic;">
        No staff members added yet. Click "+ Add Staff" above to add officers.
      </div>
    ` : staffList.map(stf => `
      <div class="admin-staff-row">
        <div class="admin-staff-info">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="color:#ffffff; font-size:0.88rem;">${escapeHtml(stf.name)}</strong>
            <span style="font-size:0.72rem; color:#38bdf8; background:rgba(2,132,199,0.15); padding:1px 6px; border-radius:4px;">${escapeHtml(stf.designation)}</span>
          </div>
          <div style="font-size:0.8rem; color:#cbd5e1; margin-top:2px;">
            <i class="fa-solid fa-phone" style="color:#38bdf8; font-size:0.75rem;"></i>
            <strong>${escapeHtml(stf.phone)}</strong>
            ${stf.altPhone ? `<span style="color:#64748b; margin-left:6px;">(${escapeHtml(stf.altPhone)})</span>` : ''}
            ${stf.email ? `<span style="color:#94a3b8; margin-left:8px; font-size:0.75rem;"><i class="fa-solid fa-envelope"></i> ${escapeHtml(stf.email)}</span>` : ''}
          </div>
        </div>

        <div style="display:flex; gap:4px;">
          <button class="btn-sm btn-secondary" onclick="openEditStaffModal('${off.id}', '${stf.id}')" title="Edit Staff">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-sm btn-secondary" style="color:#f87171;" onclick="deleteStaffConfirm('${off.id}', '${stf.id}', '${escapeHtml(stf.name)}')" title="Remove Staff">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    return `
      <div class="admin-contact-card admin-office-card" id="admin-off-${off.id}">
        <div class="admin-card-header">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <h4 class="admin-card-title">${escapeHtml(off.name)}</h4>
              <span class="district-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(off.district || 'Kolasib')}</span>
            </div>
            <span class="admin-card-subtitle" style="color:#38bdf8;">${escapeHtml(off.department || 'General Administration')}</span>
          </div>
          <span class="admin-card-village" style="background:rgba(2,132,199,0.15); color:#7dd3fc;">
            <i class="fa-solid fa-tag"></i> ${escapeHtml(off.category || 'Administration')}
          </span>
        </div>

        <div class="admin-card-phone" style="flex-wrap:wrap; font-size:0.82rem;">
          ${off.phone ? `<span><i class="fa-solid fa-phone" style="color:#38bdf8;"></i> Main: <strong>${escapeHtml(off.phone)}</strong></span>` : ''}
          ${off.email ? `<span style="margin-left:12px; color:#94a3b8;"><i class="fa-solid fa-envelope"></i> ${escapeHtml(off.email)}</span>` : ''}
          ${off.address ? `<span style="margin-left:auto; color:#94a3b8;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(off.address)}</span>` : ''}
        </div>

        <div class="admin-card-actions" style="margin-bottom:8px;">
          <button class="btn btn-sm" style="background:#0284c7; color:#ffffff; font-weight:600;" onclick="openAddStaffModal('${off.id}', '${escapeHtml(off.name)}')">
            <i class="fa-solid fa-user-plus"></i> Add Staff
          </button>
          <button class="btn-card-edit" onclick="openEditOfficeModal('${off.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit Office
          </button>
          <button class="btn-card-del" onclick="deleteOfficeConfirm('${off.id}', '${escapeHtml(off.name)}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>

        <!-- Office Staff Contact List -->
        <div class="admin-office-staff-section">
          <div class="admin-office-staff-header">
            <span><i class="fa-solid fa-users" style="color:#38bdf8;"></i> Office Staff Contact List (${staffList.length})</span>
          </div>
          <div class="admin-staff-list">
            ${staffHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function openAddOfficeModal() {
  document.getElementById('addOffName').value = '';
  document.getElementById('addOffDept').value = '';
  document.getElementById('addOffPhone').value = '';
  document.getElementById('addOffEmail').value = '';
  document.getElementById('addOffAddr').value = '';
  const addOffDistEl = document.getElementById('addOffDistrict');
  if (addOffDistEl) {
    addOffDistEl.value = adminState.selectedDistrict !== 'All' ? adminState.selectedDistrict : 'Kolasib';
  }
  document.getElementById('addOfficeModal').style.display = 'flex';
}

function closeAddOfficeModal() {
  document.getElementById('addOfficeModal').style.display = 'none';
}

async function submitNewOffice(e) {
  e.preventDefault();
  const btn = document.getElementById('btnAddOffPush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pushing...`;

  const payload = {
    name: document.getElementById('addOffName').value.trim(),
    department: document.getElementById('addOffDept').value.trim(),
    category: document.getElementById('addOffCat').value,
    phone: document.getElementById('addOffPhone').value.trim(),
    email: document.getElementById('addOffEmail').value.trim(),
    address: document.getElementById('addOffAddr').value.trim(),
    district: document.getElementById('addOffDistrict') ? document.getElementById('addOffDistrict').value : 'Kolasib',
    staff: []
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/offices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🏛️ Office added & pushed to all Phonebooks!`);
      closeAddOfficeModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to add office.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Add Office &amp; Push`;
  }
}

function openEditOfficeModal(officeId) {
  const off = adminState.offices.find(o => o.id === officeId);
  if (!off) return;

  document.getElementById('editOffId').value = off.id;
  document.getElementById('editOffName').value = off.name || '';
  document.getElementById('editOffDept').value = off.department || '';
  document.getElementById('editOffCat').value = off.category || 'Administration';
  document.getElementById('editOffPhone').value = off.phone || '';
  document.getElementById('editOffEmail').value = off.email || '';
  document.getElementById('editOffAddr').value = off.address || '';
  const editOffDistEl = document.getElementById('editOffDistrict');
  if (editOffDistEl) editOffDistEl.value = off.district || 'Kolasib';

  document.getElementById('editOfficeModal').style.display = 'flex';
}

function closeEditOfficeModal() {
  document.getElementById('editOfficeModal').style.display = 'none';
}

async function saveOfficeChanges(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveOffPush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pushing...`;

  const officeId = document.getElementById('editOffId').value;
  const updates = {
    name: document.getElementById('editOffName').value.trim(),
    department: document.getElementById('editOffDept').value.trim(),
    category: document.getElementById('editOffCat').value,
    phone: document.getElementById('editOffPhone').value.trim(),
    email: document.getElementById('editOffEmail').value.trim(),
    address: document.getElementById('editOffAddr').value.trim(),
    district: document.getElementById('editOffDistrict') ? document.getElementById('editOffDistrict').value : 'Kolasib'
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/offices/${officeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(updates)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🏛️ Office updated & pushed to Phonebooks!`);
      closeEditOfficeModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to update office.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Save &amp; Push Update`;
  }
}

async function deleteOfficeConfirm(officeId, name) {
  if (!confirm(`Are you sure you want to delete ${name}? This will remove the office and all its staff members from all Phonebook apps in real-time.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/offices/${officeId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-PIN': adminState.pin }
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🗑️ Office removed from Phonebooks!`);
      fetchAdminData();
    } else {
      alert(`Delete error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to delete office.');
  }
}

// -------------------------------------------------------------
// Office Staff Management
// -------------------------------------------------------------
function openAddStaffModal(officeId, officeName) {
  document.getElementById('addStaffOfficeId').value = officeId;
  document.getElementById('addStaffOfficeTitle').textContent = officeName;
  document.getElementById('addStaffName').value = '';
  document.getElementById('addStaffDesignation').value = '';
  document.getElementById('addStaffPhone').value = '';
  document.getElementById('addStaffAltPhone').value = '';
  document.getElementById('addStaffEmail').value = '';

  document.getElementById('addStaffModal').style.display = 'flex';
}

function closeAddStaffModal() {
  document.getElementById('addStaffModal').style.display = 'none';
}

async function submitNewStaff(e) {
  e.preventDefault();
  const btn = document.getElementById('btnAddStaffPush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pushing...`;

  const officeId = document.getElementById('addStaffOfficeId').value;
  const payload = {
    name: document.getElementById('addStaffName').value.trim(),
    designation: document.getElementById('addStaffDesignation').value.trim(),
    phone: document.getElementById('addStaffPhone').value.trim(),
    altPhone: document.getElementById('addStaffAltPhone').value.trim(),
    email: document.getElementById('addStaffEmail').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/offices/${officeId}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`👥 Staff added & pushed to all Phonebooks!`);
      closeAddStaffModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to add staff member.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Add Staff &amp; Push`;
  }
}

function openEditStaffModal(officeId, staffId) {
  const off = adminState.offices.find(o => o.id === officeId);
  if (!off || !off.staff) return;

  const stf = off.staff.find(s => s.id === staffId);
  if (!stf) return;

  document.getElementById('editStaffOfficeId').value = officeId;
  document.getElementById('editStaffId').value = staffId;
  document.getElementById('editStaffName').value = stf.name || '';
  document.getElementById('editStaffDesignation').value = stf.designation || '';
  document.getElementById('editStaffPhone').value = stf.phone || '';
  document.getElementById('editStaffAltPhone').value = stf.altPhone || '';
  document.getElementById('editStaffEmail').value = stf.email || '';

  document.getElementById('editStaffModal').style.display = 'flex';
}

function closeEditStaffModal() {
  document.getElementById('editStaffModal').style.display = 'none';
}

async function saveStaffChanges(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveStaffPush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Pushing...`;

  const officeId = document.getElementById('editStaffOfficeId').value;
  const staffId = document.getElementById('editStaffId').value;

  const updates = {
    name: document.getElementById('editStaffName').value.trim(),
    designation: document.getElementById('editStaffDesignation').value.trim(),
    phone: document.getElementById('editStaffPhone').value.trim(),
    altPhone: document.getElementById('editStaffAltPhone').value.trim(),
    email: document.getElementById('editStaffEmail').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/offices/${officeId}/staff/${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(updates)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`👥 Staff updated & pushed in real-time!`);
      closeEditStaffModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to update staff member.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Save &amp; Push Update`;
  }
}

async function deleteStaffConfirm(officeId, staffId, staffName) {
  if (!confirm(`Are you sure you want to remove ${staffName} from this office? This will update all citizen Phonebooks immediately.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/offices/${officeId}/staff/${staffId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-PIN': adminState.pin }
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🗑️ Staff member removed & synced!`);
      fetchAdminData();
    } else {
      alert(`Delete error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to delete staff member.');
  }
}

// -------------------------------------------------------------
// Village & Local Councils Management
// -------------------------------------------------------------
function renderAdminCouncils() {
  const container = document.getElementById('adminCouncilsList');
  if (!container) return;

  let list = [...adminState.villages];

  if (adminState.selectedDistrict && adminState.selectedDistrict !== 'All') {
    list = list.filter(v => (v.district || 'Kolasib').toLowerCase() === adminState.selectedDistrict.toLowerCase());
  }

  if (adminState.councilTypeFilter && adminState.councilTypeFilter !== 'All') {
    list = list.filter(v => (v.type || 'Village Council').toLowerCase().includes(adminState.councilTypeFilter.toLowerCase()));
  }

  if (adminState.councilSearch) {
    const q = adminState.councilSearch;
    list = list.filter(v =>
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.district && v.district.toLowerCase().includes(q)) ||
      (v.address && v.address.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:#94a3b8;">No Village/Local Councils found matching filter / search.</div>`;
    return;
  }

  // Sort alphabetically by council name
  list.sort((a, b) => a.name.localeCompare(b.name));

  const html = list.map(v => {
    const memberCount = adminState.contacts.filter(c => c.villageName && c.villageName.toLowerCase() === v.name.toLowerCase()).length;
    const isLC = v.type === 'Local Council' || v.name.toLowerCase().includes('local') || v.district === 'Aizawl';

    return `
      <div class="admin-contact-card" id="admin-council-${v.id}">
        <div class="admin-card-header">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <h4 class="admin-card-title">${escapeHtml(v.name)}</h4>
              <span class="district-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(v.district || 'Kolasib')}</span>
              <span style="font-size:0.72rem; padding:2px 6px; border-radius:4px; font-weight:600; background:${isLC ? 'rgba(56,189,248,0.15)' : 'rgba(16,185,129,0.15)'}; color:${isLC ? '#38bdf8' : '#34d399'};">
                ${isLC ? 'LC (Urban)' : 'VC (Rural/Town)'}
              </span>
            </div>
            <span class="admin-card-subtitle" style="color:#94a3b8;">
              <i class="fa-solid fa-layer-group"></i> ${escapeHtml(v.category || 'Town Area')} • ${v.address ? escapeHtml(v.address) : 'Local Office'}
            </span>
          </div>
          <span class="admin-card-village" style="background:rgba(255,255,255,0.06); color:#cbd5e1;">
            <i class="fa-solid fa-users"></i> ${memberCount} Registered Members
          </span>
        </div>

        <div class="admin-card-actions" style="margin-top:10px;">
          <button class="btn btn-sm btn-secondary" onclick="viewCouncilMembers('${escapeHtml(v.name)}')">
            <i class="fa-solid fa-users-viewfinder"></i> View Members (${memberCount})
          </button>
          <button class="btn-card-del" onclick="deleteCouncilConfirm('${v.id}')">
            <i class="fa-solid fa-trash-can"></i> Remove Council
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function viewCouncilMembers(villageName) {
  switchAdminTab('tabContacts', document.querySelector('.admin-nav-tabs .tab-btn:first-child'));
  const searchInput = document.getElementById('adminSearchInput');
  if (searchInput) {
    searchInput.value = villageName;
    adminState.searchQuery = villageName.toLowerCase();
    renderAdminContacts();
  }
}

function openAddCouncilModal() {
  document.getElementById('addCouncilName').value = '';
  document.getElementById('addCouncilAddress').value = '';
  const addDistEl = document.getElementById('addCouncilDistrict');
  if (addDistEl) {
    addDistEl.value = adminState.selectedDistrict !== 'All' ? adminState.selectedDistrict : 'Kolasib';
  }
  document.getElementById('addCouncilModal').style.display = 'flex';
}

function closeAddCouncilModal() {
  document.getElementById('addCouncilModal').style.display = 'none';
}

async function submitNewCouncil(e) {
  e.preventDefault();
  const btn = document.getElementById('btnAddCouncilPush');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Adding...`;

  const payload = {
    name: document.getElementById('addCouncilName').value.trim(),
    type: document.getElementById('addCouncilType').value,
    district: document.getElementById('addCouncilDistrict').value,
    category: document.getElementById('addCouncilCategory').value,
    address: document.getElementById('addCouncilAddress').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/villages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🏛️ Council added & synced to all Phonebooks!`);
      closeAddCouncilModal();
      fetchAdminData();
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to add council.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Add Council &amp; Push`;
  }
}

async function deleteCouncilConfirm(villageId, villageName) {
  const target = adminState.villages.find(v => v.id === villageId);
  const nameToDisplay = villageName || (target ? target.name : 'this Council');
  if (!confirm(`Are you sure you want to remove ${nameToDisplay}? This will remove the council and all its contacts from directory listings in real-time.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/villages/${villageId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-PIN': adminState.pin }
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`🗑️ Council removed from directory!`);
      fetchAdminData();
    } else {
      alert(`Delete error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to delete council.');
  }
}

// -------------------------------------------------------------
// Developer Information Settings
// -------------------------------------------------------------
function populateDeveloperInfoForm() {
  if (!adminState.appInfo) return;
  const nameInput = document.getElementById('devNameInput');
  const emailInput = document.getElementById('devEmailInput');
  const phoneInput = document.getElementById('devPhoneInput');

  if (nameInput && adminState.appInfo.developerName) {
    nameInput.value = adminState.appInfo.developerName;
  }
  if (emailInput && adminState.appInfo.developerEmail) {
    emailInput.value = adminState.appInfo.developerEmail;
  }
  if (phoneInput && adminState.appInfo.supportPhone) {
    phoneInput.value = adminState.appInfo.supportPhone;
  }
}

async function saveDeveloperInfo(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveAppInfo');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  const payload = {
    developerName: document.getElementById('devNameInput').value.trim(),
    developerEmail: document.getElementById('devEmailInput').value.trim(),
    supportPhone: document.getElementById('devPhoneInput').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/app-info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-PIN': adminState.pin
      },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      showAdminToast(`ℹ️ Developer info updated & pushed to Phonebooks!`);
      adminState.appInfo = res.data;
    } else {
      alert(`Error: ${res.error}`);
    }
  } catch (err) {
    alert('Failed to save developer information.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Save &amp; Push Developer Info`;
  }
}


