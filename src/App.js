import React, { createContext, useMemo, useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

export const AppStateContext = createContext(null);

const { Header, Sider, Content } = Layout;

function App() {
  const [filters, setFilters] = useState({
    dateRange: null,
    store: [],
    keyword: '',
  });

  const [viewState, setViewState] = useState({
    selectedMetrics: ['totalSales'],
    pageSize: 10,
  });

  const appState = useMemo(() => ({
    filters,
    setFilters,
    viewState,
    setViewState,
  }), [filters, viewState]);

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
