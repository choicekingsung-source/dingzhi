import React from 'react';
import { Progress, Tag } from 'antd';
import { parseDashboardDate } from './dateFilters';
import { parseNumeric } from './analytics';

const METRIC_DEFS = [
  { key: 'totalSales', title: '总销量' },
  { key: 'backstageNewCount', title: '后台上新数量' },
  { key: 'publishFrontCount', title: '发布前端数量' },
  { key: 'templateCount', title: '关联模板数量' },
  { key: 'pricePassCount', title: '核价通过数量' },
];

function buildDailyIndex(rows) {
  return rows.reduce((map, row) => {
    const parsedDate = parseDashboardDate(row?.date);
    if (!parsedDate) return map;
    const key = [String(row?.platform ?? '').trim(), String(row?.storeName ?? '').trim(), parsedDate.format('YYYY-MM-DD')].join('::');
    const bucket = map[key] || { totalSales: 0, backstageNewCount: 0, publishFrontCount: 0, templateCount: 0, pricePassCount: 0 };
    METRIC_DEFS.forEach((metric) => {
      bucket[metric.key] += parseNumeric(row?.[metric.key]);
    });
    map[key] = bucket;
    return map;
  }, {});
}

function buildMonthlyProgress(rows, monthlyTargets, monthKey, metricKey) {
  const completed = rows
    .filter((row) => {
      const parsed = parseDashboardDate(row?.date);
      return parsed ? parsed.format('YYYY-MM') === monthKey : false;
    })
    .reduce((sum, row) => sum + parseNumeric(row?.[metricKey]), 0);
  const target = parseNumeric(monthlyTargets?.[monthKey]?.[metricKey]);
  const ratio = target > 0 ? completed / target : 0;
  return { completed, target, ratio };
}

function formatCompareText(current, previous) {
  if (previous === 0) {
    return current === 0 ? { text: '0%', color: '#8c8c8c' } : { text: 'N/A', color: '#8c8c8c' };
  }

  const rate = (current / previous) - 1;
  if (!Number.isFinite(rate)) {
    return { text: 'N/A', color: '#8c8c8c' };
  }

  const text = `${rate >= 0 ? '+' : ''}${Math.round(rate * 100)}%`;
  if (rate > 0) return { text, color: '#ff4d4f' };
  if (rate < 0) return { text, color: '#52c41a' };
  return { text: '0%', color: '#8c8c8c' };
}

export function createDashboardColumns({ rows, monthlyTargets, selectedMonth }) {
  const dailyIndex = buildDailyIndex(rows);
  const metricColumns = METRIC_DEFS.map((metric) => ({
    title: metric.title,
    dataIndex: metric.key,
    key: metric.key,
    align: 'right',
    sorter: (a, b) => parseNumeric(a?.[metric.key]) - parseNumeric(b?.[metric.key]),
    render: (value, row) => {
      const parsedDate = parseDashboardDate(row?.date);
      const previousDate = parsedDate ? parsedDate.subtract(1, 'day').format('YYYY-MM-DD') : '';
      const compareKey = [String(row?.platform ?? '').trim(), String(row?.storeName ?? '').trim(), previousDate].join('::');
      const previousValue = dailyIndex[compareKey]?.[metric.key] ?? 0;
      const currentValue = parseNumeric(value);
      const trend = formatCompareText(currentValue, previousValue);
      return (
        <div className="metric-cell">
          <span>{currentValue}</span>
          <Tag color={trend.color === '#ff4d4f' ? 'error' : trend.color === '#52c41a' ? 'success' : 'default'}>环比 {trend.text}</Tag>
        </div>
      );
    },
  }));

  const progressColumns = [
    {
      title: '上新数量进度条',
      key: 'backstageProgress',
      width: 220,
      render: (_, row) => {
        const progress = buildMonthlyProgress(rows, monthlyTargets, selectedMonth || '', 'backstageNewCount');
        const overTarget = progress.target > 0 && progress.ratio > 1;
        return (
          <div className="progress-cell">
            <div className="progress-title">对应表格字段：后台上新数量（{selectedMonth || '未选择月份'}）</div>
            <Progress
              percent={Math.min(Math.round(progress.ratio * 100), 120)}
              status={overTarget ? 'exception' : 'active'}
              strokeColor={overTarget ? '#ff4d4f' : '#52c41a'}
              size="small"
              format={() => `${progress.completed}/${progress.target || '-'}`}
            />
          </div>
        );
      },
    },
    {
      title: '销量目标进度条',
      key: 'salesProgress',
      width: 220,
      render: (_, row) => {
        const progress = buildMonthlyProgress(rows, monthlyTargets, selectedMonth || '', 'totalSales');
        const overTarget = progress.target > 0 && progress.ratio > 1;
        return (
          <div className="progress-cell">
            <div className="progress-title">对应表格字段：总销量（{selectedMonth || '未选择月份'}）</div>
            <Progress
              percent={Math.min(Math.round(progress.ratio * 100), 120)}
              status={overTarget ? 'exception' : 'active'}
              strokeColor={overTarget ? '#ff4d4f' : '#52c41a'}
              size="small"
              format={() => `${progress.completed}/${progress.target || '-'}`}
            />
          </div>
        );
      },
    },
  ];

  return [
    { title: '日期', dataIndex: 'date', key: 'date', sorter: (a, b) => String(a.date).localeCompare(String(b.date), 'zh-CN', { numeric: true }) },
    { title: '平台', dataIndex: 'platform', key: 'platform' },
    { title: '店铺名称', dataIndex: 'storeName', key: 'storeName' },
    ...metricColumns,
    ...progressColumns,
  ];
}
