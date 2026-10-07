// Google Sheets & CSV Import / Export Utilities
// Supports RFC 4180 CSV serialization, parsing, Google Sheets URL resolution, and templates.

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Escapes and formats rows into standard RFC 4180 CSV with UTF-8 BOM.
 */
function stringifyCSV(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(h => escapeCell(typeof h === 'object' ? h.label : h)).join(',');
  const lines = [headerLine];

  for (const row of rows) {
    const line = headers.map(h => {
      const key = typeof h === 'object' ? h.key : h;
      return escapeCell(row[key]);
    }).join(',');
    lines.push(line);
  }

  // Prepend UTF-8 BOM (\uFEFF) for native Google Sheets & Excel UTF-8 character recognition
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Parses RFC 4180 compliant CSV text into structured objects with normalized headers.
 */
function parseCSV(text) {
  if (!text || typeof text !== 'string') return { headers: [], rows: [] };

  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const rawRows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rawRows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length < 2) return { headers: [], rows: [] };

  const rawHeaders = rawRows[0].map(h => h.trim());
  const headerMap = {};
  rawHeaders.forEach((h, idx) => {
    const norm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    headerMap[norm] = idx;
  });

  const parsedObjects = [];
  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const obj = {};
    rawHeaders.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined ? row[idx] : '';
    });

    // Provide normalized map for resilient field extraction
    obj._get = function(possibleKeys) {
      for (const k of possibleKeys) {
        const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (headerMap[normKey] !== undefined && row[headerMap[normKey]]) {
          return row[headerMap[normKey]].trim();
        }
      }
      return '';
    };

    parsedObjects.push(obj);
  }

  return { headers: rawHeaders, rows: parsedObjects };
}

/**
 * Converts a standard Google Sheets sharing/editing URL to a direct CSV export URL.
 */
function resolveGoogleSheetCsvUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();

  // If already a direct CSV URL
  if (trimmed.includes('export?format=csv') || trimmed.includes('/pub?output=csv')) {
    return trimmed;
  }

  // Handle standard Google Sheets URL: https://docs.google.com/spreadsheets/d/<ID>/edit...#gid=<GID>
  const sheetIdMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!sheetIdMatch) {
    // Check if published web URL: /spreadsheets/d/e/<ID>/pubhtml
    const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (pubMatch) {
      let gid = '0';
      const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
      if (gidMatch) gid = gidMatch[1];
      return `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv&gid=${gid}`;
    }
    return null;
  }

  const sheetId = sheetIdMatch[1];
  let gid = '0';
  const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetches content from a URL, following up to 5 HTTP/HTTPS redirects.
 */
function fetchUrlWithRedirects(targetUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many HTTP redirects when fetching Google Sheet'));
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      return reject(new Error(`Invalid URL: ${targetUrl}`));
    }

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mizoram-VC-Phonebook-Sync/1.0',
        'Accept': 'text/csv, text/plain, */*'
      }
    }, (res) => {
      // Handle redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, targetUrl).toString();
        return resolve(fetchUrlWithRedirects(redirectUrl, maxRedirects - 1));
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Google Sheets responded with HTTP status ${res.statusCode}. Ensure the sheet has 'Anyone with the link can view' permission.`));
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        // Check if Google returned an HTML login page instead of CSV
        if (data.includes('<!DOCTYPE html>') && (data.includes('Sign in') || data.includes('accounts.google.com'))) {
          return reject(new Error('Google Sheet is restricted / private. Please set link sharing to "Anyone with the link can view", or export CSV locally and upload.'));
        }
        resolve(data);
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Network error fetching Google Sheet: ${err.message}`));
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Connection timed out while fetching Google Sheet'));
    });
  });
}

/**
 * Sample CSV Templates for Google Sheets
 */
const TEMPLATES = {
  contacts: [
    { label: 'Name', key: 'name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Alternate Phone', key: 'altPhone' },
    { label: 'Designation', key: 'designation' },
    { label: 'Council Name', key: 'villageName' },
    { label: 'District', key: 'district' },
    { label: 'Area Category', key: 'category' },
    { label: 'Official Term', key: 'term' },
    { label: 'Office Notes', key: 'notes' }
  ],
  emergency: [
    { label: 'Service Name', key: 'service' },
    { label: 'Officer In-Charge', key: 'officer' },
    { label: 'Primary Phone', key: 'phone' },
    { label: 'Alternate Phone', key: 'altPhone' },
    { label: 'Service Category', key: 'category' },
    { label: 'District', key: 'district' },
    { label: 'Priority', key: 'priority' },
    { label: 'Office Address', key: 'address' }
  ],
  offices: [
    { label: 'Office Name', key: 'name' },
    { label: 'Department', key: 'department' },
    { label: 'Category', key: 'category' },
    { label: 'District', key: 'district' },
    { label: 'Office Phone', key: 'phone' },
    { label: 'Office Email', key: 'email' },
    { label: 'Office Address', key: 'address' },
    { label: 'Staff Name', key: 'staffName' },
    { label: 'Staff Designation', key: 'staffDesignation' },
    { label: 'Staff Phone', key: 'staffPhone' },
    { label: 'Staff Alternate Phone', key: 'staffAltPhone' },
    { label: 'Staff Email', key: 'staffEmail' }
  ]
};

