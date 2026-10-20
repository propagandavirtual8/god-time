export async function finishOAuth(client, location, history) {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const flowId = url.searchParams.get('sb_flow_id');
  if (!code && !error) return;
  for (const key of ['code','error','error_code','error_description','sb_flow_id']) url.searchParams.delete(key);
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  if (error) throw new Error('Login Google dibatalkan atau ditolak. Coba masuk kembali.');
  const result = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (result.error) throw new Error('Sesi login tidak dapat diselesaikan. Masuk kembali dari browser ini.');
}
