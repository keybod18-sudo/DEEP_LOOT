import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const files = [
  'assets/player/idle/idle_01.png',
  'assets/player/attack/attack_01.png',
  'assets/player/attack/attack_02.png',
  'assets/player/attack/attack_03.png',
  'assets/player/attack/attack_04.png',
  'assets/player/attack/attack_05.png',
  'assets/monsters/slime/crawl.png',
  'assets/monsters/slime/cling.png',
  'assets/monsters/goblin/base.png'
];

const hashes = {};
for (const file of files) {
  const data = await readFile(resolve(file));
  hashes[file] = createHash('sha256').update(data).digest('hex');
}

await writeFile('assets/asset-manifest.json', `${JSON.stringify({ version: 1, hashes }, null, 2)}\n`);
console.log('assets/asset-manifest.json を更新しました。');
