import { mkdir, cp } from 'node:fs/promises';

await mkdir('site', { recursive: true });
await cp('demo', 'site', { recursive: true });
await cp('src', 'site/src', { recursive: true });
console.log('Built site/');
