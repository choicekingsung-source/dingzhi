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
  Select,
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
import { isCloudEnabled, replaceRowsInCloud } from '../../utils/cloudRepository';

const { RangePicker } = DatePicker;

function DataPage() {
  const { rows, setRows, monthlyTargets, cloudEnabled, loadingCloud, cloudError } = useContext(AppStateContext);
  const [keyword, setKeyword] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [range, setRange] = useState(null);
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
      setRows(importedRows);
      if (isCloudEnabled()) {
        await replaceRowsInCloud(importedRows);
        message.success(`已导入并同步云端，共 ${importedRows.length} 条`);
      } else {
        message.success(`已导入 ${importedRows.length} 条记录`);
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
        <RangePicker value={range} onChange={setRange} style={{ minWidth: 320 }} />
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={setSelectedMonth}
          style={{ minWidth: 180 }}
          placeholder="选择进度月份"
        />
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