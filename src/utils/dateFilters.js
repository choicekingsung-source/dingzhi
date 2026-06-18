import dayjs from 'dayjs';

export const DATE_PRESETS = [
  { key: 'yesterday', label: '昨天' },
  { key: 'last7', label: '近7天' },
  { key: 'last14', label: '近14天' },
  { key: 'last30', label: '近30天' },
  { key: 'custom', label: '自定义日期' },
];

export function parseDashboardDate(value) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }

  const normalized = text
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\//g, '-')
    .replace(/\./g, '-');

  const parsed = dayjs(normalized);
  return parsed.isValid() ? parsed.startOf('day') : null;
}

export function resolvePresetRange(presetKey, now = dayjs()) {
  const today = now.startOf('day');

  switch (presetKey) {
    case 'yesterday':
      return [today.subtract(1, 'day'), today.subtract(1, 'day')];
    case 'last7':
      return [today.subtract(6, 'day'), today];
    case 'last14':
      return [today.subtract(13, 'day'), today];
    case 'last30':
      return [today.subtract(29, 'day'), today];
    default:
      return null;
  }
}

export function filterRowsByDateRange(rows, range) {
  if (!range || !range[0] || !range[1]) {
    return rows;
  }

  const [start, end] = range;
  return rows.filter((row) => {
    const rowDate = parseDashboardDate(row?.date);
    if (!rowDate) {
      return false;
    }
    return (rowDate.isAfter(start.subtract(1, 'day')) && rowDate.isBefore(end.add(1, 'day')));
  });
}

export function getPreviousPeriodRange(range) {
  if (!range || !range[0] || !range[1]) {
    return null;
  }

  const [start, end] = range;
  const span = end.diff(start, 'day') + 1;
  const previousEnd = start.subtract(1, 'day');
  const previousStart = previousEnd.subtract(span - 1, 'day');
  return [previousStart, previousEnd];
}

export function formatRangeLabel(range) {
  if (!range || !range[0] || !range[1]) {
    return '全部时间';
  }
  return `${range[0].format('YYYY-MM-DD')} 至 ${range[1].format('YYYY-MM-DD')}`;
}
