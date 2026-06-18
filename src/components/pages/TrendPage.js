import React, { useContext, useMemo, useState } from 'react';
import { Card, DatePicker, Radio, Select, Space, Typography } from 'antd';
import { AppStateContext } from '../../App';
import TrendChart from '../charts/TrendChart';
import StoreSelector from '../controls/StoreSelector';
import { filterRowsByStores, getUniqueStores } from '../../utils/analytics';
import { filterRowsByDateRange, parseDashboardDate } from '../../utils/dateFilters';

const { RangePicker } = DatePicker;

const METRIC_OPTIONS = [
  { label: '总销量', value: 'totalSales' },
  { label: '后台上新数量', value: 'backstageNewCount' },
  { label: '发布前端数量', value: 'publishFrontCount' },
  { label: '前端在售SKC数量', value: 'frontOnSaleSkcCount' },
  { label: '关联模板数量', value: 'templateCount' },
  { label: '核价通过数量', value: 'pricePassCount' },
];

function buildMonthOptions(rows) {
  return Array.from(
    new Set(
      (rows || [])
        .map((row) => parseDashboardDate(row?.date)?.format('YYYY-MM'))
        .filter(Boolean),
    ),
  )
    .sort((left, right) => right.localeCompare(left))
    .map((month) => ({ label: month, value: month }));
}

function TrendPage() {
  const { rows } = useContext(AppStateContext);
  const [selectedStores, setSelectedStores] = useState([]);
  const [timeMode, setTimeMode] = useState('range');
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState();
  const [selectedMetric, setSelectedMetric] = useState('totalSales');

  const stores = useMemo(() => getUniqueStores(rows), [rows]);
  const monthOptions = useMemo(() => buildMonthOptions(rows), [rows]);
  const storeFilteredRows = useMemo(() => filterRowsByStores(rows, selectedStores), [rows, selectedStores]);

  const chartRows = useMemo(() => {
    if (timeMode === 'month' && selectedMonth) {
      return storeFilteredRows.filter((row) => {
        const parsed = parseDashboardDate(row?.date);
        return parsed ? parsed.format('YYYY-MM') === selectedMonth : false;
      });
    }

    if (timeMode === 'range' && selectedRange?.[0] && selectedRange?.[1]) {
      return filterRowsByDateRange(storeFilteredRows, selectedRange);
    }

    return storeFilteredRows;
  }, [selectedMonth, selectedRange, storeFilteredRows, timeMode]);

  return (
    <Card title="趋势图" className="dashboard-panel">
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div>
          <Typography.Text strong>第一步：选择店铺</Typography.Text>
          <StoreSelector stores={stores} selectedStores={selectedStores} onChange={setSelectedStores} />
        </div>

        <div>
          <Typography.Text strong>第二步：选择时间</Typography.Text>
          <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 10 }}>
            <Radio.Group value={timeMode} onChange={(event) => setTimeMode(event.target.value)}>
              <Radio.Button value="range">日期范围</Radio.Button>
              <Radio.Button value="month">按月份</Radio.Button>
            </Radio.Group>
            {timeMode === 'range' ? (
              <RangePicker
                value={selectedRange}
                onChange={setSelectedRange}
                style={{ minWidth: 320 }}
                placeholder={['开始日期', '结束日期']}
              />
            ) : (
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions}
                placeholder="选择月份"
                style={{ minWidth: 200 }}
                allowClear
              />
            )}
          </Space>
        </div>

        <div>
          <Typography.Text strong>第三步：选择指标</Typography.Text>
          <Select
            value={selectedMetric}
            onChange={setSelectedMetric}
            options={METRIC_OPTIONS}
            style={{ width: '100%', marginTop: 10 }}
          />
        </div>

        <TrendChart rows={chartRows} selectedMetrics={[selectedMetric]} />
      </Space>
    </Card>
  );
}

export default TrendPage;
