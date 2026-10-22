import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { publicConfig } from './configuration.mjs';
try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const config = publicConfig();
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['./app.js', './kelola.js'], tsconfigRaw: {}, bundle: true, format: 'esm', target: 'es2022',
  outdir: 'dist', plugins: [{ name: 'public-config', setup(build) {
    build.onLoad({ filter: /[\\/]config\.js$/ }, () => ({ contents: `export const config = ${JSON.stringify(config)};`, loader: 'js' }));
  } }] });
for (const file of ['index.html', 'styles.css', 'favicon.svg', 'logo-ehop.png', 'kelola.html']) await copyFile(file, `dist/${file}`);
const legacy = JSON.parse(await readFile('messages.json', 'utf8'));
await writeFile('dist/messages.json', JSON.stringify({ version: 1, messages: config.url ? [] : legacy.messages.filter(m => m.published === true) }));
console.log(`Build selesai: dist/ (${config.url ? 'Supabase' : 'arsip publik lokal'})`);
