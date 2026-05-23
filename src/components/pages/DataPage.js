import React, { useContext, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  DownloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  Space,
  Table,
  Typography,
  Upload,
  message,
} from 'antd';
import { AppStateContext } from '../../App';
import { createDashboardColumns } from '../../utils/dashboardColumns';
import { filterRowsByDateRange, formatRangeLabel } from '../../utils/dateFilters';
import { exportRowsToExcel, filterRowsByKeyword, parseExcelFile } from '../../utils/excel';
import { appendRows, appendRowsInCloud, isCloudEnabled } from '../../utils/cloudRepository';

const { RangePicker } = DatePicker;

function resolveQuickRange(type) {
  const today = dayjs().startOf('day');
  if (type === 'yesterday') return [today.subtract(1, 'day'), today.subtract(1, 'day')];
  if (type === 'last7') return [today.subtract(6, 'day'), today];
  if (type === 'last14') return [today.subtract(13, 'day'), today];
  if (type === 'last30') return [today.subtract(29, 'day'), today];
  return null;
}

function DataPage() {
  const { rows, setRows, monthlyTargets, cloudEnabled, loadingCloud, cloudError } = useContext(AppStateContext);
  const [keyword, setKeyword] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [range, setRange] = useState(resolveQuickRange('last30'));
  const [pageSize, setPageSize] = useState(10);

  const monthKey = selectedMonth ? selectedMonth.format('YYYY-MM') : dayjs().format('YYYY-MM');
  const filteredByDate = useMemo(() => filterRowsByDateRange(rows, range), [rows, range]);
  const filteredRows = useMemo(() => filterRowsByKeyword(filteredByDate, keyword), [filteredByDate, keyword]);
  const columns = useMemo(
    () => createDashboardColumns({ rows: filteredRows, monthlyTargets, selectedMonth: monthKey }),
    [filteredRows, monthlyTargets, monthKey],
  );

  const handleImport = async (file) => {
    try {
      const importedRows = await parseExcelFile(file);
      const mergedRows = appendRows(rows, importedRows);
      setRows(mergedRows);
      if (isCloudEnabled()) {
        await appendRowsInCloud(rows, importedRows);
        message.success(`已追加导入并同步云端，本次新增 ${importedRows.length} 条`);
      } else {
        message.success(`已追加导入 ${importedRows.length} 条记录`);
      }
    } catch (error) {
      message.error(error?.message || '导入失败');
    }
    return false;
  };

  return (
    <Card
      title="数据页面"
      extra={<Typography.Text type="secondary">当前周期：{formatRangeLabel(range)}</Typography.Text>}
      className="dashboard-panel"
    >
      <Space wrap size="middle" className="dashboard-toolbar">
        <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={handleImport}>
          <Button type="primary" icon={<UploadOutlined />}>上传 Excel</Button>
        </Upload>
        <Button icon={<DownloadOutlined />} onClick={() => exportRowsToExcel(filteredRows)} disabled={!filteredRows.length}>导出当前筛选</Button>
        <Input.Search allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索平台、店铺、日期或任意字段" style={{ width: 280 }} />
        <Space.Compact>
          <Button onClick={() => setRange(resolveQuickRange('yesterday'))}>昨天</Button>
          <Button onClick={() => setRange(resolveQuickRange('last7'))}>近7天</Button>
          <Button onClick={() => setRange(resolveQuickRange('last14'))}>近14天</Button>
          <Button onClick={() => setRange(resolveQuickRange('last30'))}>近30天</Button>
        </Space.Compact>
        <RangePicker value={range} onChange={setRange} style={{ minWidth: 320 }} />
        <DatePicker picker="month" value={selectedMonth} onChange={setSelectedMonth} style={{ minWidth: 180 }} placeholder="选择进度月份" />
      </Space>

      <div className="dashboard-summary">
        <Typography.Text type="secondary">云端状态：{cloudEnabled ? (loadingCloud ? '加载中' : '已启用') : '未启用，当前为本地模式'}</Typography.Text>
        <Typography.Text type="secondary">{cloudError ? `云端错误：${cloudError}` : `当前数据：${filteredRows.length} 条`}</Typography.Text>
      </div>

      <Table
        rowKey="__rowKey"
        columns={columns}
        dataSource={filteredRows}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
        scroll={{ x: 1900 }}
        locale={{ emptyText: rows.length ? <Empty description="未找到匹配数据" /> : <Empty description="请先导入数据" /> }}
      />
    </Card>
  );
}

export default DataPage;