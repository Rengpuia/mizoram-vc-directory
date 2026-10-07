// Mizoram VC Phonebook - Client Application Logic (Multi-District Support)
// Features: Multi-District switcher, Real-time SSE updates, Offline Caching, Touch Calling, WhatsApp, Error Reporting

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

let state = {
  currentDistrict: localStorage.getItem('kolasib_selected_district') || 'Kolasib',
  districts: [],
  contacts: [],
  emergency: [],
  villages: [],
  offices: [],
  broadcasts: [],
  filteredContacts: [],
  filteredOffices: [],
  currentCategory: 'All',
  currentRole: 'All',
  currentOfficeCategory: 'All',
  searchQuery: '',
  officeSearchQuery: '',
  reportingEmergency: false,
  reportingOffice: false,
  reportedOfficeId: null,
  appInfo: null,
  isOnline: navigator.onLine,
  eventSource: null,
  activeToastTimer: null
};

// Native System Notification Bridge (Notifies directly to Android Phone Notification Bar)
function triggerPhoneNotification(title, message, tag) {
  if (window.AndroidApp && typeof window.AndroidApp.showSystemNotification === 'function') {
    window.AndroidApp.showSystemNotification(title, message, tag || 'mizoram_vc_notice');
  } else if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: 'icon-192.png',
          badge: 'icon-192.png',
          tag: tag || 'mizoram_vc_notice'
        });
      } catch (e) {}
    } else if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

function requestSystemNotificationPermission() {
  if (window.AndroidApp && typeof window.AndroidApp.requestNotificationPermission === 'function') {
    window.AndroidApp.requestNotificationPermission();
  } else if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initNetworkListeners();
  loadCachedData();
  updateDistrictUI();
  updateAppInfoUI();
  fetchFreshData();
  setupEventListeners();
  initSSEPushListener();
  requestSystemNotificationPermission();
});

// -------------------------------------------------------------
// Offline Caching & Data Hydration
// -------------------------------------------------------------
function loadCachedData() {
  const distKey = state.currentDistrict;
  const cachedContacts = localStorage.getItem(`kolasib_contacts_${distKey}`) || localStorage.getItem('kolasib_contacts');
  const cachedEmergency = localStorage.getItem(`kolasib_emergency_${distKey}`) || localStorage.getItem('kolasib_emergency');
  const cachedVillages = localStorage.getItem(`kolasib_villages_${distKey}`) || localStorage.getItem('kolasib_villages');
  const cachedOffices = localStorage.getItem(`kolasib_offices_${distKey}`) || localStorage.getItem('kolasib_offices');
  const cachedBroadcasts = localStorage.getItem(`kolasib_broadcasts_${distKey}`) || localStorage.getItem('kolasib_broadcasts');
  const cachedBroadcast = localStorage.getItem(`kolasib_broadcast_${distKey}`) || localStorage.getItem('kolasib_broadcast');
  const cachedDistricts = localStorage.getItem('mizoram_districts');
  const cachedAppInfo = localStorage.getItem('kolasib_app_info');

  if (cachedBroadcasts) {
    try {
      state.broadcasts = JSON.parse(cachedBroadcasts);
      updateNotificationBadge();
    } catch (e) {}
  }

  if (cachedAppInfo) {
    try {
      state.appInfo = JSON.parse(cachedAppInfo);
      updateAppInfoUI();
    } catch (e) {}
  }

  if (cachedDistricts) {
    try {
      state.districts = JSON.parse(cachedDistricts);
    } catch (e) {}
  }

  if (cachedContacts) {
    try {
      state.contacts = JSON.parse(cachedContacts);
      updateSyncBadge(true, 'Cached Data Loaded');
      updateCategoryChips();
      applyFilters();
    } catch (e) {
      console.warn('Cache parse failed', e);
    }
  }

  if (cachedEmergency) {
    try {
      state.emergency = JSON.parse(cachedEmergency);
      renderEmergency();
    } catch (e) {}
  }

  if (cachedVillages) {
    try {
      state.villages = JSON.parse(cachedVillages);
      renderVillages();
    } catch (e) {}
  }

  if (cachedOffices) {
    try {
      state.offices = JSON.parse(cachedOffices);
      applyOfficeFilters();
    } catch (e) {}
  }

  if (cachedBroadcast) {
    try {
      showBroadcast(JSON.parse(cachedBroadcast));
    } catch (e) {}
  }
}

function saveToCache() {
  const distKey = state.currentDistrict;
  localStorage.setItem(`kolasib_contacts_${distKey}`, JSON.stringify(state.contacts));
  localStorage.setItem(`kolasib_emergency_${distKey}`, JSON.stringify(state.emergency));
  localStorage.setItem(`kolasib_villages_${distKey}`, JSON.stringify(state.villages));
  localStorage.setItem(`kolasib_offices_${distKey}`, JSON.stringify(state.offices));
  if (state.broadcasts) {
    localStorage.setItem(`kolasib_broadcasts_${distKey}`, JSON.stringify(state.broadcasts));
  }
  if (state.districts && state.districts.length > 0) {
    localStorage.setItem('mizoram_districts', JSON.stringify(state.districts));
  }
  if (state.appInfo) {
    localStorage.setItem('kolasib_app_info', JSON.stringify(state.appInfo));
  }
}

