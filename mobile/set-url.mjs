// Points the Android app at the hosted site: `node set-url.mjs https://your-app.vercel.app`
import { readFileSync, writeFileSync } from 'node:fs';

const url = process.argv[2]?.replace(/\/+$/, '');
if (!url || !/^https:\/\/[^/\s]+$/.test(url)) {
  console.error('Usage: node set-url.mjs https://your-app.vercel.app');
  process.exit(1);
}

const configPath = new URL('./capacitor.config.json', import.meta.url);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
config.server.url = url;
writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

const offlinePath = new URL('./www/offline.html', import.meta.url);
const offline = readFileSync(offlinePath, 'utf8').replace(
  /location\.href = '[^']*'/,
  `location.href = '${url}'`
);
writeFileSync(offlinePath, offline);

console.log(`App now opens ${url}`);
