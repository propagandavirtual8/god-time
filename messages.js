// Exact Hebrew year + month: future, draft, and prior-year messages cannot leak into today's banner.
export function selectMessage(records,h){
 return records.find(m=>m && m.published===true && m.year===h.year && m.month===h.key && typeof m.title==='string' && m.title.trim() && typeof m.body==='string' && m.body.trim())||null;
}
