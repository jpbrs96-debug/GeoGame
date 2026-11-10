import fs from 'fs';
const rd = f => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = rd('./src/template.html');
// fichas: src/info/*.txt  (@ID, depois linhas C:, D:, E:, H:, P:)
const INFO = {};
for (const f of fs.readdirSync(new URL('./src/info/', import.meta.url)).filter(f => f.endsWith('.txt')).sort()) {
  let cur = null;
  for (const raw of rd('./src/info/' + f).split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('@')) { cur = line.slice(1).trim(); if (INFO[cur]) throw new Error('duplicado ' + cur); INFO[cur] = {}; continue; }
    const m = line.match(/^([CDEHP]):\s*(.*)$/);
    if (!m || !cur) throw new Error('linha inválida em ' + f + ': ' + line.slice(0, 60));
    INFO[cur][m[1].toLowerCase()] = m[2];
  }
}
fs.writeFileSync(new URL('./build/info.json', import.meta.url), JSON.stringify(INFO));
const parts = { D3: rd('./build/d3.min.js'), DATA: rd('./src/data.js'), LOGIC: rd('./src/logic.js'), STATS: rd('./src/stats.js'), INFO: JSON.stringify(INFO), APP: rd('./src/app.js') };
for (const [k, v] of Object.entries(parts)) html = html.replace(`<!--${k}-->`, () => safe(v));
fs.writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('index.html', (html.length / 1024).toFixed(1), 'KB', '· fichas:', Object.keys(INFO).length);
