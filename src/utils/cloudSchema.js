export const DATA_TABLE = 'dashboard_rows';
export const TARGET_TABLE = 'dashboard_targets';

export function normalizeTargetMonth(month) {
  return String(month ?? '').trim();
}

export function normalizeStoreKey(storeName) {
  return String(storeName ?? '').trim();
}

export function buildTargetKey(storeName, month) {
  return `${normalizeStoreKey(storeName)}::${normalizeTargetMonth(month)}`;
}
