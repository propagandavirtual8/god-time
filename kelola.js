import { hebrew, todayJakarta } from './calendar.js';
import { configured, managerClient } from './supabase-client.js';
import { messageStore } from './message-store.js';
import { textLimits, validateMessage } from './message-model.js';
import { finishOAuth } from './auth.js';

const $ = selector => document.querySelector(selector);
const form = $('#message-form'), status = $('#status');
const ids = Object.keys(textLimits);
const today = hebrew(todayJakarta());
$('#year').value = today.year; $('#month').value = today.key;
let client, store, records = [], current = null, admin = false, busy = false, dirty = false;
let conflicted = false, generation = 0, userId = null;
let selectedYear = today.year, selectedMonth = today.key;
const say = text => { status.textContent = text; };
function controls() {
  form.hidden = !admin;
  $('#archive-panel').hidden = !admin;
  for (const el of form.querySelectorAll('input,select,textarea,button')) el.disabled = busy || !admin;
  $('#save').disabled ||= conflicted;
  $('#delete').disabled ||= !current || conflicted;
  $('#reload').disabled = busy;
  $('#record-list').disabled = busy;
  $('#login').disabled = busy || !configured;
  $('#logout').disabled = busy;
}
function invalidate() { $('#preview').hidden = true; dirty = true; }
function readEntry() {
  const entry = { year: Number($('#year').value), month: $('#month').value, published: $('#published').checked };
  for (const id of ids) entry[id] = $('#'+id).value.trim();
  return validateMessage(entry);
}
function preview(entry) {
  for (const id of ['title','subtitle','body']) $('#preview-'+id).textContent = entry[id];
  $('#preview-verse').textContent = 'Bacaan: '+entry.verse;
  $('#preview-verse-text').textContent = entry.verseText;
  $('#preview').hidden = false;
}
function fillSelection() {
  selectedYear = Number($('#year').value); selectedMonth = $('#month').value;
  current = records.find(m => m.year === Number($('#year').value) && m.month === $('#month').value) || null;
  for (const id of ids) $('#'+id).value = current?.[id] || '';
  $('#published').checked = current?.published === true;
  $('#preview').hidden = true; dirty = false; conflicted = false;
  $('#record-list').value = current?.id || '';
  controls();
}
function drawArchive() {
  const select = $('#record-list');
  select.replaceChildren(new Option('Pilih pesan tersimpan…', ''));
  for (const record of records) select.add(new Option(`${record.year} · ${record.month} · ${record.published ? 'Terjadwal / terbit' : 'Draf'} · ${record.title}`, record.id));
}
async function refresh() {
  const loaded = await store.list();
  records = loaded; drawArchive(); fillSelection();
}
function mayDiscard() { return !dirty || window.confirm('Ada perubahan yang belum disimpan. Abaikan perubahan itu?'); }
form.addEventListener('input', event => { if (!['year','month'].includes(event.target.id)) invalidate(); });
for (const id of ['year','month']) $('#'+id).addEventListener('change', () => {
  if (dirty && !window.confirm('Pindah periode dan abaikan isian yang belum disimpan?')) {
    $('#year').value = selectedYear; $('#month').value = selectedMonth;
    return;
  }
  fillSelection();
});
$('#record-list').addEventListener('change', () => {
  const record = records.find(m => m.id === $('#record-list').value);
  if (!record || !mayDiscard()) { $('#record-list').value = current?.id || ''; return; }
  $('#year').value = record.year; $('#month').value = record.month; fillSelection();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  try { preview(readEntry()); say('Pratinjau siap. Pilih Simpan pesan untuk menyimpan.'); }
  catch (error) { say(error.message); }
});
async function mutate(action) {
  if (!admin || busy || conflicted) return;
  busy = true; controls();
  try { await action(); }
  catch (error) {
    conflicted = true;
    say(error.message?.includes('Muat ulang') ? error.message : 'Penyimpanan belum dapat dipastikan. Salin isianmu, lalu muat ulang pesan untuk memeriksa hasil dan akses akun sebelum mencoba lagi.');
  } finally { busy = false; controls(); }
}
$('#save').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  let entry;
  try { entry = readEntry(); } catch (error) { say(error.message); return; }
  mutate(async () => {
    const saved = await store.save(entry, current);
    records = records.filter(m => m.id !== saved.id); records.push(saved);
    drawArchive(); fillSelection(); preview(saved);
    say(saved.published ? 'Pesan disimpan. Tampil selama bulan yang dipilih; beranda memuat ulang pesan paling lambat dalam satu menit.' : 'Draf disimpan. Hanya admin yang dapat membacanya.');
  });
});
$('#delete').addEventListener('click', () => {
  if (!current || !window.confirm(`Hapus pesan “${current.title}” untuk ${current.month} ${current.year}? Tindakan ini tidak dapat dibatalkan.`)) return;
  mutate(async () => {
    await store.remove(current);
    records = records.filter(m => m.id !== current.id);
    drawArchive(); fillSelection(); say('Pesan dihapus dari database.');
  });
});
$('#reload').addEventListener('click', async () => {
  if (busy || !mayDiscard()) return;
  busy = true; controls();
  try { await refresh(); say('Daftar pesan terbaru dimuat.'); }
  catch { conflicted = true; say('Daftar gagal dimuat. Isian dipertahankan. Coba muat ulang lagi.'); }
  finally { busy = false; controls(); }
});
$('#login').addEventListener('click', async () => {
  busy = true; controls();
  try {
    const redirectTo = new URL('./kelola.html', window.location.href).href;
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) throw error;
  } catch { say('Login Google gagal dimulai. Periksa koneksi dan pengaturan login.'); }
  finally { busy = false; controls(); }
});
$('#logout').addEventListener('click', async () => {
  if (!mayDiscard()) return;
  busy = true; controls();
  const { error } = await client.auth.signOut({ scope: 'local' });
  busy = false;
  if (error) say('Belum berhasil keluar. Coba kembali.');
  controls();
});

