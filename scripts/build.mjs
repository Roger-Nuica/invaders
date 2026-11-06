/**
 * Copies the playable game into dist/, keeping the same paths as the source
 * folder, so what runs locally is exactly what Vercel serves. Only the files
 * the game uses are copied: no tests, notes or generator scripts.
 */
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist';
/** Whole files and folders copied as they are. */
const ENTRIES = ['index.html', 'manifest.json', 'sw.js', 'icons'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'src', 'render'), { recursive: true });
for (const entry of ENTRIES) cpSync(entry, join(OUT, entry), { recursive: true });
for (const dir of ['src', join('src', 'render')]) {
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.js'))) {
    cpSync(join(dir, file), join(OUT, dir, file));
  }
}
console.log(`Built ${OUT}/`);