// -------------------------------------------------------------
// Network Fetching (District Aware)
// -------------------------------------------------------------
async function fetchFreshData() {
  try {
    const distKey = state.currentDistrict;
    updateSyncBadge(null, `Syncing ${distKey}...`);

    const distParam = encodeURIComponent(distKey);
    const [districtsRes, contactsRes, emergencyRes, villagesRes, officesRes, bcastRes, appInfoRes] = await Promise.all([
      fetch(`${API_BASE}/api/districts`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API_BASE}/api/contacts?district=${distParam}`).then(r => r.json()),
      fetch(`${API_BASE}/api/emergency?district=${distParam}`).then(r => r.json()),
      fetch(`${API_BASE}/api/villages?district=${distParam}`).then(r => r.json()),
      fetch(`${API_BASE}/api/offices?district=${distParam}`).then(r => r.json()),
      fetch(`${API_BASE}/api/broadcasts?district=${distParam}`).then(r => r.json()),
      fetch(`${API_BASE}/api/app-info`).then(r => r.json()).catch(() => ({ success: false }))
    ]);

    if (districtsRes && districtsRes.success && districtsRes.data) {
      state.districts = districtsRes.data;
    }

    if (contactsRes.success && contactsRes.data) {
      state.contacts = contactsRes.data;
      updateCategoryChips();
      applyFilters();
    }

    if (emergencyRes.success && emergencyRes.data) {
      state.emergency = emergencyRes.data;
      renderEmergency();
    }

    if (villagesRes.success && villagesRes.data) {
      state.villages = villagesRes.data;
      renderVillages();
    }

    if (officesRes.success && officesRes.data) {
      state.offices = officesRes.data;
      applyOfficeFilters();
    }

    if (bcastRes.success && bcastRes.data) {
      state.broadcasts = bcastRes.data;
      localStorage.setItem(`kolasib_broadcasts_${distKey}`, JSON.stringify(state.broadcasts));
      updateNotificationBadge();
      if (state.broadcasts.length > 0) {
        showBroadcast(state.broadcasts[0]);
        const lastNotified = localStorage.getItem('kolasib_last_notified_bcast');
        if (!lastNotified || lastNotified !== state.broadcasts[0].id) {
          localStorage.setItem('kolasib_last_notified_bcast', state.broadcasts[0].id);
          triggerPhoneNotification(state.broadcasts[0].title || 'Government Announcement', state.broadcasts[0].message, 'bcast_' + state.broadcasts[0].id);
        }
      } else {
        dismissBroadcast();
      }
    }

    if (appInfoRes && appInfoRes.success && appInfoRes.data) {
      state.appInfo = appInfoRes.data;
      updateAppInfoUI();
    }

    saveToCache();
    updateDistrictUI();
    updateSyncBadge(true, `Live Sync: ${state.currentDistrict}`);
  } catch (err) {
    console.warn('Network sync failed, running in offline mode:', err);
    updateSyncBadge(false, 'Offline (Cached Mode)');
  }
}

function updateAppInfoUI() {
  if (!state.appInfo) return;
  const nameEl = document.getElementById('devNameDisplay');
  const emailEl = document.getElementById('devEmailDisplay');
  const emailLink = document.getElementById('devEmailLink');

  if (nameEl && state.appInfo.developerName) {
    nameEl.textContent = state.appInfo.developerName;
  }
  if (emailEl && state.appInfo.developerEmail) {
    emailEl.textContent = state.appInfo.developerEmail;
  }
  if (emailLink && state.appInfo.developerEmail) {
    emailLink.href = `mailto:${state.appInfo.developerEmail}`;
  }
}

// -------------------------------------------------------------
// Multi-District Management Functions
// -------------------------------------------------------------
function updateDistrictUI() {
  const distTextEl = document.getElementById('currentDistrictText');
  if (distTextEl) distTextEl.textContent = state.currentDistrict;

  const appTitleEl = document.getElementById('appTitle');
  if (appTitleEl) appTitleEl.textContent = `${state.currentDistrict} VC Phonebook`;

  const appSubEl = document.getElementById('appSubtitle');
  if (appSubEl) appSubEl.textContent = `Village Council Directory • ${state.currentDistrict}, Mizoram`;

  const emTitleEl = document.getElementById('emergencyDistrictTitle');
  if (emTitleEl) emTitleEl.textContent = `${state.currentDistrict} District Emergency Services`;

  const villTitleEl = document.getElementById('villagesDistrictTitle');
  if (villTitleEl) villTitleEl.innerHTML = `<i class="fa-solid fa-city"></i> ${state.currentDistrict} Village Councils (${state.villages.length})`;
}

function updateCategoryChips() {
  const container = document.getElementById('categoryChips');
  if (!container) return;

  const uniqueCats = Array.from(new Set(state.contacts.map(c => c.category).filter(Boolean)));
  let html = `<button class="chip ${state.currentCategory === 'All' ? 'active' : ''}" data-cat="All">All VCs</button>`;
  uniqueCats.forEach(cat => {
    html += `<button class="chip ${state.currentCategory === cat ? 'active' : ''}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
  });
  container.innerHTML = html;

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentCategory = chip.getAttribute('data-cat');
      applyFilters();
    });
  });
}

const DEFAULT_MIZORAM_DISTRICTS = [
  { name: 'Kolasib', headquarter: 'Kolasib', totalVCs: 48 },
  { name: 'Aizawl', headquarter: 'Aizawl', totalVCs: 85 },
  { name: 'Lunglei', headquarter: 'Lunglei', totalVCs: 64 },
  { name: 'Champhai', headquarter: 'Champhai', totalVCs: 48 },
  { name: 'Mamit', headquarter: 'Mamit', totalVCs: 52 },
  { name: 'Serchhip', headquarter: 'Serchhip', totalVCs: 38 },
  { name: 'Saitual', headquarter: 'Saitual', totalVCs: 32 },
  { name: 'Khawzawl', headquarter: 'Khawzawl', totalVCs: 28 },
  { name: 'Hnahthial', headquarter: 'Hnahthial', totalVCs: 26 },
  { name: 'Lawngtlai', headquarter: 'Lawngtlai', totalVCs: 55 },
  { name: 'Siaha', headquarter: 'Siaha', totalVCs: 42 }
];

