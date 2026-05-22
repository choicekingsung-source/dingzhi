const DASHBOARD_STORAGE_KEY = 'dingzhi-dashboard-state-v1';

export function loadDashboardState() {
  try {
    const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDashboardState(state) {
  try {
    window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function clearDashboardState() {
  try {
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
