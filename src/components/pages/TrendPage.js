import React, { useContext, useMemo, useState } from 'react';
import { Card, Select, Space } from 'antd';
import { AppStateContext } from '../../App';
import TrendChart from '../charts/TrendChart';
import StoreSelector from '../controls/StoreSelector';
import { getUniqueStores, filterRowsByStores } from '../../utils/analytics';

function TrendPage() {
  const { rows } = useContext(AppStateContext);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['totalSales', 'backstageNewCount', 'publishFrontCount', 'templateCount', 'pricePassCount']);
  const stores = useMemo(() => getUniqueStores(rows), [rows]);
  const chartRows = useMemo(() => filterRowsByStores(rows, selectedStores), [rows, selectedStores]);

  return (
    <Card title="趋势页面" className="dashboard-panel">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <StoreSelector stores={stores} selectedStores={selectedStores} onChange={setSelectedStores} />
        <Select mode="multiple" allowClear style={{ width: '100%' }} value={selectedMetrics} onChange={setSelectedMetrics} options={[
          { label: '总销量', value: 'totalSales' },
          { label: '后台上新数量', value: 'backstageNewCount' },
          { label: '发布前端数量', value: 'publishFrontCount' },
          { label: '关联模板数量', value: 'templateCount' },
          { label: '核价通过数量', value: 'pricePassCount' },
        ]} />
        <TrendChart rows={chartRows} selectedMetrics={selectedMetrics} />
      </Space>
    </Card>
  );
}

export default TrendPage;
