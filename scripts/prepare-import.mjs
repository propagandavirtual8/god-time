import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { toRow } from '../message-model.js';
export function importSQL(source) {
  const parsed = JSON.parse(source);
  if (parsed.version !== 1 || !Array.isArray(parsed.messages)) throw new Error('Format arsip tidak dikenal.');
  const keys = new Set();
  const rows = parsed.messages.map(entry => {
    const row = toRow(entry), key = `${row.year}/${row.month}`;
    if (keys.has(key)) throw new Error(`Periode duplikat: ${key}`);
    keys.add(key);
    return row;
  });
  const quote = value => typeof value === 'number' || typeof value === 'boolean' ? String(value) : "'" + value.replaceAll("'", "''") + "'";
  return `-- Source SHA256: ${createHash('sha256').update(source).digest('hex')}\n-- ${rows.length} records. Inserts only; existing periods are never overwritten.\nbegin;\n` + rows.map(row => {
    const columns = Object.keys(row);
    return `insert into public.god_time_messages (${columns.map(c=>'"'+c+'"').join(',')}) values (${columns.map(c=>quote(row[c])).join(',')}) on conflict (year,month) do nothing;`;
  }).join('\n') + '\ncommit;\n';
}
if (process.argv[1]?.endsWith('prepare-import.mjs')) {
  const source = await readFile(new URL('../messages.json', import.meta.url), 'utf8');
  await writeFile(new URL('../supabase/legacy-import.sql', import.meta.url), importSQL(source));
  console.log('SQL impor disiapkan. Tidak ada koneksi atau perubahan database.');
}
