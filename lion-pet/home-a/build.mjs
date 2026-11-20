import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = ['lion.mjs', 'lines.mjs']
  .map((f) => fs.readFileSync(path.join(here, '..', 'core', f), 'utf8'))
  .join('\n')
  .replace(/^import .*$/gm, '')
  .replace(/^export /gm, '');
const page = fs.readFileSync(path.join(here, 'page.src.html'), 'utf8').replace('/*CORE*/', () => core);
fs.mkdirSync(path.join(here, '..', 'dist'), { recursive: true });
fs.writeFileSync(path.join(here, '..', 'dist', 'lion-pet.html'), page);
