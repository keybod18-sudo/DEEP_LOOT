import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifest = JSON.parse(await readFile('assets/asset-manifest.json', 'utf8'));
let failed = false;

for (const [file, expected] of Object.entries(manifest.hashes)) {
  try {
    const data = await readFile(resolve(file));
    const actual = createHash('sha256').update(data).digest('hex');
    if (actual !== expected) {
      console.error(`NG  ${file}`);
      console.error(`  expected: ${expected}`);
      console.error(`  actual:   ${actual}`);
      failed = true;
    } else {
      console.log(`OK  ${file}`);
    }
  } catch (error) {
    console.error(`NG  ${file}: ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
  }
}

if (failed) process.exit(1);
