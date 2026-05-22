import React from 'react';
import { Typography } from 'antd';

function AppHeader() {
  return (
    <div className="header-shell header-shell--centered">
      <Typography.Title level={3} className="header-title">
        定制项目组数据看板
      </Typography.Title>
      <Typography.Text className="header-subtitle">
        数据每日更新
      </Typography.Text>
    </div>
  );
}

export default AppHeader;
