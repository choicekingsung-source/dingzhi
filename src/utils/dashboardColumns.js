import React from 'react';
import { Progress, Tag } from 'antd';
import {
  DASHBOARD_FIELDS,
  formatNumberValue,
  formatPercentValue,
  normalizeSortableValue,
} from './dashboardSchema';

const COMPARISON_METRIC_KEYS = [
  'totalSales',
  'backstageNewCount',
  'pricePassCount',
  'templateCount',
  'publishFrontCount',
];

function renderComparisonTag(metricKey, comparisonMap, row) {
  const record = comparisonMap?.[row?.__rowKey]?.[metricKey];
  if (!record || record.change === null) {
    return <span className="comparison-muted">环比 -</span>;
  }

  if (record.change > 0) {
    return <Tag color="error">环比 +{formatNumberValue(record.change)}</Tag>;
  }

  if (record.change < 0) {
    return <Tag color="success">环比 {formatNumberValue(record.change)}</Tag>;
  }

  return <Tag>环比 0</Tag>;
}

function renderTargetProgress(progressInfo) {
  if (!progressInfo || !Number.isFinite(progressInfo.target) || progressInfo.target <= 0) {
    return <span className="comparison-muted">未设置目标</span>;
  }

  const percent = Math.min(Math.round(progressInfo.ratio * 100), 120);
  const overTarget = progressInfo.ratio > 1;

  return (
    <div className="table-progress-cell">
      <Progress
        percent={percent}
        size="small"
        strokeColor={overTarget ? '#ff4d4f' : '#52c41a'}
        trailColor="#dce8ff"
        format={() => `${formatNumberValue(progressInfo.completed)}/${formatNumberValue(progressInfo.target)}`}
      />
    </div>
  );
}

export function createDashboardColumns({ comparisonMap, progressMap }) {
  const baseColumns = DASHBOARD_FIELDS.map((field) => {
    const numericSort = (a, b) => {
      const left = normalizeSortableValue(a?.[field.key], field.type);
      const right = normalizeSortableValue(b?.[field.key], field.type);
      return left - right;
    };

    const column = {
      title: field.title,
      dataIndex: field.key,
      key: field.key,
      sorter: field.type === 'text'
        ? (a, b) => String(a?.[field.key] ?? '').localeCompare(String(b?.[field.key] ?? ''))
        : numericSort,
      ellipsis: true,
      align: field.type === 'text' ? 'left' : 'right',
    };

    if (field.type === 'percent') {
      column.render = (value) => formatPercentValue(value);
    } else if (field.type === 'number') {
      column.render = (value, row) => (
        <div className="metric-cell">
          <span>{formatNumberValue(value)}</span>
          {COMPARISON_METRIC_KEYS.includes(field.key) ? renderComparisonTag(field.key, comparisonMap, row) : null}
        </div>
      );
    }

    return column;
  });

  baseColumns.push({
    title: '累计完成/目标比例',
    dataIndex: 'progress',
    key: 'progress',
    width: 220,
    render: (_, row) => renderTargetProgress(progressMap?.[row?.__rowKey]),
  });

  return baseColumns;
}
