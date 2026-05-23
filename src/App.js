import React, { createContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { loadDashboardState, saveDashboardState } from './utils/storage';
import {
  fetchRowsFromCloud,
  fetchTargetsFromCloud,
  isCloudEnabled,
  replaceRowsInCloud,
  replaceTargetsInCloud,
} from './utils/cloudRepository';

dayjs.locale('zh-cn');

export const AppStateContext = createContext(null);

const { Header, Sider, Content } = Layout;
const initialPersistedState = loadDashboardState() || {};

function App() {
  const [rows, setRows] = useState(initialPersistedState.rows || []);
  const [monthlyTargets, setMonthlyTargets] = useState(initialPersistedState.monthlyTargets || {});
  const [currentView, setCurrentView] = useState(initialPersistedState.currentView || 'dashboard');
  const [loadingCloud, setLoadingCloud] = useState(isCloudEnabled());
  const [cloudError, setCloudError] = useState('');

  useEffect(() => {
    saveDashboardState({ rows, monthlyTargets, currentView });
  }, [rows, monthlyTargets, currentView]);

  useEffect(() => {
    let active = true;

    async function loadCloudData() {
      if (!isCloudEnabled()) {
        setLoadingCloud(false);
        return;
      }

      try {
        setLoadingCloud(true);
        setCloudError('');
        const [cloudRows, cloudTargets] = await Promise.all([
          fetchRowsFromCloud(),
          fetchTargetsFromCloud(),
        ]);

        if (!active) {
          return;
        }

        if (cloudRows.length > 0) {
          setRows(cloudRows);
        } else if ((initialPersistedState.rows || []).length > 0) {
          await replaceRowsInCloud(initialPersistedState.rows);
          setRows(initialPersistedState.rows);
        }

        const targetKeys = Object.keys(cloudTargets || {});
        if (targetKeys.length > 0) {
          setMonthlyTargets(cloudTargets);
        } else if (Object.keys(initialPersistedState.monthlyTargets || {}).length > 0) {
          await replaceTargetsInCloud(initialPersistedState.monthlyTargets);
          setMonthlyTargets(initialPersistedState.monthlyTargets);
        }
      } catch (error) {
        if (active) {
          setCloudError(error?.message || '云端数据读取失败');
        }
      } finally {
        if (active) {
          setLoadingCloud(false);
        }
      }
    }

    loadCloudData();
    return () => {
      active = false;
    };
  }, []);

  const appState = useMemo(() => ({
    rows,
    setRows,
    monthlyTargets,
    setMonthlyTargets,
    currentView,
    setCurrentView,
    loadingCloud,
    cloudEnabled: isCloudEnabled(),
    cloudError,
  }), [rows, monthlyTargets, currentView, loadingCloud, cloudError]);

  return (
    <AppStateContext.Provider value={appState}>
      <ConfigProvider
        locale={zhCN}
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