import React, { useContext, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { AppStateContext } from '../../App';
import { Button, Card, DatePicker, Empty, Form, Input, Select, Space, Table, Typography, message } from 'antd';
import { upsertTargetInCloud } from '../../utils/cloudRepository';
import { buildTargetKey } from '../../utils/cloudSchema';
import { getUniqueStores } from '../../utils/analytics';

function buildMonthRows(stores, monthlyTargets) {
  return Object.entries(monthlyTargets)
    .map(([key, targets]) => {
      const [storeName, month] = key.split('::');
      return {
        key,
        storeName,
        month,
        backstageNewCount: targets?.backstageNewCount || '',
        totalSales: targets?.totalSales || '',
        logs: targets?.logs || [],
      };
    })
    .filter((row) => stores.includes(row.storeName))
    .sort((a, b) => a.storeName.localeCompare(b.storeName, 'zh-CN') || a.month.localeCompare(b.month));
}

function TargetPage() {
  const { rows, monthlyTargets, setMonthlyTargets, cloudEnabled } = useContext(AppStateContext);
  const stores = useMemo(() => getUniqueStores(rows), [rows]);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [backstageTarget, setBackstageTarget] = useState('');
  const [salesTarget, setSalesTarget] = useState('');
  const [editingKey, setEditingKey] = useState('');
  const tableData = useMemo(() => buildMonthRows(stores, monthlyTargets), [stores, monthlyTargets]);

  const resetForm = () => {
    setSelectedStore('');
    setSelectedMonth(dayjs());
    setBackstageTarget('');
    setSalesTarget('');
    setEditingKey('');
  };

  const saveTargets = async () => {
    if (!selectedStore || !selectedMonth) {
      message.warning('请先选择店铺和月份');
      return;
    }

    const monthKey = selectedMonth.format('YYYY-MM');
    const key = buildTargetKey(selectedStore, monthKey);
    const previous = monthlyTargets[key] || {};
    const nextTarget = {
      backstageNewCount: backstageTarget,
      totalSales: salesTarget,
      logs: [
        ...(previous.logs || []),
        {
          changedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          before: {
            backstageNewCount: previous.backstageNewCount || '',
            totalSales: previous.totalSales || '',
          },
          after: {
            backstageNewCount: backstageTarget,
            totalSales: salesTarget,
          },
        },
      ],
    };

    const nextTargets = { ...monthlyTargets, [key]: nextTarget };
    setMonthlyTargets(nextTargets);

    if (cloudEnabled) {
      await upsertTargetInCloud({ storeName: selectedStore, month: monthKey, targets: nextTarget });
      message.success(editingKey ? '已修改并保存到云端' : '已保存到云端');
    } else {
      message.success(editingKey ? '已修改并保存到本地' : '已保存到本地');
    }

    resetForm();
  };

  const handleEdit = (record) => {
    setEditingKey(record.key);
    setSelectedStore(record.storeName);
    setSelectedMonth(dayjs(`${record.month}-01`));
    setBackstageTarget(record.backstageNewCount || '');
    setSalesTarget(record.totalSales || '');
  };

  const expandedRowRender = (record) => {
    const logs = record.logs || [];
    if (!logs.length) {
      return <Typography.Text type="secondary">暂无修改日志</Typography.Text>;
    }

    return (
      <Table
        rowKey={(item, index) => `${record.key}-${index}`}
        pagination={false}
        size="small"
        dataSource={logs}
        columns={[
          { title: '修改时间', dataIndex: 'changedAt', key: 'changedAt' },
          { title: '修改前-上新目标', dataIndex: ['before', 'backstageNewCount'], key: 'beforeBackstage' },
          { title: '修改前-销量目标', dataIndex: ['before', 'totalSales'], key: 'beforeSales' },
          { title: '修改后-上新目标', dataIndex: ['after', 'backstageNewCount'], key: 'afterBackstage' },
          { title: '修改后-销量目标', dataIndex: ['after', 'totalSales'], key: 'afterSales' },
        ]}
      />
    );
  };

  return (
    <Card title="目标设置页面" className="dashboard-panel">
      {stores.length ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Select
            style={{ width: '100%' }}
            value={selectedStore || undefined}
            onChange={setSelectedStore}
            placeholder="选择店铺"
            options={stores.map((store) => ({ label: store, value: store }))}
          />
          <DatePicker picker="month" style={{ width: '100%' }} value={selectedMonth} onChange={setSelectedMonth} />
          <Form layout="vertical">
            <Form.Item label="后台上新目标">
              <Input value={backstageTarget} onChange={(e) => setBackstageTarget(e.target.value)} />
            </Form.Item>
            <Form.Item label="总销量目标">
              <Input value={salesTarget} onChange={(e) => setSalesTarget(e.target.value)} />
            </Form.Item>
          </Form>
          <Space>
            <Button type="primary" onClick={saveTargets}>{editingKey ? '保存修改' : '保存目标'}</Button>
            {editingKey ? <Button onClick={resetForm}>取消修改</Button> : null}
          </Space>
          <Table
            rowKey="key"
            dataSource={tableData}
            expandable={{ expandedRowRender }}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '店铺', dataIndex: 'storeName', key: 'storeName' },
              { title: '月份', dataIndex: 'month', key: 'month' },
              { title: '后台上新目标', dataIndex: 'backstageNewCount', key: 'backstageNewCount' },
              { title: '总销量目标', dataIndex: 'totalSales', key: 'totalSales' },
              {
                title: '操作',
                key: 'actions',
                render: (_, record) => <Button type="link" onClick={() => handleEdit(record)}>修改</Button>,
              },
            ]}
          />
        </Space>
      ) : (
        <Empty description="请先导入数据后再设置目标" />
      )}
    </Card>
  );
}

export default TargetPage;