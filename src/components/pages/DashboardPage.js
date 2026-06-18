import React, { useContext, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Button, Card, Col, DatePicker, Empty, Progress, Row, Select, Space, Tag, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons';
import { AppStateContext } from '../../App';
import {
  filterRowsByDateRange,
  formatRangeLabel,
  getPreviousPeriodRange,
  resolvePresetRange,
  parseDashboardDate,
} from '../../utils/dateFilters';
import {
  buildOverviewMetrics,
  buildStoreOverviewItems,
  filterRowsByMonth,
  getLatestDashboardDate,
} from '../../utils/dashboardOverview';
import { filterRowsByStores, getUniqueStores } from '../../utils/analytics';

const { RangePicker } = DatePicker;

const PRESET_RANGES = [
  { key: 'yesterday', label: '昨天' },
  { key: 'last7', label: '近7天' },
  { key: 'last14', label: '近14天' },
  { key: 'last30', label: '近30天' },
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

function formatCompare(compare) {
  if (!compare) {
    return null;
  }

  const icon = compare.direction === 'up'
    ? <ArrowUpOutlined />
    : compare.direction === 'down'
      ? <ArrowDownOutlined />
      : <MinusOutlined />;

  const sign = compare.direction === 'down' ? '-' : compare.direction === 'up' ? '+' : '';
  const color = compare.color === 'red' ? 'red' : compare.color === 'green' ? 'green' : 'default';

  return <Tag color={color} icon={icon}>环比 {compare.direction === 'flat' ? '0%' : `${sign}${compare.text}`}</Tag>;
}

function StoreProgress({ title, current, target, color }) {
  const ratio = target > 0 ? current / target : 0;
  const overTarget = target > 0 && ratio > 1;

  return (
    <div className="overview-progress">
      <div className="overview-progress__title">{title}</div>
      <Progress
        percent={Math.min(Math.round(ratio * 100), 120)}
        strokeColor={overTarget ? '#ff4d4f' : color}
        status={overTarget ? 'exception' : 'active'}
        size="small"
        format={() => `${current}/${target || '-'}`}
      />
    </div>
  );
}

function DashboardPage() {
  const { rows, monthlyTargets } = useContext(AppStateContext);
  const [preset, setPreset] = useState('last14');
  const [customRange, setCustomRange] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => getLatestDashboardDate(rows) || dayjs());
  const [selectedStores, setSelectedStores] = useState([]);

  const range = useMemo(() => {
    if (preset === 'custom') {
      return customRange;
    }
    return resolvePresetRange(preset);
  }, [preset, customRange]);

  const rangedRows = useMemo(() => filterRowsByDateRange(rows, range), [rows, range]);
  const previousRangedRows = useMemo(() => {
    const previousRange = getPreviousPeriodRange(range);
    return filterRowsByDateRange(rows, previousRange);
  }, [rows, range]);
  const latestDate = useMemo(() => getLatestDashboardDate(rows), [rows]);
  const stores = useMemo(() => getUniqueStores(rows), [rows]);
  const currentRows = useMemo(() => filterRowsByStores(rangedRows, selectedStores), [rangedRows, selectedStores]);
  const previousRows = useMemo(() => filterRowsByStores(previousRangedRows, selectedStores), [previousRangedRows, selectedStores]);
  const metrics = useMemo(() => buildOverviewMetrics(currentRows, previousRows), [currentRows, previousRows]);
  const storeItems = useMemo(() => buildStoreOverviewItems(currentRows, previousRows, monthlyTargets, selectedMonth), [currentRows, previousRows, monthlyTargets, selectedMonth]);
  const latestText = latestDate ? latestDate.format('YYYY-MM-DD') : '暂无数据';
  const monthOptions = useMemo(() => buildMonthOptions(rows), [rows]);
  const monthRows = useMemo(() => filterRowsByMonth(rows, selectedMonth), [rows, selectedMonth]);

  return (
    <div className="dashboard-overview">
      <Card
        className="dashboard-panel dashboard-overview__hero"
        title="数据看板"
        extra={(
          <Typography.Text type="secondary">
            当前范围：{formatRangeLabel(range)} ｜ 最新数据日期：{latestText}
          </Typography.Text>
        )}
      >
        <Space wrap size="middle" className="dashboard-overview__filters">
          <Space.Compact>
            {PRESET_RANGES.map((item) => (
              <Button
                key={item.key}
                type={preset === item.key ? 'primary' : 'default'}
                onClick={() => setPreset(item.key)}
              >
                {item.label}
              </Button>
            ))}
            <Button
              type={preset === 'custom' ? 'primary' : 'default'}
              onClick={() => setPreset('custom')}
            >
              自定义日期
            </Button>
          </Space.Compact>
          <RangePicker
            className="dashboard-overview__range"
            value={customRange}
            onChange={(value) => {
              setPreset('custom');
              setCustomRange(value);
            }}
            placeholder={['开始日期', '结束日期']}
          />
          <Select
            mode="multiple"
            className="dashboard-overview__store"
            value={selectedStores}
            onChange={setSelectedStores}
            options={stores.map((store) => ({ label: store, value: store }))}
            placeholder="筛选店铺，不选默认全部"
            allowClear
          />
          <Select
            value={selectedMonth ? selectedMonth.format('YYYY-MM') : undefined}
            onChange={(value) => setSelectedMonth(value ? dayjs(`${value}-01`) : getLatestDashboardDate(rows) || dayjs())}
            className="dashboard-overview__month"
            options={monthOptions}
            placeholder="选择月份"
            allowClear
          />
        </Space>
        <Alert
          showIcon
          type="info"
          className="dashboard-overview__alert"
          message={`当前筛选店铺：${selectedStores.length || stores.length} 个 ｜ 本月可用数据：${filterRowsByStores(monthRows, selectedStores).length} 条`}
        />
      </Card>

      <Row gutter={[16, 16]} className="dashboard-overview__metrics">
        {metrics.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.key}>
            <Card className="dashboard-panel overview-metric-card">
              <Typography.Text type="secondary">{item.label}</Typography.Text>
              <div className="overview-metric-card__value">{item.value}</div>
              <div className="overview-metric-card__compare">{formatCompare(item.compare)}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        className="dashboard-panel dashboard-overview__stores"
        title={`店铺完成情况（目标月份：${selectedMonth ? selectedMonth.format('YYYY-MM') : '未选择'}）`}
      >
        {storeItems.length ? (
          <Row gutter={[16, 16]}>
            {storeItems.map((store) => (
              <Col xs={24} lg={12} xxl={8} key={store.storeName}>
                <Card
                  className="store-overview-card"
                  title={store.storeName}
                  extra={<Tag color="blue">目标月份 {store.targetMonth}</Tag>}
                >
                  <div className="store-overview-card__stats">
                    <div>
                      <Typography.Text type="secondary">当期总销量</Typography.Text>
                      <div className="store-overview-card__number">{store.totalSales}</div>
                      {formatCompare(store.compare?.totalSales)}
                    </div>
                    <div>
                      <Typography.Text type="secondary">当期发布前端数量</Typography.Text>
                      <div className="store-overview-card__number">{store.publishFrontCount}</div>
                      {formatCompare(store.compare?.publishFrontCount)}
                    </div>
                    <div>
                      <Typography.Text type="secondary">当期后台上新数量</Typography.Text>
                      <div className="store-overview-card__number">{store.backstageNewCount}</div>
                      {formatCompare(store.compare?.backstageNewCount)}
                    </div>
                    <div>
                      <Typography.Text type="secondary">前端在售SKC数量</Typography.Text>
                      <div className="store-overview-card__number">{store.frontOnSaleSkcCount}</div>
                      {formatCompare(store.compare?.frontOnSaleSkcCount)}
                    </div>
                  </div>
                  <StoreProgress
                    title="总销量目标进度"
                    current={store.progress.totalSales.current}
                    target={store.progress.totalSales.target}
                    color="#1677ff"
                  />
                  <StoreProgress
                    title="上新数量目标进度"
                    current={store.progress.backstageNewCount.current}
                    target={store.progress.backstageNewCount.target}
                    color="#1677ff"
                  />
                  <div className="store-overview-card__hint">共 {store.rowCount} 条明细</div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="当前筛选范围内暂无店铺数据" />
        )}
      </Card>
    </div>
  );
}

export default DashboardPage;
