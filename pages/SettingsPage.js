import React, { useContext } from 'react';
import { Card, Empty, Typography } from 'antd';
import { AppStateContext } from '../../App';

function SettingsPage() {
  const { cloudEnabled, cloudError } = useContext(AppStateContext);

  return (
    <Card title="配置页面" className="dashboard-panel">
      <Empty description="这里可查看云端配置状态与后续扩展" />
      <Typography.Paragraph style={{ marginTop: 16 }}>
        云端状态：{cloudEnabled ? '已配置 Supabase 环境变量' : '未配置 Supabase 环境变量'}
      </Typography.Paragraph>
      <Typography.Paragraph>
        云端错误：{cloudError || '无'}
      </Typography.Paragraph>
    </Card>
  );
}

export default SettingsPage;