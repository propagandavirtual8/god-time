import { civilDate, hebrew, monthStart, plusDays, shiftMonth } from './calendar.js';
import { sunsetJakarta } from './time.js';

export const textLimits = { title: 180, subtitle: 250, verse: 300, verseText: 6000,
  author: 150, body: 30000, memoryVerse: 300, memoryText: 6000 };
export const monthKeys = ['nisan','iyar','sivan','tamuz','av','elul','tisyri','cheshvan','kislev','tevet','shevat','adar','adar1','adar2'];

export function validateMessage(entry) {
  if (!entry || !Number.isInteger(entry.year) || entry.year < 5600 || entry.year > 6000 || !monthKeys.includes(entry.month)) throw new Error('Tahun atau bulan tidak valid.');
  const leap = [0,3,6,8,11,14,17].includes(entry.year % 19);
  if (leap ? entry.month === 'adar' : ['adar1','adar2'].includes(entry.month)) throw new Error('Gunakan Adar I/II pada tahun kabisat, atau Adar pada tahun biasa.');
  if (typeof entry.published !== 'boolean') throw new Error('Status publikasi tidak valid.');
  const result = { year: entry.year, month: entry.month, published: entry.published };
  for (const [key, limit] of Object.entries(textLimits)) {
    const value = entry[key] ?? '';
    if (typeof value !== 'string' || [...value].length > limit) throw new Error(`Isi ${key} tidak valid atau terlalu panjang.`);
    result[key] = value.trim();
  }
  if (!result.title || !result.verse || !result.body) throw new Error('Judul, ayat utama, dan isi pesan wajib diisi.');
  return result;
}

export function messagePeriod(year, month) {
  // Search a bounded civil year, then step by Hebrew months (ICU is the existing calendar source).
  let cursor = monthStart(civilDate(`${year - 3761}-09-01`));
  for (let i = 0; i < 28; i++, cursor = shiftMonth(cursor, 1)) {
    const h = hebrew(cursor);
    if (h.year === year && h.key === month) return {
      visible_from: sunsetJakarta(plusDays(cursor, -1)).toISOString(),
      visible_until: sunsetJakarta(plusDays(shiftMonth(cursor, 1), -1)).toISOString()
    };
  }
  throw new Error('Bulan tidak ditemukan pada tahun ini.');
}

export function toRow(entry) {
  const message = validateMessage(entry);
  return { ...message, ...messagePeriod(message.year, message.month) };
}