function openDistrictModal() {
  const modal = document.getElementById('districtModal');
  if (!modal) return;
  renderDistrictModalList();
  modal.style.display = 'flex';
}

function closeDistrictModal() {
  const modal = document.getElementById('districtModal');
  if (modal) modal.style.display = 'none';
}

function renderDistrictModalList() {
  const container = document.getElementById('districtListContainer');
  if (!container) return;

  const list = state.districts && state.districts.length > 0 ? state.districts : DEFAULT_MIZORAM_DISTRICTS;
  const html = list.map(d => {
    const isSelected = d.name.toLowerCase() === state.currentDistrict.toLowerCase();
    return `
      <button class="district-card-btn ${isSelected ? 'active' : ''}" onclick="selectDistrict('${escapeHtml(d.name)}')">
        <span class="d-name">
          <i class="fa-solid fa-location-dot" style="color: ${isSelected ? 'var(--primary)' : '#94a3b8'}; font-size:12px;"></i>
          ${escapeHtml(d.name)}
        </span>
        <span class="d-hq">HQ: ${escapeHtml(d.headquarter || d.name)}</span>
      </button>
    `;
  }).join('');
  container.innerHTML = html;
}

function selectDistrict(districtName) {
  if (state.currentDistrict.toLowerCase() === districtName.toLowerCase()) {
    closeDistrictModal();
    return;
  }
  state.currentDistrict = districtName;
  localStorage.setItem('kolasib_selected_district', districtName);
  state.currentCategory = 'All';
  state.currentRole = 'All';
  document.getElementById('roleFilter').value = 'All';
  closeDistrictModal();
  updateDistrictUI();
  loadCachedData();
  fetchFreshData();
}

