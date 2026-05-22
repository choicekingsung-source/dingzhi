export function createInitialDashboardState() {
  return {
    rawRows: [],
    filteredRows: [],
    selectedStores: [],
    selectedMetrics: ['totalSales'],
    pageSize: 10,
  };
}
