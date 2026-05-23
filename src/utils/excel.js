import * as XLSX from 'xlsx';
import {
  DASHBOARD_FIELDS,
  DASHBOARD_HEADER_MAP,
  normalizeHeaderText,
  stripEmptyValues,
  toExportRow,
} from './dashboardSchema';

function normalizeRowObject(rowObject) {
  const normalizedEntries = Object.entries(stripEmptyValues(rowObject)).reduce((acc, [key, value]) => {
    acc[normalizeHeaderText(key)] = value;
    return acc;
  }, {});

  const record = {};
  DASHBOARD_FIELDS.forEach((field) => {
    const candidates = [field.title, field.key, ...(field.aliases || [])].map(normalizeHeaderText);
    const matchedKey = candidates.find((candidate) => Object.prototype.hasOwnProperty.call(normalizedEntries, candidate));
    record[field.key] = matchedKey ? normalizedEntries[matchedKey] : '';
  });

  return record;
}

export async function parseExcelFile(file) {
  if (!file) {
    throw new Error('未选择文件');
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: false });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) {
    throw new Error('Excel 文件中未找到工作表');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    blankrows: false,
    raw: false,
  });

  if (!rawRows.length) {
    return [];
  }

  const firstRow = rawRows[0] || {};
  const fieldMatches = DASHBOARD_FIELDS.filter((field) => {
    const candidates = [field.title, field.key, ...(field.aliases || [])].map(normalizeHeaderText);
    return Object.keys(firstRow).some((key) => candidates.includes(normalizeHeaderText(key)));
  });

  if (!fieldMatches.length) {
    throw new Error('未识别到有效表头，请检查 Excel 格式');
  }

  return rawRows
    .map((row, index) => ({
      ...normalizeRowObject(row),
      __rowKey: `${sheetName}-${index}-${Date.now()}`,
    }))
    .filter((row) => DASHBOARD_FIELDS.some((field) => String(row[field.key] ?? '').trim() !== ''));
}

export function exportRowsToExcel(rows, fileName = '定制项目组数据-当前筛选.xlsx') {
  const exportRows = rows.map(toExportRow);
  const worksheet = XLSX.utils.json_to_sheet(exportRows, {
    header: DASHBOARD_FIELDS.map((field) => DASHBOARD_HEADER_MAP[field.key]),
  });

  worksheet['!cols'] = DASHBOARD_FIELDS.map((field) => ({ wch: Math.max(field.title.length * 2, 12) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '数据导出');
  XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
}

export function filterRowsByKeyword(rows, keyword) {
  const normalizedKeyword = String(keyword ?? '').trim().toLowerCase();
  if (!normalizedKeyword) {
    return rows;
  }

  return rows.filter((row) => {
    return DASHBOARD_FIELDS.some((field) => {
      const value = row?.[field.key];
      return String(value ?? '').toLowerCase().includes(normalizedKeyword);
    });
  });
}
