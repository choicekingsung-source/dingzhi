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