// -------------------------------------------------------------
// Real-Time Push Listener (Server-Sent Events)
// Admin App changes push here instantly!
// -------------------------------------------------------------
function initSSEPushListener() {
  if (state.eventSource) {
    state.eventSource.close();
  }

  try {
    const sse = new EventSource(`${API_BASE}/api/sync/events`);
    state.eventSource = sse;

    sse.addEventListener('connected', (e) => {
      updateSyncBadge(true, 'Live Connected');
    });

    sse.addEventListener('ping', () => {
      // heartbeat
    });

    // 1. Admin updated contact info (e.g. wrong number corrected)
    sse.addEventListener('contact_updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const updatedContact = payload.contact;
        if (!updatedContact) return;

        if (!updatedContact.district || updatedContact.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
          const idx = state.contacts.findIndex(c => c.id === updatedContact.id);
          if (idx !== -1) {
            state.contacts[idx] = updatedContact;
          } else {
            state.contacts.unshift(updatedContact);
          }

          saveToCache();
          applyFilters();
          showLiveToast(`✏️ Updated: ${updatedContact.name} (${updatedContact.villageName})`);
          highlightCard(updatedContact.id);
        }
      } catch (err) {
        console.error('Error handling contact_updated SSE:', err);
      }
    });

    // 2. Admin added a new contact
    sse.addEventListener('contact_added', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const newContact = payload.contact;
        if (!newContact) return;

        if (!newContact.district || newContact.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
          state.contacts.unshift(newContact);
          saveToCache();
          updateCategoryChips();
          applyFilters();
          showLiveToast(`🟢 New Contact: ${newContact.name} (${newContact.villageName})`);
          highlightCard(newContact.id);
        }
      } catch (err) {
        console.error('Error handling contact_added SSE:', err);
      }
    });

    // 3. Admin deleted a contact
    sse.addEventListener('contact_deleted', (e) => {
      try {
        const payload = JSON.parse(e.data);
        state.contacts = state.contacts.filter(c => c.id !== payload.id);
        saveToCache();
        applyFilters();
        showLiveToast(`🗑️ Contact removed by Admin`);
      } catch (err) {
        console.error('Error handling contact_deleted SSE:', err);
      }
    });

    // 4. District Broadcast announcement pushed by Admin
    sse.addEventListener('broadcast_received', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.broadcast) {
          const b = payload.broadcast;
          if (!b.district || b.district === 'All' || b.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
            state.broadcasts = state.broadcasts.filter(x => x.id !== b.id);
            state.broadcasts.unshift(b);
            localStorage.setItem(`kolasib_broadcasts_${state.currentDistrict}`, JSON.stringify(state.broadcasts));
            showBroadcast(b);
            updateNotificationBadge();
            renderNotificationHistory();
            showLiveToast(`📢 Notice: ${b.title}`);
            triggerPhoneNotification(b.title || 'Official Government Notice', b.message, 'bcast_' + b.id);
          }
        }
      } catch (err) {
        console.error('Error handling broadcast SSE:', err);
      }
    });

    // 4b. District Broadcast deleted by Admin
    sse.addEventListener('broadcast_deleted', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const delId = payload.id;
        state.broadcasts = state.broadcasts.filter(b => b.id !== delId);
        localStorage.setItem(`kolasib_broadcasts_${state.currentDistrict}`, JSON.stringify(state.broadcasts));
        updateNotificationBadge();
        renderNotificationHistory();

        // If currently displayed banner matches deleted broadcast, show next or dismiss
        const bannerTitle = document.getElementById('broadcastTitle');
        if (bannerTitle && payload.broadcast && bannerTitle.textContent === payload.broadcast.title) {
          if (state.broadcasts.length > 0) {
            showBroadcast(state.broadcasts[0]);
          } else {
            dismissBroadcast();
          }
        }
        showLiveToast(`🗑️ Notice removed by Admin`);
      } catch (err) {
        console.error('Error handling broadcast_deleted SSE:', err);
      }
    });

    // 5. Emergency contact updated by Admin
    sse.addEventListener('emergency_updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const updated = payload.emergency;
        if (!updated) return;

        if (!updated.district || updated.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
          const idx = state.emergency.findIndex(em => em.id === updated.id);
          if (idx !== -1) {
            state.emergency[idx] = updated;
          } else {
            state.emergency.push(updated);
          }

          saveToCache();
          renderEmergency();
          showLiveToast(`🚨 Emergency Updated: ${updated.service} (${formatPhone(updated.phone)})`);
        }
      } catch (err) {
        console.error('Error handling emergency_updated SSE:', err);
      }
    });

    // 6. Emergency contact added by Admin
    sse.addEventListener('emergency_added', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const newEm = payload.emergency;
        if (!newEm) return;

        if (!newEm.district || newEm.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
          state.emergency.push(newEm);
          saveToCache();
          renderEmergency();
          showLiveToast(`🚨 Emergency Added: ${newEm.service}`);
        }
      } catch (err) {
        console.error('Error handling emergency_added SSE:', err);
      }
    });

    // 7. Emergency contact deleted by Admin
    sse.addEventListener('emergency_deleted', (e) => {
      try {
        const payload = JSON.parse(e.data);
        state.emergency = state.emergency.filter(em => em.id !== payload.id);
        saveToCache();
        renderEmergency();
        showLiveToast(`🚨 Emergency Contact Removed`);
      } catch (err) {
        console.error('Error handling emergency_deleted SSE:', err);
      }
    });

    // 8. Office contact added by Admin
    sse.addEventListener('office_added', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.office) {
          const off = payload.office;
          if (!off.district || off.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
            state.offices.push(off);
            saveToCache();
            applyOfficeFilters();
            showLiveToast(`🏛️ Office Added: ${off.name}`);
          }
        }
      } catch (err) {
        console.error('Error handling office_added SSE:', err);
      }
    });

    // 9. Office or staff updated by Admin
    sse.addEventListener('office_updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.office) {
          const off = payload.office;
          if (!off.district || off.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
            const idx = state.offices.findIndex(o => o.id === off.id);
            if (idx !== -1) {
              state.offices[idx] = off;
            } else {
              state.offices.push(off);
            }
            saveToCache();
            applyOfficeFilters();
            showLiveToast(`🏛️ ${payload.message || 'Office directory updated'}`);
          }
        }
      } catch (err) {
        console.error('Error handling office_updated SSE:', err);
      }
    });

    // 10. Office deleted by Admin
    sse.addEventListener('office_deleted', (e) => {
      try {
        const payload = JSON.parse(e.data);
        state.offices = state.offices.filter(o => o.id !== payload.id);
        saveToCache();
        applyOfficeFilters();
        showLiveToast(`🏛️ Office removed by Admin`);
      } catch (err) {
        console.error('Error handling office_deleted SSE:', err);
      }
    });

    // 11. Village/Local Council added by Admin
    sse.addEventListener('village_added', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.village) {
          const v = payload.village;
          if (!v.district || v.district.toLowerCase() === state.currentDistrict.toLowerCase()) {
            state.villages.push(v);
            saveToCache();
            renderVillages();
            updateDistrictUI();
            showLiveToast(`🏛️ New Council Added: ${v.name}`);
          }
        }
      } catch (err) {
        console.error('Error handling village_added SSE:', err);
      }
    });

    // 12. Village/Local Council removed by Admin
    sse.addEventListener('village_deleted', (e) => {
      try {
        const payload = JSON.parse(e.data);
        const delId = payload.id;
        const delName = (payload.village && payload.village.name) ? payload.village.name : payload.name;

        // Remove from local villages list by ID and Name
        state.villages = state.villages.filter(v => 
          v.id !== delId && (!delName || (v.name && v.name.toLowerCase() !== delName.toLowerCase()))
        );

        // Remove associated contacts from state.contacts
        state.contacts = state.contacts.filter(c => 
          c.villageId !== delId && (!delName || (c.villageName && c.villageName.toLowerCase() !== delName.toLowerCase()))
        );

        saveToCache();
        updateCategoryChips();
        renderVillages();
        applyFilters();
        updateDistrictUI();
        showLiveToast(`🗑️ Council removed: ${delName || 'Council'}`);
      } catch (err) {
        console.error('Error handling village_deleted SSE:', err);
      }
    });

    // 13. Developer & App Information updated by Admin
    sse.addEventListener('app_info_updated', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.appInfo) {
          state.appInfo = payload.appInfo;
          localStorage.setItem('kolasib_app_info', JSON.stringify(state.appInfo));
          updateAppInfoUI();
          showLiveToast(`ℹ️ Developer info updated: ${payload.appInfo.developerName}`);
        }
      } catch (err) {
        console.error('Error handling app_info_updated SSE:', err);
      }
    });

    // 14. Google Sheets Imports
    sse.addEventListener('contacts_imported', (e) => {
      fetchFreshData();
      try {
        const payload = JSON.parse(e.data);
        showLiveToast(`📊 ${payload.message || 'VC Directory updated from Google Sheet'}`);
      } catch (err) {
        showLiveToast('📊 VC Directory updated from Google Sheet');
      }
    });

    sse.addEventListener('emergency_imported', (e) => {
      fetchFreshData();
      try {
        const payload = JSON.parse(e.data);
        showLiveToast(`🚨 ${payload.message || 'Emergency contacts updated from Google Sheet'}`);
      } catch (err) {
        showLiveToast('🚨 Emergency contacts updated from Google Sheet');
      }
    });

    sse.addEventListener('offices_imported', (e) => {
      fetchFreshData();
      try {
        const payload = JSON.parse(e.data);
        showLiveToast(`🏛️ ${payload.message || 'Offices & staff updated from Google Sheet'}`);
      } catch (err) {
        showLiveToast('🏛️ Offices & staff updated from Google Sheet');
      }
    });

    // 15. Full sync requested
    sse.addEventListener('full_sync_required', () => {
      fetchFreshData();
      showLiveToast(`🔄 Directory synced with central server`);
    });

    sse.onerror = () => {
      updateSyncBadge(false, 'Offline / Reconnecting');
    };
  } catch (e) {
    console.warn('SSE not supported or failed to initialize:', e);
  }
}

