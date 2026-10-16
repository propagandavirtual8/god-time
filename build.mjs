import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'calendar.js', 'content.js', 'favicon.svg', 'time.js', 'messages.js', 'messages.json', 'kelola.html', 'kelola.js']) {
  await copyFile(file, `dist/${file}`);
}
console.log('Build selesai: dist/');
