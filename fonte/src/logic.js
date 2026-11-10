// GeoGame — lógica pura do jogo (sem DOM), testável no Node.
(function (root) {
  'use strict';

  function norm(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function build(data) {
    const list = [];
    const byId = {};
    data.COUNTRIES.trim().split('\n').forEach(line => {
      const [id, name, capital, cont, lat, lon, aliases] = line.split('|');
      const c = {
        id, name, capital, cont, continent: data.CONTINENTS[cont],
        lat: +lat, lon: +lon,
        aliases: (aliases || '').split(';').map(s => s.trim()).filter(Boolean),
        neighbors: []
      };
      list.push(c); byId[id] = c;
    });
    data.BORDERS.trim().split(/\s+/).forEach(pair => {
      const [a, b] = pair.split('-');
      if (!byId[a] || !byId[b]) throw new Error('País desconhecido na fronteira ' + pair);
      if (byId[a].neighbors.includes(b)) throw new Error('Fronteira duplicada ' + pair);
      byId[a].neighbors.push(b); byId[b].neighbors.push(a);
    });
    list.sort((x, y) => x.name.localeCompare(y.name, 'pt'));
    list.forEach(c => c.neighbors.sort((x, y) => byId[x].name.localeCompare(byId[y].name, 'pt')));

    // índice de busca
    const index = [];
    list.forEach(c => {
      index.push({ key: norm(c.name), id: c.id, primary: true });
      c.aliases.forEach(a => index.push({ key: norm(a), id: c.id, primary: false }));
    });

    // distâncias (BFS a partir de cada país com fronteira)
    const dist = {};
    list.forEach(c => { dist[c.id] = bfs(byId, c.id); });

    return { list, byId, index, dist };
  }

  function bfs(byId, src, allowed) {
    const d = { [src]: 0 };
    const q = [src];
    for (let i = 0; i < q.length; i++) {
      const u = q[i];
      for (const v of byId[u].neighbors) {
        if (d[v] !== undefined) continue;
        if (allowed && !allowed.has(v)) continue;
        d[v] = d[u] + 1; q.push(v);
      }
    }
    return d;
  }

  // Busca: exata (nome/apelido) ou sugestões por prefixo de palavra
  function lookup(G, text) {
    const k = norm(text);
    if (!k) return null;
    const hit = G.index.find(e => e.key === k);
    return hit ? hit.id : null;
  }
  function suggest(G, text, limit) {
    const k = norm(text);
    if (!k) return [];
    const seen = new Set(); const starts = []; const inner = [];
    for (const e of G.index) {
      if (seen.has(e.id)) continue;
      if (e.key.startsWith(k)) { starts.push(e); seen.add(e.id); }
    }
    for (const e of G.index) {
      if (seen.has(e.id)) continue;
      if (e.key.split(' ').some(w => w.startsWith(k)) || (k.length >= 3 && e.key.includes(k))) { inner.push(e); seen.add(e.id); }
    }
    const rank = arr => arr.sort((a, b) => (b.primary - a.primary) || a.key.length - b.key.length);
    return rank(starts).concat(rank(inner)).slice(0, limit || 6).map(e => e.id);
  }

  // RNG determinístico (seed de texto → mulberry32)
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function rng(seed) {
    let a = typeof seed === 'number' ? seed >>> 0 : hashStr(String(seed));
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Pares com exatamente `k` países no meio do caminho mais curto (distância k+1)
  const pairCache = {};
  function pairsWith(G, k) {
    if (pairCache[k]) return pairCache[k];
    const out = [];
    const ids = G.list.map(c => c.id).sort();
    for (let i = 0; i < ids.length; i++) {
      const di = G.dist[ids[i]];
      for (let j = i + 1; j < ids.length; j++) if (di[ids[j]] === k + 1) out.push([ids[i], ids[j]]);
    }
    return (pairCache[k] = out);
  }

  function makePuzzle(G, seed, k) {
    const r = rng(seed);
    if (!k) k = 4 + Math.floor(r() * 3);
    const pairs = pairsWith(G, k);
    const p = pairs[Math.floor(r() * pairs.length)];
    const flip = r() < 0.5;
    return { a: flip ? p[1] : p[0], b: flip ? p[0] : p[1], k, seed: String(seed) };
  }

  // Desvio: quantos passos a mais custa passar por c (0 = está num caminho mais curto)
  function detour(G, a, b, c) {
    const da = G.dist[a][c], db = G.dist[b][c], D = G.dist[a][b];
    if (da === undefined || db === undefined) return Infinity;
    return da + db - D;
  }
  function tier(G, a, b, c) {
    const d = detour(G, a, b, c);
    return d === 0 ? 0 : d === 1 ? 1 : d === 2 ? 2 : 3;
  }

  // Caminho dentro do conjunto (palpites + pontas), ou null
  function pathWithin(G, a, b, guessed) {
    const allowed = new Set(guessed); allowed.add(a); allowed.add(b);
    const prev = { [a]: null }; const q = [a];
    for (let i = 0; i < q.length; i++) {
      const u = q[i];
      if (u === b) break;
      for (const v of G.byId[u].neighbors) {
        if (!allowed.has(v) || v in prev) continue;
        prev[v] = u; q.push(v);
      }
    }
    if (!(b in prev)) return null;
    const path = []; for (let u = b; u !== null; u = prev[u]) path.unshift(u);
    return path;
  }

  // Um caminho mais curto que reaproveita o máximo de palpites; também conta quantos existem
  function bestShortest(G, a, b, guessed) {
    const gs = new Set(guessed);
    const D = G.dist[a][b];
    const layers = Array.from({ length: D + 1 }, () => []);
    G.list.forEach(c => { if (detour(G, a, b, c.id) === 0) layers[G.dist[a][c.id]].push(c.id); });
    const score = { [a]: 0 }, count = { [a]: 1 }, from = { [a]: null };
    for (let l = 1; l <= D; l++) {
      for (const v of layers[l]) {
        let best = -1, bestU = null, cnt = 0;
        for (const u of G.byId[v].neighbors) {
          if (score[u] === undefined || G.dist[a][u] !== l - 1) continue;
          cnt += count[u];
          if (score[u] > best) { best = score[u]; bestU = u; }
        }
        score[v] = best + (gs.has(v) ? 1 : 0); count[v] = cnt; from[v] = bestU;
      }
    }
    const path = []; for (let u = b; u !== null; u = from[u]) path.unshift(u);
    return { path, count: count[b] };
  }

  // Dica: menor rota contando só países ainda não ditos (0-1 BFS); devolve o próximo
  function hint(G, a, b, guessed) {
    const gs = new Set(guessed);
    const cost = { [a]: 0 }, prev = { [a]: null };
    const dq = [a];
    while (dq.length) {
      const u = dq.shift();
      for (const v of G.byId[u].neighbors) {
        const w = (gs.has(v) || v === b) ? 0 : 1;
        const nc = cost[u] + w;
        if (cost[v] === undefined || nc < cost[v]) {
          cost[v] = nc; prev[v] = u;
          if (w === 0) dq.unshift(v); else dq.push(v);
        }
      }
    }
    if (cost[b] === undefined) return null;
    const path = []; for (let u = b; u !== null; u = prev[u]) path.unshift(u);
    const missing = path.filter(id => id !== a && id !== b && !gs.has(id));
    if (!missing.length) return null;
    const next = missing[0];
    const via = path[path.indexOf(next) - 1];
    return { id: next, via, remaining: missing.length };
  }

  function stats(G) {
    const withBorders = G.list.filter(c => c.neighbors.length);
    const edges = withBorders.reduce((s, c) => s + c.neighbors.length, 0) / 2;
    return { countries: G.list.length, withBorders: withBorders.length, borders: edges,
      pairs: { 4: pairsWith(G, 4).length, 5: pairsWith(G, 5).length, 6: pairsWith(G, 6).length } };
  }

  root.GeoLogic = { norm, build, bfs, lookup, suggest, rng, hashStr, pairsWith, makePuzzle,
    detour, tier, pathWithin, bestShortest, hint, stats };
})(typeof window !== 'undefined' ? window : globalThis);
