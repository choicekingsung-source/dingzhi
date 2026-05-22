import React, { useContext } from 'react';
import { Menu } from 'antd';
import { AppStateContext } from '../App';

const MENU_ITEMS = [
  { key: 'dashboard', label: '数据看板' },
  { key: 'data', label: '表格视图' },
  { key: 'trend', label: '趋势图' },
  { key: 'target', label: '目标设置' },
  { key: 'settings', label: '配置页面' },
];

function Sidebar() {
  const { currentView, setCurrentView } = useContext(AppStateContext);

  return (
    <div className="sidebar-shell">
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[currentView]}
        items={MENU_ITEMS}
        onClick={({ key }) => setCurrentView(key)}
      />
    </div>
  );
}

export default Sidebar;