import { toRow } from './message-model.js';

export class ConflictError extends Error {
  constructor() { super('Pesan sudah berubah atau akses tidak tersedia. Muat ulang pesan sebelum mencoba lagi; salin perubahanmu terlebih dahulu.'); }
}
export function messageStore(client) {
  return {
    async role() {
      const { data, error } = await client.rpc('god_time_role');
      if (error) throw error;
      return data;
    },
    async list() {
      // Bounded pages avoid silently losing records above the API row limit.
      const records = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await client.from('god_time_messages').select('*')
          .order('year').order('month').range(offset, offset + 499);
        if (error) throw error;
        records.push(...data);
        if (data.length < 500) return records;
      }
    },
    async save(entry, previous = null) {
      const row = toRow(entry);
      let query;
      if (previous) {
        if (previous.year !== entry.year || previous.month !== entry.month) throw new ConflictError();
        query = client.from('god_time_messages').update(row).eq('id', previous.id).eq('revision', previous.revision);
      } else query = client.from('god_time_messages').insert(row);
      const { data, error } = await query.select('*').maybeSingle();
      if (error?.code === '23505') throw new ConflictError();
      if (error) throw error;
      if (!data) throw new ConflictError();
      return data;
    },
    async remove(previous) {
      const { data, error } = await client.from('god_time_messages').delete()
        .eq('id', previous.id).eq('revision', previous.revision).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new ConflictError();
    }
  };
}
