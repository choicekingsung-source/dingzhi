import React, { useMemo } from 'react';
import { Progress, Space, Typography, List } from 'antd';
import { parseNumeric } from '../../utils/analytics';

function CompletionProgress({ rows, monthlyTarget, selectedMonth }) {
  const summary = useMemo(() => {
    const completedBackstage = rows.reduce((sum, row) => sum + parseNumeric(row?.backstageNewCount), 0);
    const completedSales = rows.reduce((sum, row) => sum + parseNumeric(row?.totalSales), 0);
    const backstageTarget = parseNumeric(monthlyTarget?.backstageNewCount);
    const salesTarget = parseNumeric(monthlyTarget?.totalSales);
    return {
      backstage: {
        completed: completedBackstage,
        target: backstageTarget,
        ratio: backstageTarget > 0 ? completedBackstage / backstageTarget : 0,
      },
      sales: {
        completed: completedSales,
        target: salesTarget,
        ratio: salesTarget > 0 ? completedSales / salesTarget : 0,
      },
    };
  }, [rows, monthlyTarget]);

  const renderProgress = (label, data, fieldLabel) => {
    const overTarget = data.target > 0 && data.ratio > 1;
    const color = data.target > 0 ? (overTarget ? '#ff4d4f' : '#52c41a') : '#1677ff';
    return (
      <div>
        <Typography.Text strong>{label}</Typography.Text>
        <div style={{ marginTop: 8, marginBottom: 8, color: '#1f3b73' }}>{fieldLabel}</div>
        <Progress percent={Math.min(Math.round(data.ratio * 100), 120)} status={overTarget ? 'exception' : 'active'} strokeColor={color} trailColor="#dce8ff" format={() => `${data.completed}/${data.target || '-'}`} />
      </div>
    );
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Text strong>{selectedMonth || '当月'} 目标进度</Typography.Text>
      {renderProgress('上新数量进度条', summary.backstage, '对应表格字段：后台上新数量')}
      {renderProgress('销量目标进度条', summary.sales, '对应表格字段：总销量')}
      <List
        size="small"
        dataSource={[
          { label: '后台上新累计完成', value: summary.backstage.completed },
          { label: '总销量累计完成', value: summary.sales.completed },
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
