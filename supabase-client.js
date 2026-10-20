import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export const configured = Boolean(config.url && config.key);
const options = {
  global: { fetch: (url, init = {}) => fetch(url, {
    ...init, cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(12000)
  }) }
};
let manager, reader;
export function managerClient() {
  if (!configured) throw new Error('Supabase belum dikonfigurasi.');
  return manager ||= createClient(config.url, config.key, {
    ...options,
    auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true }
  });
}
// Public requests never inherit an admin's persisted session or privileges.
export function publicClient() {
  if (!configured) return null;
  return reader ||= createClient(config.url, config.key, {
    ...options,
    auth: { storageKey: 'god-time-public', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
