// Exact Hebrew year + month: future, draft, and prior-year messages cannot leak into today's banner.
export function selectMessage(records,h){
 return records.find(m=>m && m.published===true && m.year===h.year && m.month===h.key && typeof m.title==='string' && m.title.trim() && typeof m.body==='string' && m.body.trim() && ['subtitle','verse','verseText','author','memoryVerse','memoryText'].every(k=>m[k]==null || typeof m[k]==='string'))||null;
}

export async function loadPublicMessage({ client, h, fetcher = fetch }) {
  try {
    if (client) {
      const { data, error } = await client.from('god_time_messages').select('year,month,published,title,subtitle,verse,verseText,author,body,memoryVerse,memoryText')
        .eq('year', h.year).eq('month', h.key).eq('published', true).maybeSingle();
      if (error) throw error;
      return { entry: selectMessage(data ? [data] : [], h), source: 'database' };
    }
    const response = await fetcher('./messages.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Data tidak tersedia');
    const data = await response.json();
    return { entry: selectMessage(Array.isArray(data.messages) ? data.messages : [], h), source: 'legacy' };
  } catch {
    // A missing/unpublished/deleted DB message must never resurrect from a stale JSON snapshot.
    return { entry: null, source: 'unavailable' };
  }
}
