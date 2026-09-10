const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const filePath = path.join(__dirname, '..', 'ORI Master List for Asset 2.xlsx');
const wb = XLSX.readFile(filePath, { cellDates: true });
const sheetName = 'Aug 26';
const ws = wb.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

// Fill down merged cell ranges (Assigned To / Department / Date Returned / Remark etc. are
// stored only in the top-left cell of a merge by the underlying file format).
const merges = ws['!merges'] || [];
for (const m of merges) {
  const topVal = (json[m.s.r] && json[m.s.r][m.s.c]) || '';
  for (let r = m.s.r; r <= m.e.r; r++) {
    for (let c = m.s.c; c <= m.e.c; c++) {
      if (!json[r]) continue;
      if (json[r][c] === '' || json[r][c] === undefined) json[r][c] = topVal;
    }
  }
}

const headerIdx = json.findIndex(row => row.map(String).map(s => s.trim().toLowerCase()).includes('bil'));
if (headerIdx < 0) throw new Error('header row not found');

const COL = { bil: 1, type: 2, desc: 3, serial: 4, assignedTo: 5, dept: 6, issued: 7, returned: 8, remark: 9 };

const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m) {
    const [, d, mon, y] = m;
    const mm = MONTHS[mon.toLowerCase()];
    if (mm) return `${y}-${mm}-${d.padStart(2, '0')}`;
  }
  // fallback: try Date parse
  const d2 = new Date(s);
  if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10);
  return null;
}

function clean(s) {
  return String(s || '').replace(/\r\n/g, '\n').trim();
}

const PLACEHOLDER_SERIALS = new Set(['', 'NA', 'N/A', 'N.A', 'N.A.', '-', 'NIL', 'NONE', '_']);

function parseAssignedTo(raw, deptRaw) {
  const s = clean(raw);
  if (!s) return { name: '', title: '', deptFallback: '' };
  // capture "Name (Title)" optionally followed by " - CODE" or "(CODE)"
  const m = s.match(/^(.*?)\s*\(([^()]*)\)\s*(?:[-–]\s*(.*))?$/);
  if (m) {
    return { name: clean(m[1]), title: clean(m[2]), deptFallback: clean(m[3] || '') };
  }
  return { name: s, title: '', deptFallback: '' };
}

const rows = [];
for (let r = headerIdx + 1; r < json.length; r++) {
  const row = json[r];
  if (!row) continue;
  const type = clean(row[COL.type]);
  const desc = clean(row[COL.desc]);
  const serial = clean(row[COL.serial]);
  if (!type && !desc && !serial) continue; // stray/blank spacer row
  rows.push({
    bil: clean(row[COL.bil]),
    type,
    desc,
    serial,
    assignedToRaw: clean(row[COL.assignedTo]),
    deptRaw: clean(row[COL.dept]),
    dateIssued: parseDate(row[COL.issued]),
    dateReturned: parseDate(row[COL.returned]),
    remark: clean(row[COL.remark]),
    rowIndex: r,
  });
}

console.log('data rows extracted:', rows.length);

// ---- Departments ----
const departments = new Map(); // code -> {id, name}
function getDept(codeRaw) {
  const code = clean(codeRaw);
  if (!code) return null;
  const key = code.toUpperCase();
  if (!departments.has(key)) {
    departments.set(key, { id: crypto.randomUUID(), code: key, name: code });
  }
  return departments.get(key);
}

// ---- Employees ----
const employees = new Map(); // normalized name -> {id, name, title, department_id}
function getEmployee(name, title, deptId) {
  const key = name.toLowerCase();
  if (!employees.has(key)) {
    employees.set(key, { id: crypto.randomUUID(), name, title, department_id: deptId || null });
  } else {
    const e = employees.get(key);
    if (!e.title && title) e.title = title;
    if (!e.department_id && deptId) e.department_id = deptId;
  }
  return employees.get(key);
}

// ---- Group rows into assets by serial (when meaningful) ----
const groups = new Map(); // groupKey -> rows[]
let standaloneCounter = 0;
for (const row of rows) {
  const serialKey = row.serial.toUpperCase();
  let key;
  if (row.serial && !PLACEHOLDER_SERIALS.has(serialKey)) {
    key = 'SN:' + serialKey;
  } else {
    key = 'ROW:' + (standaloneCounter++);
  }
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

const assets = [];
const assignments = [];

for (const [key, groupRows] of groups) {
  groupRows.sort((a, b) => (Number(a.bil) || 0) - (Number(b.bil) || 0));
  const last = groupRows[groupRows.length - 1];
  const first = groupRows[0];
  const assetId = crypto.randomUUID();
  const realSerial = key.startsWith('SN:') ? first.serial : (first.serial || null);

  const distinctTypes = [...new Set(groupRows.map(r => r.type).filter(Boolean))];
  assets.push({
    id: assetId,
    asset_type: last.type || first.type,
    description: last.desc || first.desc,
    serial_no: realSerial || null,
    notes: null,
    _sourceBils: groupRows.map(r => r.bil).join(','),
    _typeMismatch: distinctTypes.length > 1,
    _groupRowCount: groupRows.length,
    _firstBil: Number(first.bil) || 0,
  });

  for (const row of groupRows) {
    if (!row.assignedToRaw) continue;
    const { name, title, deptFallback } = parseAssignedTo(row.assignedToRaw, row.deptRaw);
    if (!name) continue;
    const deptCode = row.deptRaw || deptFallback || '';
    const dept = getDept(deptCode);
    const emp = getEmployee(name, title, dept ? dept.id : null);
    assignments.push({
      id: crypto.randomUUID(),
      asset_id: assetId,
      employee_id: emp.id,
      date_issued: row.dateIssued,
      date_returned: row.dateReturned,
      remark: row.remark || null,
      _bil: row.bil,
    });
  }
}

console.log('departments:', departments.size);
console.log('employees:', employees.size);
console.log('assets:', assets.length);
console.log('assignments:', assignments.length);

const out = {
  departments: [...departments.values()],
  employees: [...employees.values()],
  assets,
  assignments,
};

fs.writeFileSync(path.join(__dirname, 'seed-data.json'), JSON.stringify(out, null, 2));
console.log('wrote seed-data.json');
