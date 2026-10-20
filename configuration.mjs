export function publicConfig(env = process.env) {
  const url = (env.SUPABASE_URL || '').trim();
  const key = (env.SUPABASE_PUBLISHABLE_KEY || '').trim();
  if (!url && !key) return { url: '', key: '' };
  if (!url || !key) throw new Error('Isi kedua konfigurasi Supabase atau kosongkan keduanya.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('SUPABASE_URL harus berupa origin HTTPS.');
  }
  let allowed = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!allowed) {
    try { allowed = JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon'; } catch { /* rejected below */ }
  }
  if (!allowed) throw new Error('Gunakan publishable/anon key, bukan secret atau service-role key.');
  return { url: parsed.origin, key };
}
