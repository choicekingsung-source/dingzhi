import React, { useContext } from 'react';
import { AppStateContext } from '../App';
import DashboardPage from './pages/DashboardPage';
import DataPage from './pages/DataPage';
import TrendPage from './pages/TrendPage';
import TargetPage from './pages/TargetPage';
import SettingsPage from './pages/SettingsPage';

function MainContent() {
  const { currentView } = useContext(AppStateContext);

  if (currentView === 'data') return <DataPage />;
  if (currentView === 'trend') return <TrendPage />;
  if (currentView === 'target') return <TargetPage />;
  if (currentView === 'settings') return <SettingsPage />;
  return <DashboardPage />;
}

export default MainContent;