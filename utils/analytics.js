
import { parseDashboardDate } from './dateFilters';

export const CHART_METRICS = [
  { key: 'totalSales', label: '总销量' },
  { key: 'backstageNewCount', label: '后台上新数量' },
  { key: 'publishFrontCount', label: '发布前端数量' },
  { key: 'templateCount', label: '关联模板数量' },
  { key: 'pricePassCount', label: '核价通过数量' },
];

export function getUniqueStores(rows) {
  return Array.from(new Set(rows.map((row) => String(row?.storeName ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function filterRowsByStores(rows, selectedStores) {
  if (!selectedStores?.length) {
    return rows;
  }
  const selected = new Set(selectedStores);
  return rows.filter((row) => selected.has(String(row?.storeName ?? '').trim()));
}

export function parseNumeric(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const normalized = String(value).replace(/,/g, '').replace(/%/g, '');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function aggregateRowsByDate(rows, metricKeys = CHART_METRICS.map((item) => item.key)) {
  const map = new Map();
  rows.forEach((row) => {
    const date = String(row?.date ?? '').trim() || '未知日期';
    if (!map.has(date)) {
      map.set(date, { date });
    }
    const bucket = map.get(date);
    metricKeys.forEach((key) => {
      bucket[key] = (bucket[key] || 0) + parseNumeric(row?.[key]);
    });
  });

  return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date), 'zh-CN', { numeric: true }));
}

export function aggregateStores(rows, metricKey = 'backstageNewCount') {
  const map = new Map();
  rows.forEach((row) => {
    const store = String(row?.storeName ?? '').trim() || '未知店铺';
    map.set(store, (map.get(store) || 0) + parseNumeric(row?.[metricKey]));
  });
  return Array.from(map.entries())
    .map(([storeName, value]) => ({ storeName, value }))
    .sort((a, b) => b.value - a.value);
}

export function computeCompletionRatio(rows, monthlyTarget = 0) {
  const completed = rows.reduce((sum, row) => sum + parseNumeric(row?.backstageNewCount), 0);
  const target = parseNumeric(monthlyTarget);
  const ratio = target > 0 ? completed / target : 0;
  return { completed, target, ratio };
}

export function createChartSeries(rows, metricKeys) {
  const chartData = aggregateRowsByDate(rows, metricKeys);
  return chartData;
}

export function getMetricLabel(metricKey) {
  return CHART_METRICS.find((item) => item.key === metricKey)?.label || metricKey;
}

function createComparisonIndex(rows) {
  return rows.reduce((map, row) => {
    const parsedDate = parseDashboardDate(row?.date);
    if (!parsedDate) {
      return map;
    }

    const key = [
      String(row?.platform ?? '').trim(),
      String(row?.storeName ?? '').trim(),
      parsedDate.format('YYYY-MM-DD'),
    ].join('::');

    const bucket = map[key] || {
      totalSales: 0,
      backstageNewCount: 0,
      pricePassCount: 0,
      templateCount: 0,
      publishFrontCount: 0,
    };

    bucket.totalSales += parseNumeric(row?.totalSales);
    bucket.backstageNewCount += parseNumeric(row?.backstageNewCount);
    bucket.pricePassCount += parseNumeric(row?.pricePassCount);
    bucket.templateCount += parseNumeric(row?.templateCount);
    bucket.publishFrontCount += parseNumeric(row?.publishFrontCount);
    map[key] = bucket;
    return map;
  }, {});
}

export function buildComparisonMap(currentRows, previousRows, periodSpanDays = 0) {
  const metricKeys = ['totalSales', 'backstageNewCount', 'pricePassCount', 'templateCount', 'publishFrontCount'];
  const previousIndex = createComparisonIndex(previousRows);

  return currentRows.reduce((map, row) => {
    const parsedDate = parseDashboardDate(row?.date);
    if (!parsedDate) {
      map[row.__rowKey] = {};
      return map;
    }

    const compareDate = parsedDate.subtract(periodSpanDays || 0, 'day').format('YYYY-MM-DD');
    const key = [
      String(row?.platform ?? '').trim(),
      String(row?.storeName ?? '').trim(),
      compareDate,
    ].join('::');

    const currentMetrics = metricKeys.reduce((bucket, metricKey) => {
      bucket[metricKey] = parseNumeric(row?.[metricKey]);
      return bucket;
    }, {});

    map[row.__rowKey] = metricKeys.reduce((bucket, metricKey) => {
      const previousValue = previousIndex[key]?.[metricKey] ?? 0;
      bucket[metricKey] = {
        current: currentMetrics[metricKey],
        previous: previousValue,
        change: currentMetrics[metricKey] - previousValue,
      };
      return bucket;
    }, {});
    return map;
  }, {});
}

export function buildProgressMap(rows, monthlyTarget) {
  const totalCompleted = rows.reduce((sum, row) => sum + parseNumeric(row?.backstageNewCount), 0);
  const target = parseNumeric(monthlyTarget);

  return rows.reduce((map, row) => {
    map[row.__rowKey] = {
      completed: totalCompleted,
      target,
      ratio: target > 0 ? totalCompleted / target : 0,
    };
    return map;
  }, {});
}
