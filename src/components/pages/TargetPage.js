import React, { useContext, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { AppStateContext } from '../../App';
import { Button, Card, DatePicker, Empty, Form, Input, Select, Space, Table, message } from 'antd';
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
      };
    })
    .filter((row) => stores.includes(row.storeName));
}

function TargetPage() {
  const { rows, monthlyTargets, setMonthlyTargets, cloudEnabled } = useContext(AppStateContext);
  const stores = useMemo(() => getUniqueStores(rows), [rows]);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [backstageTarget, setBackstageTarget] = useState('');
  const [salesTarget, setSalesTarget] = useState('');
  const tableData = useMemo(() => buildMonthRows(stores, monthlyTargets), [stores, monthlyTargets]);

  const saveTargets = async () => {
    if (!selectedStore || !selectedMonth) {
      message.warning('请先选择店铺和月份');
      return;
    }

    const monthKey = selectedMonth.format('YYYY-MM');
    const nextTarget = {
      backstageNewCount: backstageTarget,
      totalSales: salesTarget,
    };
    const key = buildTargetKey(selectedStore, monthKey);
    const nextTargets = { ...monthlyTargets, [key]: nextTarget };
    setMonthlyTargets(nextTargets);

    if (cloudEnabled) {
      await upsertTargetInCloud({ storeName: selectedStore, month: monthKey, targets: nextTarget });
      message.success('已保存到云端');
    } else {
      message.success('已保存到本地');
    }
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
          <Button type="primary" onClick={saveTargets}>保存目标</Button>
          <Table
            rowKey="key"
            dataSource={tableData}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '店铺', dataIndex: 'storeName', key: 'storeName' },
              { title: '月份', dataIndex: 'month', key: 'month' },
              { title: '后台上新目标', dataIndex: 'backstageNewCount', key: 'backstageNewCount' },
              { title: '总销量目标', dataIndex: 'totalSales', key: 'totalSales' },
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