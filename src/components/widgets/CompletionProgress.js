import React, { useMemo } from 'react';
import { Progress, Space, Typography, List } from 'antd';
import { computeCompletionRatio } from '../../utils/analytics';

function CompletionProgress({ rows, monthlyTarget }) {
  const summary = useMemo(() => computeCompletionRatio(rows, monthlyTarget), [rows, monthlyTarget]);
  const percent = Math.min(Math.round(summary.ratio * 100), 120);
  const overTarget = summary.target > 0 && summary.completed > summary.target;
  const status = summary.target > 0 ? (overTarget ? 'exception' : 'normal') : 'active';
  const strokeColor = summary.target > 0 ? (overTarget ? '#ff4d4f' : '#52c41a') : '#1677ff';

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text strong>累计完成 / 目标比例</Typography.Text>
      <Progress percent={percent} status={status} strokeColor={strokeColor} trailColor="#dce8ff" />
      <List
        size="small"
        dataSource={[
          { label: '累计完成', value: summary.completed },
          { label: '目标值', value: summary.target },
          { label: '完成比例', value: summary.target > 0 ? `${(summary.ratio * 100).toFixed(2)}%` : '未设置' },
        ]}
        renderItem={(item) => (
          <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Typography.Text>{item.label}</Typography.Text>
              <Typography.Text strong>{item.value}</Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </Space>
  );
}

export default CompletionProgress;