async function syncSession(session) {
  const request = ++generation;
  const previousUser = userId;
  userId = session?.user.id || null;
  $('#login').hidden = Boolean(session); $('#logout').hidden = !session;
  $('#account').textContent = session ? session.user.email : 'Belum masuk';
  if (!session) {
    admin = false; records = []; current = null; dirty = false; form.reset();
    $('#preview').hidden = true; controls(); say('Masuk dengan Google untuk mengakses ruang pengelola.'); return;
  }
  try {
    const role = await store.role();
    if (request !== generation) return;
    const wasAdmin = admin; admin = role === 'admin';
    $('#account').textContent = `${session.user.email} · ${admin ? 'admin' : 'user'}`;
    if (!admin) {
      records = []; current = null; form.reset(); dirty = false; $('#preview').hidden = true;
      say('Kamu masuk sebagai user. Pengelolaan pesan hanya tersedia untuk admin.');
    } else if (!wasAdmin || previousUser !== userId) {
      busy = true; controls();
      const loaded = await store.list();
      if (request !== generation) return;
      records = loaded; drawArchive();
      $('#year').value = today.year; $('#month').value = today.key; fillSelection();
      say('Data termuat. Pilih periode atau pesan tersimpan untuk mulai mengelola.');
    }
  } catch {
    if (request !== generation) return;
    admin = false; records = []; current = null; $('#preview').hidden = true;
    say('Akses pengelola belum tersedia. Periksa sesi login dan konfigurasi database, lalu muat ulang halaman.');
  } finally { if (request === generation) { busy = false; controls(); } }
}
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
controls();
if (!configured) say('Ruang pengelola belum dikonfigurasi. Hubungi pemilik situs.');
else {
  client = managerClient(); store = messageStore(client);
  try {
    await finishOAuth(client, window.location, window.history);
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    await syncSession(data.session);
    // Keep callback synchronous: SDK auth callbacks must not await another auth operation.
    client.auth.onAuthStateChange((_event, session) => { setTimeout(() => syncSession(session), 0); });
  } catch (error) { $('#account').textContent = 'Login belum selesai'; say(error.message || 'Sesi login gagal dimuat. Coba masuk kembali.'); }
}
