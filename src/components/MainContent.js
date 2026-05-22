import React, { useContext, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  DownloadOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  UndoOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  message,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { AppStateContext } from '../App';
import { createDashboardColumns } from '../utils/dashboardColumns';
import { DATE_PRESETS, filterRowsByDateRange, formatRangeLabel, getPreviousPeriodRange, resolvePresetRange } from '../utils/dateFilters';
import { exportRowsToExcel, filterRowsByKeyword, parseExcelFile } from '../utils/excel';
import { buildComparisonMap, buildProgressMap, CHART_METRICS, filterRowsByStores, getUniqueStores } from '../utils/analytics';
import { saveDashboardState } from '../utils/storage';
import TrendChart from './charts/TrendChart';
import CompletionProgress from './widgets/CompletionProgress';
import StoreSelector from './controls/StoreSelector';

const { RangePicker } = DatePicker;
const DEFAULT_VISIBLE_METRICS = ['totalSales', 'backstageNewCount', 'publishFrontCount', 'templateCount', 'pricePassCount'];
const DEFAULT_PAGE_SIZE = 10;
const MONTH_OPTIONS = [
  { label: '2026年5月', value: '2026-05' },
  { label: '2026年6月', value: '2026-06' },
  { label: '2026年7月', value: '2026-07' },
];

function MainContent() {
  const {
    rows,
    setRows,
    monthlyTargets,
    setMonthlyTargets,
    currentView,
  } = useContext(AppStateContext);

  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(DEFAULT_VISIBLE_METRICS);
  const [selectedMonth, setSelectedMonth] = useState(MONTH_OPTIONS[0].value);
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [datePreset, setDatePreset] = useState('last7');
  const [customRange, setCustomRange] = useState(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    saveDashboardState({ rows, monthlyTargets, currentView });
  }, [rows, monthlyTargets, currentView]);

  const activeRange = useMemo(() => (datePreset === 'custom' ? customRange : resolvePresetRange(datePreset, dayjs())), [datePreset, customRange]);
  const stores = useMemo(() => getUniqueStores(rows), [rows]);
  const dateFilteredRows = useMemo(() => filterRowsByDateRange(rows, activeRange), [rows, activeRange]);
  const keywordFilteredRows = useMemo(() => filterRowsByKeyword(dateFilteredRows, keyword), [dateFilteredRows, keyword]);
  const chartRows = useMemo(() => filterRowsByStores(keywordFilteredRows, selectedStores), [keywordFilteredRows, selectedStores]);
  const previousPeriodRows = useMemo(() => {
    const previousRange = getPreviousPeriodRange(activeRange);
    const previousDateRows = filterRowsByDateRange(rows, previousRange);
    const previousKeywordRows = filterRowsByKeyword(previousDateRows, keyword);
    return filterRowsByStores(previousKeywordRows, selectedStores);
  }, [activeRange, keyword, rows, selectedStores]);
  const periodSpanDays = useMemo(() => {
    if (!activeRange || !activeRange[0] || !activeRange[1]) return 0;
    return activeRange[1].diff(activeRange[0], 'day') + 1;
  }, [activeRange]);
  const comparisonMap = useMemo(() => buildComparisonMap(keywordFilteredRows, previousPeriodRows, periodSpanDays), [keywordFilteredRows, previousPeriodRows, periodSpanDays]);
  const progressMap = useMemo(() => buildProgressMap(keywordFilteredRows, monthlyTargets[selectedMonth] || {}), [keywordFilteredRows, monthlyTargets, selectedMonth]);
  const columns = useMemo(() => createDashboardColumns({ rows: keywordFilteredRows, monthlyTargets, selectedMonth, comparisonMap, progressMap }), [keywordFilteredRows, monthlyTargets, selectedMonth, comparisonMap, progressMap]);

  const persistRows = (nextRows) => {
    setRows(nextRows);
    saveDashboardState({ rows: nextRows, monthlyTargets, currentView });
  };

  const persistTargets = (nextTargets) => {
    setMonthlyTargets(nextTargets);
    saveDashboardState({ rows, monthlyTargets: nextTargets, currentView });
  };

  const handleFileImport = async (file) => {
    setLoading(true);
    try {
      const importedRows = await parseExcelFile(file);
      persistRows(importedRows);
      setSelectedStores([]);
      message.success(`已导入 ${importedRows.length} 条记录`);
    } catch (error) {
      message.error(error?.message || 'Excel 解析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!keywordFilteredRows.length) {
      message.warning('当前没有可导出的筛选数据');
      return;
    }
    try {
      exportRowsToExcel(keywordFilteredRows);
      message.success('已开始导出 Excel');
    } catch (error) {
      message.error(error?.message || '导出失败');
    }
  };

  const handleClearView = () => {
    Modal.confirm({
      title: '确认清空当前视图？',
      icon: <ExclamationCircleOutlined />,
      content: '仅清空筛选和当前视图，不删除原始导入数据。你可以撤销最近一次清空。',
      okText: '确认清空',
      cancelText: '取消',
      onOk: () => {
        setUndoSnapshot({ keyword, selectedStores, selectedMetrics, selectedMonth, datePreset, customRange, pageSize, currentPage });
        setKeyword('');
        setSelectedStores([]);
        setSelectedMetrics(DEFAULT_VISIBLE_METRICS);
        setSelectedMonth(MONTH_OPTIONS[0].value);
        setDatePreset('last7');
        setCustomRange(null);
        setPageSize(DEFAULT_PAGE_SIZE);
        setCurrentPage(1);
        message.success('已清空当前视图');
      },
    });
  };

  const handleUndoClear = () => {
    if (!undoSnapshot) {
      message.info('没有可撤销的清空记录');
      return;
    }
    setKeyword(undoSnapshot.keyword || '');
    setSelectedStores(undoSnapshot.selectedStores || []);
    setSelectedMetrics(undoSnapshot.selectedMetrics || DEFAULT_VISIBLE_METRICS);
    setSelectedMonth(undoSnapshot.selectedMonth || MONTH_OPTIONS[0].value);
    setDatePreset(undoSnapshot.datePreset || 'last7');
    setCustomRange(undoSnapshot.customRange ? [...undoSnapshot.customRange] : null);
    setPageSize(undoSnapshot.pageSize || DEFAULT_PAGE_SIZE);
    setCurrentPage(undoSnapshot.currentPage || 1);
    setUndoSnapshot(null);
    message.success('已撤销最近一次清空');
  };

  const updateMonthlyTarget = (month, metricKey, value) => {
    const nextTargets = {
      ...monthlyTargets,
      [month]: {
        ...(monthlyTargets[month] || {}),
        [metricKey]: value,
      },
    };
    persistTargets(nextTargets);
  };

  const tableView = (
    <Card title="Excel 导入与数据表格" extra={<Tag color="blue">数据每日更新</Tag>} className="dashboard-table-card dashboard-panel">
      <Space wrap size="middle" className="dashboard-toolbar">
        <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={(file) => { handleFileImport(file); return false; }}>
          <Button type="primary" icon={<UploadOutlined />}>上传 Excel</Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!keywordFilteredRows.length}>导出当前筛选</Button>
        <Button danger onClick={handleClearView}>清空视图</Button>
        <Button icon={<UndoOutlined />} onClick={handleUndoClear} disabled={!undoSnapshot}>撤销清空</Button>
        <Input.Search allowClear placeholder="搜索平台、店铺、日期或任意字段" prefix={<SearchOutlined />} value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 280 }} />
      </Space>

      <div className="filter-bar">
        <Space wrap size="middle" className="dashboard-filter-group">
          <Segmented options={DATE_PRESETS.map((item) => ({ label: item.label, value: item.key }))} value={datePreset} onChange={(value) => setDatePreset(value)} />
          <RangePicker
            value={customRange}
            onChange={(value) => { setCustomRange(value); setDatePreset('custom'); }}
            allowClear
            disabled={datePreset !== 'custom'}
            className="dashboard-range-picker"
            presets={[
              { label: '昨天', value: resolvePresetRange('yesterday', dayjs()) },
              { label: '近7天', value: resolvePresetRange('last7', dayjs()) },
              { label: '近30天', value: resolvePresetRange('last30', dayjs()) },
            ]}
          />
        </Space>
      </div>

      <div className="dashboard-summary">
        <Typography.Text type="secondary">当前周期：{formatRangeLabel(activeRange)}</Typography.Text>
        <Typography.Text type="secondary">当前数据：{keywordFilteredRows.length} 条</Typography.Text>
      </div>

      <Table
        rowKey="__rowKey"
        columns={columns}
        dataSource={keywordFilteredRows}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
          onShowSizeChange: (_, size) => { setCurrentPage(1); setPageSize(size); },
        }}
        scroll={{ x: 1680 }}
        locale={{
          emptyText: rows.length ? <Empty description="未找到匹配的筛选结果" /> : <Empty description="请先上传 Excel 文件" />,
        }}
      />
    </Card>
  );

  const chartView = (
    <Card title="趋势图" extra={<Tag color="blue">数据每日更新</Tag>} className="dashboard-panel">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <StoreSelector stores={stores} selectedStores={selectedStores} onChange={setSelectedStores} />
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="选择可视化字段"
          value={selectedMetrics}
          onChange={setSelectedMetrics}
          options={CHART_METRICS.map((item) => ({ label: item.label, value: item.key }))}
        />
        <TrendChart rows={chartRows} selectedMetrics={selectedMetrics} />
      </Space>
    </Card>
  );

  const settingsView = (
    <Card title="配置占位" extra={<Tag color="blue">数据每日更新</Tag>} className="dashboard-panel">
      <Empty description="后续可扩展为数据库同步、历史版本、权限配置等" />
    </Card>
  );

  const dashboardView = (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>{tableView}</Col>
      <Col xs={24} lg={8}>
        {chartView}
        <Card title="进度条" style={{ marginTop: 16 }} className="dashboard-panel">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Select style={{ width: '100%' }} value={selectedMonth} onChange={setSelectedMonth} options={MONTH_OPTIONS} />
            <Input type="number" min={0} placeholder="输入月目标值" value={monthlyTargets[selectedMonth]?.backstageNewCount || ''} onChange={(event) => updateMonthlyTarget(selectedMonth, 'backstageNewCount', event.target.value)} />
            <Input type="number" min={0} placeholder="输入销量目标值" value={monthlyTargets[selectedMonth]?.totalSales || ''} onChange={(event) => updateMonthlyTarget(selectedMonth, 'totalSales', event.target.value)} />
            <CompletionProgress rows={keywordFilteredRows} monthlyTarget={monthlyTargets[selectedMonth] || {}} selectedMonth={selectedMonth} />
          </Space>
        </Card>
      </Col>
    </Row>
  );

  let contentView = dashboardView;
  if (currentView === 'table') contentView = tableView;
  if (currentView === 'chart') contentView = chartView;
  if (currentView === 'settings') contentView = settingsView;

  return <div className="main-shell dashboard-shell">{contentView}</div>;
}

export default MainContent;
