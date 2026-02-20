import * as XLSX from 'xlsx';

interface ExportOptions {
  data: Record<string, any>[];
  headers: Record<string, string>; // key -> Uzbek label
  filename: string;
}

export function exportToExcel({ data, headers, filename }: ExportOptions) {
  try {
    const keys = Object.keys(headers);
    const headerLabels = keys.map(k => headers[k]);

    const rows = data.map(row =>
      keys.map(k => {
        const val = row[k];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
          try {
            const d = new Date(val);
            return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          } catch { return val; }
        }
        return val;
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headerLabels, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ma\'lumotlar');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch {
    // Fallback to CSV
    exportToCSV({ data, headers, filename });
  }
}

export function exportToCSV({ data, headers, filename }: ExportOptions) {
  const keys = Object.keys(headers);
  const headerLabels = keys.map(k => headers[k]);

  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [headerLabels.map(h => `"${h}"`).join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