const SAMPLE_ROWS = {
  contacts: [
    { name: 'Pu Lalremruata Ralte', phone: '9436120011', altPhone: '03837220011', designation: 'President (VCP)', villageName: 'Kolasib Diakkawn', district: 'Kolasib', category: 'Kolasib Town', term: '2025-2030', notes: 'Community Hall' },
    { name: 'Pu C. Vanlalhruaia', phone: '9436120022', altPhone: '', designation: 'Secretary (VCS)', villageName: 'Kolasib Diakkawn', district: 'Kolasib', category: 'Kolasib Town', term: '2025-2030', notes: 'Office In-Charge' },
    { name: 'Pu Lalzauva Sailo', phone: '9436120033', altPhone: '', designation: 'Treasurer (VCT)', villageName: 'Kolasib Diakkawn', district: 'Kolasib', category: 'Kolasib Town', term: '2025-2030', notes: 'Finance & Accounts' },
    { name: 'Pi R. Lalthansangi', phone: '9862140011', altPhone: '', designation: 'Chairman (Local Council)', villageName: 'Aizawl Khatla', district: 'Aizawl', category: 'Aizawl City', term: '2025-2030', notes: 'Khatla LC Office' }
  ],
  emergency: [
    { service: 'District Hospital Kolasib (Casualty)', officer: 'Casualty Medical Officer', phone: '03837220038', altPhone: '108', category: 'Health & Medical', district: 'Kolasib', priority: '1', address: 'Hospital Veng, Kolasib' },
    { service: 'Police Control Room Kolasib', officer: 'Duty Officer', phone: '03837220022', altPhone: '112', category: 'Police & Security', district: 'Kolasib', priority: '1', address: 'Project Veng, Kolasib' },
    { service: 'Fire & Emergency Services Kolasib', officer: 'Station Officer', phone: '03837220101', altPhone: '101', category: 'Fire & Rescue', district: 'Kolasib', priority: '1', address: 'Venglai, Kolasib' }
  ],
  offices: [
    { name: "Deputy Commissioner's Office (DC Office)", department: 'District Administration', category: 'Administration', district: 'Kolasib', phone: '03837220022', email: 'dc-kolasib@mizoram.gov.in', address: 'DC Office Complex, Project Veng', staffName: 'Pu Robert C. Lalhmangaiha, IAS', staffDesignation: 'Deputy Commissioner (DC)', staffPhone: '9436140001', staffAltPhone: '03837220022', staffEmail: 'dckolasib@mizoram.gov.in' },
    { name: "Deputy Commissioner's Office (DC Office)", department: 'District Administration', category: 'Administration', district: 'Kolasib', phone: '03837220022', email: 'dc-kolasib@mizoram.gov.in', address: 'DC Office Complex, Project Veng', staffName: 'Pi M. Zothanpuii, MCS', staffDesignation: 'Additional Deputy Commissioner (ADC)', staffPhone: '9436140002', staffAltPhone: '', staffEmail: 'adc-kolasib@mizoram.gov.in' },
    { name: 'Superintendent of Police Office (SP Office)', department: 'Police & Security', category: 'Police & Security', district: 'Kolasib', phone: '03837220044', email: 'sp-kolasib@police.mizoram.gov.in', address: 'SP Office, Project Veng', staffName: 'Pu C. Lalruatsanga, IPS', staffDesignation: 'Superintendent of Police (SP)', staffPhone: '9436140003', staffAltPhone: '', staffEmail: 'sp-kolasib@mizoram.gov.in' }
  ]
};

function getTemplateCSV(type) {
  const headers = TEMPLATES[type] || TEMPLATES.contacts;
  const rows = SAMPLE_ROWS[type] || SAMPLE_ROWS.contacts;
  return stringifyCSV(headers, rows);
}

module.exports = {
  stringifyCSV,
  parseCSV,
  resolveGoogleSheetCsvUrl,
  fetchUrlWithRedirects,
  getTemplateCSV,
  TEMPLATES
};
