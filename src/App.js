import React, { createContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { loadDashboardState, saveDashboardState } from './utils/storage';

export const AppStateContext = createContext(null);

const { Header, Sider, Content } = Layout;

const initialPersistedState = loadDashboardState() || {};

function App() {
  const [filters, setFilters] = useState(initialPersistedState.filters || {
    dateRange: null,
    store: [],
    keyword: '',
    datePreset: 'last7',
  });
  const [viewState, setViewState] = useState(initialPersistedState.viewState || {
    selectedMetrics: ['totalSales'],
    pageSize: 10,
    selectedMonth: '',
    activeView: 'dashboard',
  });
  const [rows, setRows] = useState(initialPersistedState.rows || []);
  const [monthlyTargets, setMonthlyTargets] = useState(initialPersistedState.monthlyTargets || {});
  const [currentView, setCurrentView] = useState(initialPersistedState.currentView || 'dashboard');

  useEffect(() => {
    saveDashboardState({ filters, viewState, rows, monthlyTargets, currentView });
  }, [filters, viewState, rows, monthlyTargets, currentView]);

  const appState = useMemo(() => ({
    filters,
    setFilters,
    viewState,
    setViewState,
    rows,
    setRows,
    monthlyTargets,
    setMonthlyTargets,
    currentView,
    setCurrentView,
  }), [filters, viewState, rows, monthlyTargets, currentView]);

  return (
    <AppStateContext.Provider value={appState}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            colorInfo: '#1677ff',
            colorSuccess: '#52c41a',
            colorError: '#ff4d4f',
            colorBgLayout: '#edf4ff',
            borderRadius: 16,
          },
        }}
      >
        <Layout className="app-layout">
          <Header className="app-header">
            <AppHeader />
          </Header>
          <Layout>
            <Sider width={240} className="app-sider">
              <Sidebar />
            </Sider>
            <Content className="app-content">
              <MainContent />
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </AppStateContext.Provider>
  );
}

export default App;
