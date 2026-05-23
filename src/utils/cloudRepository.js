import { getSupabaseClient, hasSupabaseConfig } from './supabaseClient';
import { DATA_TABLE, TARGET_TABLE, buildTargetKey, normalizeTargetMonth, normalizeStoreKey } from './cloudSchema';

export function isCloudEnabled() {
  return hasSupabaseConfig;
}

function stripInternalFields(row) {
  const clone = { ...(row || {}) };
  delete clone.__rowKey;
  return clone;
}

export function buildRowIdentity(row) {
  return [
    String(row?.date ?? '').trim(),
    String(row?.storeName ?? '').trim(),
  ].join('::');
}

function buildStrictRowIdentity(row) {
  return [
    String(row?.date ?? '').trim(),
    String(row?.platform ?? '').trim(),
    String(row?.storeName ?? '').trim(),
    String(row?.totalSales ?? '').trim(),
    String(row?.backstageNewCount ?? '').trim(),
    String(row?.pricePassCount ?? '').trim(),
    String(row?.pricePassRate ?? '').trim(),
    String(row?.templateCount ?? '').trim(),
    String(row?.publishFrontCount ?? '').trim(),
  ].join('::');
}

function mergeRows(existingRows, incomingRows, mode = 'skip') {
  const existing = [...(existingRows || [])];
  const incoming = [...(incomingRows || [])];
  const incomingIdentityMap = new Map(incoming.map((row) => [buildRowIdentity(row), row]));
  const merged = [];
  const seen = new Set();

  existing.forEach((row, index) => {
    const identity = buildRowIdentity(row);
    const strictIdentity = buildStrictRowIdentity(row);
    if (seen.has(strictIdentity)) {
      return;
    }

    if (mode === 'overwrite' && incomingIdentityMap.has(identity)) {
      const nextRow = incomingIdentityMap.get(identity);
      const nextStrict = buildStrictRowIdentity(nextRow);
      if (!seen.has(nextStrict)) {
        merged.push({ ...nextRow, __rowKey: nextRow?.__rowKey || `merged-new-${index}` });
        seen.add(nextStrict);
      }
      incomingIdentityMap.delete(identity);
      return;
    }

    merged.push({ ...row, __rowKey: row?.__rowKey || `merged-old-${index}` });
    seen.add(strictIdentity);
  });

  incoming.forEach((row, index) => {
    const strictIdentity = buildStrictRowIdentity(row);
    const identity = buildRowIdentity(row);
    const alreadyCovered = mode === 'overwrite' ? false : existing.some((item) => buildRowIdentity(item) === identity);
    if (alreadyCovered || seen.has(strictIdentity)) {
      return;
    }
    merged.push({ ...row, __rowKey: row?.__rowKey || `merged-incoming-${index}` });
    seen.add(strictIdentity);
  });

  return merged;
}

export function detectDuplicateRows(existingRows, incomingRows) {
  const existingIdentities = new Set((existingRows || []).map((row) => buildRowIdentity(row)));
  return (incomingRows || []).filter((row) => existingIdentities.has(buildRowIdentity(row)));
}

export function appendRows(existingRows, incomingRows, mode = 'skip') {
  return mergeRows(existingRows || [], incomingRows || [], mode);
}

export function removeRowByIdentity(rows, targetRow) {
  const identity = buildRowIdentity(targetRow);
  let removed = false;
  const nextRows = (rows || []).filter((row) => {
    if (!removed && buildRowIdentity(row) === identity) {
      removed = true;
      return false;
    }
    return true;
  });
  return nextRows;
}

export async function fetchRowsFromCloud() {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client.from(DATA_TABLE).select('*').order('created_at', { ascending: true });
  if (error) throw error;

  return (data || []).map((item) => ({
    ...item.payload,
    __rowKey: item.id,
  }));
}

export async function replaceRowsInCloud(rows) {
  const client = getSupabaseClient();
  if (!client) return { skipped: true };

  const { error: deleteError } = await client.from(DATA_TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) throw deleteError;

  if (!rows.length) return { skipped: false };

  const payload = rows.map((row) => ({ payload: stripInternalFields(row) }));
  const { error } = await client.from(DATA_TABLE).insert(payload);
  if (error) throw error;

  return { skipped: false };
}

export async function appendRowsInCloud(existingRows, incomingRows, mode = 'skip') {
  const merged = mergeRows(existingRows, incomingRows, mode);
  await replaceRowsInCloud(merged);
  return merged;
}

export async function deleteRowInCloud(rows, targetRow) {
  const nextRows = removeRowByIdentity(rows, targetRow);
  await replaceRowsInCloud(nextRows);
  return nextRows;
}

export async function fetchTargetsFromCloud() {
  const client = getSupabaseClient();
  if (!client) return {};

  const { data, error } = await client.from(TARGET_TABLE).select('*');
  if (error) throw error;

  return (data || []).reduce((acc, item) => {
    const month = normalizeTargetMonth(item.month);
    const store = normalizeStoreKey(item.store_name);
    acc[buildTargetKey(store, month)] = item.targets || {};
    return acc;
  }, {});
}

export async function upsertTargetInCloud({ storeName, month, targets }) {
  const client = getSupabaseClient();
  if (!client) return { skipped: true };

  const store = normalizeStoreKey(storeName);
  const monthKey = normalizeTargetMonth(month);
  const { error } = await client.from(TARGET_TABLE).upsert({
    store_name: store,
    month: monthKey,
    targets,
    key: buildTargetKey(store, monthKey),
  }, { onConflict: 'key' });

  if (error) throw error;
  return { skipped: false };
}

export async function replaceTargetsInCloud(monthlyTargets) {
  const client = getSupabaseClient();
  if (!client) return { skipped: true };

  const entries = Object.entries(monthlyTargets || {});
  if (!entries.length) return { skipped: false };

  for (const [key, targets] of entries) {
    const [storeName, month] = key.split('::');
    await upsertTargetInCloud({ storeName, month, targets });
  }

  return { skipped: false };
}