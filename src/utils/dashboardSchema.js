export const DASHBOARD_FIELDS = [
  {
    key: 'date',
    title: '日期',
    type: 'date',
    aliases: ['日期', 'date', 'datetime', '时间'],
  },
  {
    key: 'platform',
    title: '平台',
    type: 'text',
    aliases: ['平台', 'platform'],
  },
  {
    key: 'storeName',
    title: '店铺名称',
    type: 'text',
    aliases: ['店铺名称', '店铺', 'storeName', 'store name'],
  },
  {
    key: 'totalSales',
    title: '总销量',
    type: 'number',
    aliases: ['总销量', '销量', 'totalSales'],
  },
  {
    key: 'backstageNewCount',
    title: '后台上新数量',
    type: 'number',
    aliases: ['后台上新数量', '上新数量', 'backstageNewCount'],
  },
  {
    key: 'pricePassCount',
    title: '核价通过数量',
    type: 'number',
    aliases: ['核价通过数量', '通过数量', 'pricePassCount'],
  },
  {
    key: 'pricePassRate',
    title: '核价通过率',
    type: 'percent',
    aliases: ['核价通过率', '通过率', 'pricePassRate'],
  },
  {
    key: 'templateCount',
    title: '关联模板数量',
    type: 'number',
    aliases: ['关联模板数量', '模板数量', 'templateCount'],
  },
  {
    key: 'publishFrontCount',
    title: '发布前端数量',
    type: 'number',
    aliases: ['发布前端数量', '前端数量', 'publishFrontCount'],
  },
  {
    key: 'frontOnSaleSkcCount',
    title: '前端在售SKC数量',
    type: 'number',
    aliases: ['前端在售SKC数量', '在售SKC数量', '前端在售SKC', 'frontOnSaleSkcCount'],
  },
];

export const DASHBOARD_HEADER_MAP = DASHBOARD_FIELDS.reduce((map, field) => {
  map[field.key] = field.title;
  return map;
}, {});

export const DASHBOARD_COLUMNS = DASHBOARD_FIELDS.map((field) => {
  const numericSort = (a, b) => {
    const left = normalizeSortableValue(a?.[field.key], field.type);
    const right = normalizeSortableValue(b?.[field.key], field.type);
    return left - right;
  };

  return {
    title: field.title,
    dataIndex: field.key,
    key: field.key,
    sorter: field.type === 'text' ? (a, b) => String(a?.[field.key] ?? '').localeCompare(String(b?.[field.key] ?? '')) : numericSort,
    render: (value) => renderFieldValue(field.type, value),
    ellipsis: true,
    align: field.type === 'text' ? 'left' : 'right',
  };
});

export function normalizeHeaderText(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[：:]/g, '')
    .toLowerCase();
}

export function findFieldByHeader(headerText) {
  const normalized = normalizeHeaderText(headerText);
  return DASHBOARD_FIELDS.find((field) => {
    const aliases = [field.title, field.key, ...(field.aliases || [])];
    return aliases.some((alias) => normalizeHeaderText(alias) === normalized);
  }) || null;
}

export function renderFieldValue(type, value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (type === 'percent') {
    return formatPercentValue(value);
  }

  if (type === 'number') {
    return formatNumberValue(value);
  }

  return String(value);
}

export function formatNumberValue(value) {
  const numeric = Number(String(value).replace(/,/g, ''));
  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat('zh-CN').format(numeric);
  }
  return String(value);
}

export function formatPercentValue(value) {
  const raw = String(value).trim();
  if (raw.endsWith('%')) {
    return raw;
  }

  const numeric = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(numeric)) {
    return raw;
  }

  if (numeric <= 1 && numeric >= 0) {
    return `${(numeric * 100).toFixed(2)}%`;
  }

  return `${numeric.toFixed(2)}%`;
}

export function normalizeSortableValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return Number.NEGATIVE_INFINITY;
  }

  if (type === 'text') {
    return 0;
  }

  const normalized = String(value).replace(/,/g, '').replace(/%/g, '');
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) {
    return type === 'percent' && numeric <= 1 ? numeric * 100 : numeric;
  }

  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export function toExportRow(row) {
  const exportRow = {};
  DASHBOARD_FIELDS.forEach((field) => {
    exportRow[field.title] = row?.[field.key] ?? '';
  });
  return exportRow;
}

export function stripEmptyValues(row) {
  const cleaned = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const text = String(value ?? '').trim();
    cleaned[key] = text;
  });
  return cleaned;
}
