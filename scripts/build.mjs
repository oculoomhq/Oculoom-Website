import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of await readdir('.')) {
  if (/\.(html|css|js|svg|txt|xml)$/.test(file)) await cp(file, `dist/${file}`);
}
await cp('assets', 'dist/assets', { recursive: true });
if (process.env.CONTEXT !== 'production') {
  await writeFile('dist/_headers', '/*\n  X-Robots-Tag: noindex, nofollow\n');
  await writeFile('dist/robots.txt', 'User-agent: *\nDisallow: /\n');
}
console.log('Static website prepared in dist/.');
