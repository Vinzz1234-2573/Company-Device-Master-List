'use client';

function flatten(rows: Record<string, unknown>[]) {
  return rows.map(row => {
    const flat: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [k2, v2] of Object.entries(value as Record<string, unknown>)) {
          flat[`${key}.${k2}`] = v2;
        }
      } else if (!Array.isArray(value)) {
        flat[key] = value;
      }
    }
    return flat;
  });
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

export function ExportButtons({ rows, filename }: { rows: Record<string, unknown>[]; filename: string }) {
  const flat = flatten(rows);

  function exportCsv() {
    const csv = toCsv(flat);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportXlsx() {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  return (
    <div className="flex gap-2">
      <button type="button" onClick={exportCsv} className="btn-secondary" disabled={rows.length === 0}>
        Export CSV
      </button>
      <button type="button" onClick={exportXlsx} className="btn-secondary" disabled={rows.length === 0}>
        Export Excel
      </button>
    </div>
  );
}
