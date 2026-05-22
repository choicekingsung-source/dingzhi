import React from 'react';
import { Typography, Tag } from 'antd';

function AppHeader() {
  return (
    <div className="header-shell">
      <div>
        <Typography.Title level={3} style={{ margin: 0, color: '#fff' }}>
          定制项目组数据看板
        </Typography.Title>
        <Typography.Text style={{ color: 'rgba(255,255,255,0.78)' }}>
          蓝色主题 React + Ant Design 骨架
        </Typography.Text>
      </div>
      <Tag color="geekblue">Skeleton</Tag>
    </div>
  );
}

export default AppHeader;