function updateSyncBadge(isLive, text) {
  const badge = document.getElementById('syncBadge');
  const statusText = document.getElementById('syncStatusText');
  if (!badge || !statusText) return;

  badge.classList.remove('live', 'offline');
  if (isLive === true) {
    badge.classList.add('live');
  } else if (isLive === false) {
    badge.classList.add('offline');
  }
  statusText.textContent = text;
}

function initNetworkListeners() {
  window.addEventListener('online', () => {
    state.isOnline = true;
    updateSyncBadge(true, 'Live Connected');
    fetchFreshData();
    initSSEPushListener();
  });

  window.addEventListener('offline', () => {
    state.isOnline = false;
    updateSyncBadge(false, 'Offline (Cached Mode)');
  });
}

function showLiveToast(message) {
  const toast = document.getElementById('liveUpdateToast');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.style.display = 'flex';

  if (state.activeToastTimer) clearTimeout(state.activeToastTimer);
  state.activeToastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 4500);
}

function highlightCard(contactId) {
  setTimeout(() => {
    const card = document.getElementById(`card-${contactId}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.borderColor = '#0284c7';
      card.style.boxShadow = '0 0 15px rgba(2, 132, 199, 0.4)';
      setTimeout(() => {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 3000);
    }
  }, 200);
}

// -------------------------------------------------------------
// Filters & Search
// -------------------------------------------------------------
function setupEventListeners() {
  // Search input with smooth 60ms debounce for 60fps typing
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  let searchDebounceTimer = null;

  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      applyFilters();
    }, 60);
  });

  // Category chips
  const chips = document.querySelectorAll('#categoryChips .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.currentCategory = chip.getAttribute('data-cat');
      applyFilters();
    });
  });

  // Role filter select
  const roleFilter = document.getElementById('roleFilter');
  if (roleFilter) {
    roleFilter.addEventListener('change', (e) => {
      state.currentRole = e.target.value;
      applyFilters();
    });
  }

  // Office Search input with smooth debounce
  const officeSearchInput = document.getElementById('officeSearchInput');
  const clearOfficeSearchBtn = document.getElementById('clearOfficeSearchBtn');
  let officeDebounceTimer = null;

  if (officeSearchInput) {
    officeSearchInput.addEventListener('input', (e) => {
      state.officeSearchQuery = e.target.value.trim().toLowerCase();
      if (clearOfficeSearchBtn) {
        clearOfficeSearchBtn.style.display = state.officeSearchQuery ? 'block' : 'none';
      }
      if (officeDebounceTimer) clearTimeout(officeDebounceTimer);
      officeDebounceTimer = setTimeout(() => {
        applyOfficeFilters();
      }, 60);
    });
  }

  // Office Category pills
  const officePills = document.querySelectorAll('#officeCategoryPills .pill');
  officePills.forEach(pill => {
    pill.addEventListener('click', () => {
      officePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentOfficeCategory = pill.getAttribute('data-ocat');
      applyOfficeFilters();
    });
  });
}

function clearOfficeSearch() {
  const officeSearchInput = document.getElementById('officeSearchInput');
  const clearOfficeSearchBtn = document.getElementById('clearOfficeSearchBtn');
  if (officeSearchInput) officeSearchInput.value = '';
  state.officeSearchQuery = '';
  if (clearOfficeSearchBtn) clearOfficeSearchBtn.style.display = 'none';
  applyOfficeFilters();
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = '';
  state.searchQuery = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  applyFilters();
  searchInput.focus();
}

function resetFilters() {
  clearSearch();
  state.currentCategory = 'All';
  state.currentRole = 'All';
  document.getElementById('roleFilter').value = 'All';

  const chips = document.querySelectorAll('#categoryChips .chip');
  chips.forEach(c => c.classList.remove('active'));
  if (chips[0]) chips[0].classList.add('active');

  applyFilters();
}

function applyFilters() {
  let list = [...state.contacts];

  // Category filter
  if (state.currentCategory && state.currentCategory !== 'All') {
    list = list.filter(c => c.category === state.currentCategory);
  }

  // Role filter
  if (state.currentRole && state.currentRole !== 'All') {
    list = list.filter(c => c.designation.toLowerCase().includes(state.currentRole.toLowerCase()));
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.villageName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.altPhone && c.altPhone.includes(q)) ||
      c.designation.toLowerCase().includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }

  state.filteredContacts = list;
  renderContacts();
}

// -------------------------------------------------------------
// Rendering UI
// -------------------------------------------------------------
function renderContacts() {
  const container = document.getElementById('contactsList');
  const emptyState = document.getElementById('noResults');
  const counter = document.getElementById('contactCounter');

  counter.textContent = `${state.filteredContacts.length} of ${state.contacts.length} Contacts`;

  if (state.filteredContacts.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  const html = state.filteredContacts.map(c => {
    const isVCP = c.designation.toLowerCase().includes('president');
    const isSec = c.designation.toLowerCase().includes('secretary');
    const roleClass = isVCP ? 'vcp' : (isSec ? 'secretary' : '');

    // Formatted WhatsApp phone (remove leading 0 or symbols, prepend 91 for India)
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const waMsg = encodeURIComponent(`Chibai Pu/Pi ${c.name}, VC (${c.villageName}) atanga biak che ka duh e.`);

    return `
      <article class="contact-card" id="card-${c.id}">
        <div class="card-top">
          <div class="badge-group">
            <span class="badge-village"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(c.villageName)}</span>
            <span class="badge-role ${roleClass}">${escapeHtml(c.designation)}</span>
          </div>
          ${c.term ? `<span style="font-size:0.7rem; color:#94a3b8;">${escapeHtml(c.term)}</span>` : ''}
        </div>

        <h3 class="card-name">${escapeHtml(c.name)}</h3>
        <div class="card-phone">
          <i class="fa-solid fa-phone" style="font-size:0.8rem; color:#0284c7;"></i>
          <span>${escapeHtml(formatPhone(c.phone))}</span>
          ${c.altPhone ? `<span style="color:#94a3b8; font-size:0.8rem;">/ ${escapeHtml(c.altPhone)}</span>` : ''}
        </div>

        ${c.notes ? `<div class="card-notes"><i class="fa-solid fa-circle-info"></i> ${escapeHtml(c.notes)}</div>` : ''}

        <div class="card-actions">
          <a href="tel:${cleanPhone}" class="btn-action btn-call" title="Call directly">
            <i class="fa-solid fa-phone"></i> Call
          </a>
          <a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="btn-action btn-whatsapp" title="WhatsApp Message">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
          </a>
          <button class="btn-action btn-icon-more" onclick="copyContact('${escapeHtml(c.name)}', '${cleanPhone}')" title="Copy Number">
            <i class="fa-solid fa-copy"></i>
          </button>
        </div>

        <button class="btn-report-link" onclick="openReportModal('${c.id}', '${escapeHtml(c.name)}', '${escapeHtml(c.villageName)}', '${escapeHtml(c.designation)}')">
          <i class="fa-solid fa-triangle-exclamation"></i> Report incorrect info / changed number
        </button>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

function applyOfficeFilters() {
  let list = [...state.offices];

  if (state.currentOfficeCategory && state.currentOfficeCategory !== 'All') {
    list = list.filter(o => o.category === state.currentOfficeCategory || o.department === state.currentOfficeCategory);
  }

  if (state.officeSearchQuery) {
    const q = state.officeSearchQuery;
    list = list.filter(o =>
      o.name.toLowerCase().includes(q) ||
      (o.department && o.department.toLowerCase().includes(q)) ||
      (o.address && o.address.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q)) ||
      (o.staff && o.staff.some(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.designation && s.designation.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      ))
    );
  }

  state.filteredOffices = list;
  renderOffices();
}

function renderOffices() {
  const container = document.getElementById('officesList');
  const empty = document.getElementById('noOfficeResults');
  if (!container) return;

  if (state.filteredOffices.length === 0) {
    container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const html = state.filteredOffices.map(off => {
    const cleanOfficePhone = off.phone ? off.phone.replace(/[^0-9]/g, '') : '';
    const staffList = off.staff || [];

    const staffHtml = staffList.length === 0 ? `
      <div style="font-size:0.78rem; color:#94a3b8; padding:8px 0; font-style:italic;">
        No staff members listed yet.
      </div>
    ` : staffList.map(stf => {
      const cleanStfPhone = stf.phone ? stf.phone.replace(/[^0-9]/g, '') : '';
      const waPhone = cleanStfPhone.startsWith('91') ? cleanStfPhone : `91${cleanStfPhone}`;
      const waMsg = encodeURIComponent(`Chibai Pu/Pi ${stf.name}, (${off.name}) atanga biak che ka duh e.`);

      return `
        <div class="office-staff-item">
          <div class="staff-info-col">
            <div class="staff-name-row">
              <h5 class="staff-name">${escapeHtml(stf.name)}</h5>
            </div>
            <span class="staff-designation">${escapeHtml(stf.designation)}</span>
            <div class="staff-phone-row">
              <i class="fa-solid fa-phone" style="font-size:0.75rem; color:#0284c7;"></i>
              <strong style="color:#0284c7; font-size:0.84rem;">${escapeHtml(formatPhone(stf.phone))}</strong>
              ${stf.altPhone ? `<span style="font-size:0.75rem; color:#94a3b8;">/ ${escapeHtml(stf.altPhone)}</span>` : ''}
              ${stf.email ? `<span style="font-size:0.72rem; color:#64748b; margin-left:6px;"><i class="fa-solid fa-envelope"></i> ${escapeHtml(stf.email)}</span>` : ''}
            </div>
          </div>

          <div class="staff-actions-col">
            <a href="tel:${cleanStfPhone}" class="btn-staff-call" title="Call directly">
              <i class="fa-solid fa-phone"></i> Call
            </a>
            <a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="btn-staff-wa" title="WhatsApp Message">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <button class="btn-staff-copy" onclick="copyContact('${escapeHtml(stf.name)}', '${cleanStfPhone}')" title="Copy Number">
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>

          <button class="btn-report-link staff-report-btn" onclick="openOfficeStaffReportModal('${off.id}', '${escapeHtml(off.name)}', '${stf.id}', '${escapeHtml(stf.name)}', '${escapeHtml(stf.designation)}', '${escapeHtml(stf.phone)}')">
            <i class="fa-solid fa-triangle-exclamation"></i> Report incorrect info / changed number
          </button>
        </div>
      `;
    }).join('');

    return `
      <article class="office-card" id="office-card-${off.id}">
        <div class="office-header-box">
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
              <span class="office-dept-badge">${escapeHtml(off.department || off.category || 'Government')}</span>
            </div>
            <h3 class="office-title">${escapeHtml(off.name)}</h3>
            ${off.address ? `<p class="office-addr"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(off.address)}</p>` : ''}
          </div>
        </div>

        <div class="office-contact-bar">
          ${off.phone ? `
            <a href="tel:${cleanOfficePhone}" class="office-main-phone">
              <i class="fa-solid fa-phone"></i> <strong>Office:</strong> ${escapeHtml(formatPhone(off.phone))}
            </a>
          ` : ''}
          ${off.email ? `
            <a href="mailto:${escapeHtml(off.email)}" class="office-main-email">
              <i class="fa-solid fa-envelope"></i> ${escapeHtml(off.email)}
            </a>
          ` : ''}
        </div>

        <!-- Office Staff Contact List -->
        <div class="office-staff-section">
          <div class="office-staff-header">
            <span><i class="fa-solid fa-users" style="color:#0284c7;"></i> Office Staff Contact List (${staffList.length})</span>
          </div>
          <div class="office-staff-list">
            ${staffHtml}
          </div>
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

function renderEmergency() {
  const container = document.getElementById('emergencyList');
  if (!container) return;

  const html = state.emergency.map(item => {
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    return `
      <div class="emergency-card" id="em-card-${item.id}">
        <div class="em-card-body">
          <div class="em-card-main">
            <div class="em-info">
              <h4>${escapeHtml(item.service)}</h4>
              <p class="em-officer"><i class="fa-solid fa-user-shield"></i> ${escapeHtml(item.officer)}</p>
              <div style="display:flex; align-items:center; gap:6px; margin-top:3px;">
                <span class="em-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.address)}</span>
                <span class="em-phone-label"><i class="fa-solid fa-phone"></i> ${escapeHtml(formatPhone(item.phone))}</span>
                ${item.altPhone ? `<span style="font-size:0.75rem; color:#94a3b8;">/ ${escapeHtml(item.altPhone)}</span>` : ''}
              </div>
            </div>
            <div class="em-actions">
              <a href="tel:${cleanPhone}" class="btn-em-call" title="Call Emergency Line">
                <i class="fa-solid fa-phone"></i>
              </a>
            </div>
          </div>
          <button class="btn-report-link em-report-btn" onclick="openEmergencyReportModal('${item.id}', '${escapeHtml(item.service)}', '${escapeHtml(item.officer)}', '${escapeHtml(item.phone)}')">
            <i class="fa-solid fa-triangle-exclamation"></i> Report incorrect info / changed number
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function renderVillages() {
  const container = document.getElementById('villagesList');
  if (!container) return;

  const html = state.villages.map(v => {
    return `
      <div class="village-pill-card" onclick="filterByVillage('${escapeHtml(v.name)}')">
        <h4><i class="fa-solid fa-landmark"></i> ${escapeHtml(v.name)}</h4>
        <span>${escapeHtml(v.category)}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function filterByVillage(villageName) {
  switchTab('tabPhonebook', document.querySelector('.bottom-nav .nav-item:first-child'));
  const searchInput = document.getElementById('searchInput');
  searchInput.value = villageName;
  state.searchQuery = villageName.toLowerCase();
  document.getElementById('clearSearchBtn').style.display = 'block';
  applyFilters();
}

function showBroadcast(bcast) {
  const banner = document.getElementById('broadcastBanner');
  const titleEl = document.getElementById('broadcastTitle');
  const msgEl = document.getElementById('broadcastMsg');
  if (!banner) return;

  titleEl.textContent = bcast.title;
  msgEl.textContent = bcast.message;
  banner.style.display = 'flex';
  localStorage.setItem('kolasib_broadcast', JSON.stringify(bcast));
}

function dismissBroadcast() {
  document.getElementById('broadcastBanner').style.display = 'none';
}

// -------------------------------------------------------------
// Notification History (View at least 4 past notices)
// -------------------------------------------------------------
function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadgeCount');
  if (!badge) return;
  const count = (state.broadcasts || []).length;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function openNotificationHistoryModal() {
  const modal = document.getElementById('notificationHistoryModal');
  if (!modal) return;
  renderNotificationHistory();
  modal.style.display = 'flex';
}

function closeNotificationHistoryModal() {
  const modal = document.getElementById('notificationHistoryModal');
  if (modal) modal.style.display = 'none';
}

function renderNotificationHistory() {
  const container = document.getElementById('notificationHistoryList');
  const subtitle = document.getElementById('notificationHistorySubtitle');
  if (!container) return;

  const list = state.broadcasts || [];
  if (subtitle) {
    subtitle.textContent = `${list.length} Notice${list.length !== 1 ? 's' : ''} • ${state.currentDistrict}`;
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 16px; color:#94a3b8;">
        <i class="fa-solid fa-bell-slash" style="font-size:2rem; margin-bottom:10px; color:#cbd5e1; display:block;"></i>
        <h4 style="font-size:0.95rem; font-weight:700; color:#64748b; margin-bottom:4px;">No Notifications Yet</h4>
        <p style="font-size:0.8rem; margin:0;">Official district announcements and alerts will appear here.</p>
      </div>
    `;
    return;
  }

  // Display all available notifications (at least 4 visible when present)
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
      <div class="notification-card ${isUrgent ? 'urgent' : 'normal'}">
        <div class="notification-card-header">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span class="notification-meta-tag ${isUrgent ? 'urgent' : 'normal'}">
              <i class="fa-solid ${isUrgent ? 'fa-triangle-exclamation' : 'fa-bullhorn'}"></i>
              ${isUrgent ? 'Urgent Alert' : 'Notice'}
            </span>
            <span style="font-size:0.72rem; font-weight:600; color:#64748b; background:#f1f5f9; padding:2px 6px; border-radius:4px;">
              <i class="fa-solid fa-location-dot" style="font-size:10px;"></i> ${escapeHtml(b.district || 'All Districts')}
            </span>
          </div>
          <span class="notification-time-tag">
            <i class="fa-regular fa-clock"></i> ${escapeHtml(dateStr)}
          </span>
        </div>
        <h4 class="notification-card-title">${escapeHtml(b.title)}</h4>
        <p class="notification-card-body">${escapeHtml(b.message)}</p>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// -------------------------------------------------------------
// Tab Switching
// -------------------------------------------------------------
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));

  const targetPage = document.getElementById(tabId);
  if (targetPage) targetPage.classList.add('active');
  if (btn) btn.classList.add('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------------------------------------------------------------
// Report Incorrect Information Modal
// -------------------------------------------------------------
function openReportModal(contactId, name, village, designation) {
  state.reportingEmergency = false;
  state.reportingOffice = false;
  state.reportedOfficeId = null;

  document.getElementById('repContactId').value = contactId;
  document.getElementById('repContactName').value = name;
  document.getElementById('repVillageName').value = village;
  document.getElementById('repDesignation').value = designation;

  document.getElementById('repTargetName').textContent = name;
  document.getElementById('repTargetVillage').textContent = village;
  document.getElementById('repTargetDesignation').textContent = designation;

  document.getElementById('repCorrectPhone').value = '';
  document.getElementById('repDetails').value = '';
  document.getElementById('reportModal').style.display = 'flex';
}

function openEmergencyReportModal(emId, service, officer, currentPhone) {
  state.reportingEmergency = true;
  state.reportingOffice = false;
  state.reportedOfficeId = null;

  document.getElementById('repContactId').value = emId;
  document.getElementById('repContactName').value = service;
  document.getElementById('repVillageName').value = `${state.currentDistrict} District Emergency Service`;
  document.getElementById('repDesignation').value = officer;

  document.getElementById('repTargetName').textContent = `🚨 ${service}`;
  document.getElementById('repTargetVillage').textContent = 'District Emergency & Essential Services';
  document.getElementById('repTargetDesignation').textContent = `${officer} (Current: ${currentPhone})`;

  document.getElementById('repCorrectPhone').value = '';
  document.getElementById('repDetails').value = '';
  document.getElementById('reportModal').style.display = 'flex';
}

function openOfficeStaffReportModal(officeId, officeName, staffId, staffName, designation, currentPhone) {
  state.reportingEmergency = false;
  state.reportingOffice = true;
  state.reportedOfficeId = officeId;

  document.getElementById('repContactId').value = staffId;
  document.getElementById('repContactName').value = staffName;
  document.getElementById('repVillageName').value = officeName;
  document.getElementById('repDesignation').value = `${designation} (${officeName})`;

  document.getElementById('repTargetName').textContent = `🏛️ ${staffName}`;
  document.getElementById('repTargetVillage').textContent = officeName;
  document.getElementById('repTargetDesignation').textContent = `${designation} (Current: ${currentPhone})`;

  document.getElementById('repCorrectPhone').value = '';
  document.getElementById('repDetails').value = '';
  document.getElementById('reportModal').style.display = 'flex';
}

function closeReportModal() {
  document.getElementById('reportModal').style.display = 'none';
}

async function submitCorrectionReport(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitReport');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

  const payload = {
    contactId: document.getElementById('repContactId').value,
    contactName: document.getElementById('repContactName').value,
    serviceName: document.getElementById('repContactName').value,
    villageName: document.getElementById('repVillageName').value,
    designation: document.getElementById('repDesignation').value,
    isEmergency: !!state.reportingEmergency,
    isOffice: !!state.reportingOffice,
    officeName: state.reportingOffice ? document.getElementById('repVillageName').value : '',
    staffId: state.reportingOffice ? document.getElementById('repContactId').value : null,
    issueType: document.getElementById('repIssueType').value,
    suggestedPhone: document.getElementById('repCorrectPhone').value.trim(),
    description: document.getElementById('repDetails').value.trim(),
    reportedBy: document.getElementById('repUserName').value.trim() || 'Citizen / Local Resident',
    reporterPhone: document.getElementById('repUserPhone').value.trim(),
    district: state.currentDistrict
  };

  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (res.success) {
      alert(`Thank you! Your correction report has been forwarded directly to the ${state.currentDistrict} District Administrator for review.`);
      closeReportModal();
    } else {
      alert(`Submission error: ${res.error || 'Please try again'}`);
    }
  } catch (err) {
    alert('Unable to submit right now. Please check your internet connection and try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit to Admin`;
  }
}

// -------------------------------------------------------------
// Utilities
// -------------------------------------------------------------
function formatPhone(num) {
  if (!num) return '';
  const clean = num.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return num;
}

function copyContact(name, phone) {
  navigator.clipboard.writeText(phone).then(() => {
    showLiveToast(`📋 Copied ${name}'s number: ${phone}`);
  }).catch(() => {
    alert(`Phone Number: ${phone}`);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
