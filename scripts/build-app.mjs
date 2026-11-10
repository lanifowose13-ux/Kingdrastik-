// Builds the installable app into dist/ from paper-trader.html (the same file the artifact publishes).
// Usage: node scripts/build-app.mjs
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';

const src = readFileSync('paper-trader.html', 'utf8');
const build = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

const head = `
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#0e5a44">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Paper Trader">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`;

const tail = `
<script>
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
`;

if (!src.includes('</title>') || !src.includes('</body>')) throw new Error('paper-trader.html is missing </title> or </body>');
const out = src.replace('</title>', '</title>' + head).replace(/<\/body>(?![\s\S]*<\/body>)/, tail + '</body>');

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('app', 'dist', { recursive: true });
writeFileSync('dist/index.html', out);
writeFileSync('dist/sw.js', readFileSync('app/sw.js', 'utf8').replace('__BUILD__', build));
writeFileSync('dist/.nojekyll', '');
console.log('Built dist/ (version ' + build + ')');
