import React from 'react';
import { Menu } from 'antd';

function Sidebar() {
  return (
    <div className="sidebar-shell">
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["dashboard"]}
        items={[
          { key: 'dashboard', label: '数据看板' },
          { key: 'table', label: '表格视图' },
          { key: 'chart', label: '趋势图' },
          { key: 'settings', label: '配置占位' },
        ]}
      />
    </div>
  );
}

export default Sidebar;
