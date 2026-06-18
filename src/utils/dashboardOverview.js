import dayjs from 'dayjs';
import { parseNumeric } from './analytics';
import { buildTargetKey } from './cloudSchema';
import { parseDashboardDate } from './dateFilters';

export const OVERVIEW_METRICS = [
  { key: 'totalSales', label: '总销量' },
  { key: 'publishFrontCount', label: '发布前端数量' },
  { key: 'backstageNewCount', label: '后台上新数量' },
  { key: 'frontOnSaleSkcCount', label: '前端在售SKC数量' },
];

function buildMetricTotals(rows) {
  return rows.reduce((bucket, row) => {
    OVERVIEW_METRICS.forEach((metric) => {
      bucket[metric.key] += parseNumeric(row?.[metric.key]);
    });
    return bucket;
  }, {
    totalSales: 0,
    publishFrontCount: 0,
    backstageNewCount: 0,
    frontOnSaleSkcCount: 0,
  });
}

function buildGrowth(current, previous) {
  if (!Number.isFinite(previous) || previous <= 0) {
    return null;
  }

  const rate = (current / previous) - 1;
  if (!Number.isFinite(rate)) {
    return null;
  }

  if (rate > 0) {
    return { text: `${Math.round(rate * 100)}%`, color: 'red', direction: 'up' };
  }

  if (rate < 0) {
    return { text: `${Math.round(Math.abs(rate) * 100)}%`, color: 'green', direction: 'down' };
  }

  return { text: '0%', color: 'default', direction: 'flat' };
}

export function getLatestDashboardDate(rows) {
  let latest = null;

  (rows || []).forEach((row) => {
    const parsed = parseDashboardDate(row?.date);
    if (parsed && (!latest || parsed.isAfter(latest))) {
      latest = parsed;
    }
  });

  return latest;
}

export function groupRowsByStore(rows) {
  return (rows || []).reduce((acc, row) => {
    const storeName = String(row?.storeName ?? '').trim() || '未命名店铺';
    if (!acc[storeName]) {
      acc[storeName] = [];
    }
    acc[storeName].push(row);
    return acc;
  }, {});
}

export function filterRowsByMonth(rows, month) {
  if (!month) {
    return rows || [];
  }

  const monthKey = dayjs(month).format('YYYY-MM');
  return (rows || []).filter((row) => {
    const parsed = parseDashboardDate(row?.date);
    return parsed ? parsed.format('YYYY-MM') === monthKey : false;
  });
}

export function buildOverviewMetrics(currentRows, previousRows) {
  const currentTotals = buildMetricTotals(currentRows || []);
  const previousTotals = buildMetricTotals(previousRows || []);

  return OVERVIEW_METRICS.map((metric) => ({
    key: metric.key,
    label: metric.label,
    value: currentTotals[metric.key],
    compare: buildGrowth(currentTotals[metric.key], previousTotals[metric.key]),
  }));
}

export function buildStoreOverviewItems(currentRows, previousRows, monthlyTargets, selectedMonth) {
  const currentGroups = groupRowsByStore(currentRows);
  const previousGroups = groupRowsByStore(previousRows);
  const monthKey = dayjs(selectedMonth || dayjs()).format('YYYY-MM');

  return Object.entries(currentGroups)
    .map(([storeName, storeRows]) => {
      const previousRowsForStore = previousGroups[storeName] || [];
      const totals = buildMetricTotals(storeRows);
      const previousTotals = buildMetricTotals(previousRowsForStore);
      const targetKey = buildTargetKey(storeName, monthKey);
      const targetItem = monthlyTargets?.[targetKey] || {};

      const salesTarget = parseNumeric(targetItem.totalSales);
      const backstageTarget = parseNumeric(targetItem.backstageNewCount);

      return {
        storeName,
        rowCount: storeRows.length,
        targetMonth: monthKey,
        totalSales: totals.totalSales,
        publishFrontCount: totals.publishFrontCount,
        backstageNewCount: totals.backstageNewCount,
        frontOnSaleSkcCount: totals.frontOnSaleSkcCount,
        compare: {
          totalSales: buildGrowth(totals.totalSales, previousTotals.totalSales),
          publishFrontCount: buildGrowth(totals.publishFrontCount, previousTotals.publishFrontCount),
          backstageNewCount: buildGrowth(totals.backstageNewCount, previousTotals.backstageNewCount),
          frontOnSaleSkcCount: buildGrowth(totals.frontOnSaleSkcCount, previousTotals.frontOnSaleSkcCount),
        },
        progress: {
          totalSales: {
            current: totals.totalSales,
            target: salesTarget,
            ratio: salesTarget > 0 ? totals.totalSales / salesTarget : 0,
          },
          backstageNewCount: {
            current: totals.backstageNewCount,
            target: backstageTarget,
            ratio: backstageTarget > 0 ? totals.backstageNewCount / backstageTarget : 0,
          },
        },
      };
    })
    .sort((left, right) => right.totalSales - left.totalSales || left.storeName.localeCompare(right.storeName, 'zh-CN'));
}
