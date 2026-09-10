const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8'));

function sqlStr(v) {
  if (v === null || v === undefined || v === '') return 'null';
  return `'` + String(v).replace(/'/g, "''") + `'`;
}
function sqlDate(v) {
  if (!v) return 'null';
  return `'${v}'`;
}
function sqlBool(v) {
  return v ? 'true' : 'false';
}
function sqlUuid(v) {
  return v ? `'${v}'` : 'null';
}

// ---------------------------------------------------------------
// 1. Employees: detect resignation from assignment remarks
// ---------------------------------------------------------------
const employeeById = new Map(data.employees.map(e => [e.id, { ...e }]));

for (const a of data.assignments) {
  if (a.remark && /resign/i.test(a.remark)) {
    const emp = employeeById.get(a.employee_id);
    emp.employment_status = 'resigned';
    if (a.date_returned && (!emp.resigned_date || a.date_returned > emp.resigned_date)) {
      emp.resigned_date = a.date_returned;
    }
  }
}

// ---------------------------------------------------------------
// 2. Assignments: auto-close open-ended non-final records so each asset
//    has at most one currently-open assignment (required for data
//    integrity / the DB's one-active-assignment constraint), and flag
//    every inferred or ambiguous record for administrator verification.
// ---------------------------------------------------------------
const assignmentsByAsset = new Map();
for (const a of data.assignments) {
  if (!assignmentsByAsset.has(a.asset_id)) assignmentsByAsset.set(a.asset_id, []);
  assignmentsByAsset.get(a.asset_id).push({ ...a, needs_verification: false, verification_reason: null });
}

const finalAssignments = [];
for (const [assetId, list] of assignmentsByAsset) {
  list.sort((a, b) => Number(a._bil) - Number(b._bil));
  for (let i = 0; i < list.length; i++) {
    const cur = list[i];
    const reasons = [];

    if (i < list.length - 1 && !cur.date_returned) {
      const next = list[i + 1];
      cur.date_returned = next.date_issued || next.date_returned || null;
      reasons.push(
        'Auto-closed: the original masterlist did not record a return date before this asset was reassigned to the next employee. Return date inferred automatically — please verify.'
      );
    }

    if (cur.remark && /claim/i.test(cur.remark)) {
      reasons.push(`Remark suggests actual usage may differ from the recorded assignee: "${cur.remark.replace(/\n/g, ' ')}"`);
    }

    if (reasons.length) {
      cur.needs_verification = true;
      cur.verification_reason = reasons.join(' | ');
    }
    finalAssignments.push(cur);
  }
}

// ---------------------------------------------------------------
// 3. Assets: status, department, verification flags, asset_code
// ---------------------------------------------------------------
const TYPES_EXPECTING_SERIAL = [
  'laptop', 'desktop', 'pc', 'monitor', 'handphone', 'phone', 'tab', 'tablet', 'printer', 'camera',
];

const sortedAssets = [...data.assets].sort((a, b) => a._firstBil - b._firstBil);
const assetById = new Map(data.assets.map(a => [a.id, { ...a }]));

for (const asset of assetById.values()) {
  const history = (assignmentsByAsset.get(asset.id) || []).slice().sort((a, b) => Number(a._bil) - Number(b._bil));
  const last = history[history.length - 1];

  asset.status = last && !last.date_returned ? 'assigned' : 'available';
  asset.department_id = last ? employeeById.get(last.employee_id).department_id : null;

  const reasons = [];
  const typeKey = (asset.asset_type || '').toLowerCase();
  const expectsSerial = TYPES_EXPECTING_SERIAL.some(t => typeKey.includes(t));
  if (expectsSerial && !asset.serial_no) {
    reasons.push('Missing serial number for an asset type that would typically have one.');
  }
  if (asset._typeMismatch) {
    reasons.push('This serial number was logged under more than one asset type/description across the original sheet — please confirm this is really one physical item.');
  }
  if (history.some(h => h.needs_verification)) {
    reasons.push('Has one or more assignment records flagged for verification (see asset history).');
  }
  asset.needs_verification = reasons.length > 0;
  asset.verification_reason = reasons.length ? reasons.join(' | ') : null;
}

sortedAssets.forEach((a, i) => {
  assetById.get(a.id).asset_code = 'AST-' + String(i + 1).padStart(4, '0');
});

// ---------------------------------------------------------------
// 4. Emit SQL
// ---------------------------------------------------------------
const lines = [];
lines.push('-- Generated seed data from "ORI Master List for Asset 2.xlsx" (sheet "Aug 26", 283 records).');
lines.push('-- Run this AFTER schema.sql, once, in the Supabase SQL editor.');
lines.push('begin;');
lines.push('');

lines.push('-- Departments (' + data.departments.length + ')');
lines.push('insert into departments (id, code, name) values');
lines.push(
  data.departments
    .map(d => `  (${sqlUuid(d.id)}, ${sqlStr(d.code)}, ${sqlStr(d.name)})`)
    .join(',\n') + ';'
);
lines.push('');

lines.push('-- Employees (' + data.employees.length + ')');
lines.push('insert into employees (id, name, job_title, department_id, employment_status, resigned_date) values');
lines.push(
  [...employeeById.values()]
    .map(
      e =>
        `  (${sqlUuid(e.id)}, ${sqlStr(e.name)}, ${sqlStr(e.title)}, ${sqlUuid(e.department_id)}, ${sqlStr(
          e.employment_status || 'active'
        )}, ${sqlDate(e.resigned_date)})`
    )
    .join(',\n') + ';'
);
lines.push('');

lines.push('-- Assets (' + assetById.size + ')');
lines.push(
  'insert into assets (id, asset_code, asset_type, description, serial_no, status, department_id, needs_verification, verification_reason) values'
);
lines.push(
  [...assetById.values()]
    .map(
      a =>
        `  (${sqlUuid(a.id)}, ${sqlStr(a.asset_code)}, ${sqlStr(a.asset_type)}, ${sqlStr(a.description)}, ${sqlStr(
          a.serial_no
        )}, ${sqlStr(a.status)}, ${sqlUuid(a.department_id)}, ${sqlBool(a.needs_verification)}, ${sqlStr(a.verification_reason)})`
    )
    .join(',\n') + ';'
);
lines.push('');

lines.push('-- Asset assignment history (' + finalAssignments.length + ' records)');
lines.push(
  'insert into asset_assignments (id, asset_id, employee_id, department_id, issued_date, returned_date, remarks, needs_verification, verification_reason) values'
);
lines.push(
  finalAssignments
    .map(a => {
      const emp = employeeById.get(a.employee_id);
      return `  (${sqlUuid(a.id)}, ${sqlUuid(a.asset_id)}, ${sqlUuid(a.employee_id)}, ${sqlUuid(emp.department_id)}, ${sqlDate(
        a.date_issued
      )}, ${sqlDate(a.date_returned)}, ${sqlStr(a.remark)}, ${sqlBool(a.needs_verification)}, ${sqlStr(a.verification_reason)})`;
    })
    .join(',\n') + ';'
);
lines.push('');
lines.push('commit;');
lines.push('');

const totalNeedsVerification =
  [...assetById.values()].filter(a => a.needs_verification).length +
  finalAssignments.filter(a => a.needs_verification).length;

lines.push('-- ============================================================');
lines.push('-- IMPORT SUMMARY');
lines.push(`-- Total source records read from sheet:     ${data.assignments.length}`);
lines.push(`-- Departments created:                      ${data.departments.length}`);
lines.push(`-- Employees created:                        ${employeeById.size}`);
lines.push(`-- Distinct physical assets created:         ${assetById.size}`);
lines.push(`-- Assignment history records created:       ${finalAssignments.length}`);
lines.push(`-- Assets flagged for verification:          ${[...assetById.values()].filter(a => a.needs_verification).length}`);
lines.push(`-- Assignment records flagged for verification: ${finalAssignments.filter(a => a.needs_verification).length}`);
lines.push('-- Review flagged records in the app under Data Verification.');
lines.push('-- ============================================================');

fs.writeFileSync(path.join(__dirname, 'supabase', 'seed.sql'), lines.join('\n'));

console.log('IMPORT SUMMARY');
console.log('Total source records:', data.assignments.length);
console.log('Departments:', data.departments.length);
console.log('Employees:', employeeById.size);
console.log('Assets:', assetById.size);
console.log('Assignment records:', finalAssignments.length);
console.log('Assets needing verification:', [...assetById.values()].filter(a => a.needs_verification).length);
console.log('Assignments needing verification:', finalAssignments.filter(a => a.needs_verification).length);
console.log('wrote supabase/seed.sql');
