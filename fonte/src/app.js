(function () {
'use strict';
const L = window.GeoLogic;
const G = L.build(window.GEO_DATA);
const $ = s => document.getElementById(s);
const nm = id => G.byId[id] ? G.byId[id].name : id;
const flag = id => String.fromCodePoint(...[...id].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

const TIER_TXT = ['na rota', 'desvio de 1', 'desvio de 2', 'longe'];
const TIER_EMOJI = ['🟩', '🟨', '🟧', '🟥'];
const EPOCH = Date.UTC(2026, 10, 10);
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// ---------- armazenamento local (opcional) ----------
const store = {
  get(k) { try { const v = localStorage.getItem('geogame:v1:' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('geogame:v1:' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }
};

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dayNumber(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 864e5) + 1;
}
function prettyDate(ds) { const [y, m, d] = ds.split('-').map(Number); return d + ' ' + MONTHS[m - 1] + ' ' + y; }

// ---------- estado ----------
let S = null;     // { mode, date, puzzle:{a,b,k,seed}, guesses:[], hints:[], status, diff }
let diff = 0;     // 0 = qualquer (4–6)
const isOver = () => S.status !== 'playing';

function newDaily() {
  const date = todayStr();
  const puzzle = L.makePuzzle(G, 'diario-' + date);
  const saved = store.get('daily:' + date);
  S = { mode: 'daily', date, puzzle, guesses: [], hints: [], status: 'playing' };
  if (saved && saved.puzzle && saved.puzzle.a === puzzle.a && saved.puzzle.b === puzzle.b) {
    S.guesses = saved.guesses || []; S.hints = saved.hints || []; S.status = saved.status || 'playing';
  }
  begin(true);
}
function newFree() {
  const seed = 'livre-' + Date.now() + '-' + Math.floor(Math.random() * 1e9);
  S = { mode: 'free', date: todayStr(), puzzle: L.makePuzzle(G, seed, diff || null), guesses: [], hints: [], status: 'playing' };
  begin(true);
}
function persist() {
  if (S.mode === 'daily') store.set('daily:' + S.date, S);
}

// ---------- painel ----------
function scramble(el, text) {
  if (reduceMotion) { el.textContent = text; return; }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÊÇÕ';
  let frame = 0; const total = 14;
  clearInterval(el._t); el._busy = true;
  el._t = setInterval(() => {
    frame++;
    const done = Math.floor(text.length * frame / total);
    el.textContent = text.split('').map((ch, i) => (i < done || ch === ' ') ? ch : chars[Math.floor(Math.random() * chars.length)]).join('');
    if (frame >= total) { clearInterval(el._t); el._busy = false; el.textContent = text; }
  }, 38);
}
function renderBoard(animate) {
  const p = S.puzzle;
  $('b-title').textContent = S.mode === 'daily' ? 'Desafio nº ' + dayNumber(S.date) : 'Jogo livre';
  $('b-date').textContent = S.mode === 'daily' ? prettyDate(S.date) : p.k + ' países no meio';
  $('b-a-code').textContent = p.a; $('b-b-code').textContent = p.b;
  if (animate) { scramble($('b-a'), nm(p.a)); scramble($('b-b'), nm(p.b)); }
  else { [['b-a', p.a], ['b-b', p.b]].forEach(([el, id]) => { if (!$(el)._busy) $(el).textContent = nm(id); }); }
  const dots = $('b-dots'); dots.innerHTML = '';
  const found = S.guesses.filter(g => L.tier(G, p.a, p.b, g) === 0).length;
  for (let i = 0; i < p.k; i++) { const d = document.createElement('i'); if (i < Math.min(found, p.k)) d.className = 'on'; dots.appendChild(d); }
  dots.setAttribute('aria-label', 'O caminho mais curto passa por ' + p.k + ' países');
  dots.parentElement.title = p.k + ' países no caminho mais curto';
}

// ---------- jogo ----------
function begin(animate) {
  $('mode-daily').setAttribute('aria-pressed', S.mode === 'daily');
  $('mode-free').setAttribute('aria-pressed', S.mode === 'free');
  $('free-ctl').hidden = S.mode !== 'free';
  setMsg(isOver() ? '' : 'Monte um caminho de países vizinhos ligando ' + nm(S.puzzle.a) + ' a ' + nm(S.puzzle.b) + '.');
  closeCard();
  renderBoard(animate);
  render();
  MapView.onPuzzle();
}

function setMsg(text, kind) { const m = $('msg'); m.textContent = text; m.className = 'msg' + (kind ? ' ' + kind : ''); }

function submit(id) {
  if (isOver()) return;
  const p = S.puzzle;
  if (!id) { setMsg('Não encontrei esse país. Tente o nome em português, como “Alemanha” ou “Costa do Marfim”.', 'warn'); return; }
  if (id === p.a || id === p.b) { setMsg(nm(id) + ' já é ' + (id === p.a ? 'a partida.' : 'a chegada.'), 'warn'); return; }
  if (S.guesses.includes(id)) { setMsg('Você já tentou ' + nm(id) + '.', 'warn'); return; }
  S.guesses.push(id);
  const t = L.tier(G, p.a, p.b, id);
  const noBorder = !G.byId[id].neighbors.length;
  let text = nm(id) + ': ' + (noBorder ? 'não tem fronteira terrestre.' : TIER_TXT[t] + '.');
  const route = L.pathWithin(G, p.a, p.b, S.guesses);
  if (route) { S.status = 'won'; text = ''; recordStats(); }
  setMsg(text, t === 3 ? 'warn' : '');
  persist();
  render(id);
  MapView.paint(id);
  refreshCard();
  if (S.status === 'won') MapView.celebrate(route);
}

function useHint() {
  if (isOver()) return;
  const p = S.puzzle;
  const h = L.hint(G, p.a, p.b, S.guesses);
  if (!h) return;
  S.hints.push(h.id);
  persist();
  setMsg('Dica: falta um país que começa com “' + nm(h.id)[0] + '” e faz fronteira com ' + nm(h.via) + '.', 'hint');
  render();
  MapView.flash(h.via);
}

function giveUp() {
  if (isOver()) return;
  S.status = 'revealed'; persist(); setMsg('');
  render(); MapView.paint(); MapView.fit(true); refreshCard();
}

function recordStats() {
  if (S.mode !== 'daily') return;
  const st = store.get('stats') || { played: 0, perfect: 0, days: [] };
  if (st.days.includes(S.date)) return;
  st.days.push(S.date); st.played++;
  if (S.guesses.length === S.puzzle.k) st.perfect++;
  store.set('stats', st);
}

function render(newId) {
  const p = S.puzzle;
  $('c-g').textContent = S.guesses.length; $('c-min').textContent = p.k; $('c-h').textContent = S.hints.length;
  const ul = $('guesses'); ul.innerHTML = '';
  S.guesses.forEach((id, i) => {
    const t = L.tier(G, p.a, p.b, id);
    const li = document.createElement('li');
    li.className = 't' + t + (id === newId ? ' new' : '');
    const tag = !G.byId[id].neighbors.length ? 'sem fronteira terrestre' : TIER_TXT[t];
    li.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="nm">' + flag(id) + ' ' + esc(nm(id)) + '</span><span class="tag">' + tag + '</span>';
    li.addEventListener('click', () => { openCard(id); MapView.focus([id], true); });
    ul.prepend(li);
  });
  const over = isOver();
  $('empty').hidden = S.guesses.length > 0 || over;
  $('hint').hidden = over; $('reveal').hidden = over;
  $('guess').disabled = over; $('go').disabled = over;
  $('hint').disabled = over; $('reveal').disabled = over;
  $('guess').placeholder = over ? 'Partida encerrada' : 'Digite um país (ex.: Alemanha)';
  renderBoard(false);
  renderResult();
  renderTrivia();
}

function stopsHtml(path) {
  return path.map((id, i) => '<button type="button" class="stop" data-id="' + id + '">' + flag(id) + ' ' + esc(nm(id)) +
    ' <small>· ' + esc(G.byId[id].capital.replace(/ \(.*\)$/, '')) + '</small></button>' + (i < path.length - 1 ? '<span class="arr">→</span>' : '')).join('');
}

function shareText() {
  const p = S.puzzle;
  const head = S.mode === 'daily' ? 'GeoGame · Desafio nº ' + dayNumber(S.date) : 'GeoGame · Jogo livre';
  const squares = S.guesses.map(id => TIER_EMOJI[L.tier(G, p.a, p.b, id)]).join('');
  const tail = S.status === 'won' ? S.guesses.length + ' palpites · mínimo ' + p.k : 'solução revelada';
  const t = S.trivia && S.trivia.items && S.trivia.cur >= S.trivia.items.length ? '\nTrivia: ' + S.trivia.items.filter(triviaRight).length + '/' + S.trivia.items.length : '';
  return head + '\n' + nm(p.a) + ' → ' + nm(p.b) + '\n' + squares + '\n' + tail + (S.hints.length ? ' · ' + S.hints.length + ' dica(s)' : '') + t;
}

// ---------- trivia do fim de jogo ----------
const QUIZ = window.GEO_QUIZ || {};
const THEMES = { H: 'História', G: 'Geografia', T: 'Turismo', C: 'Cinema', E: 'Economia', P: 'Geopolítica' };
function shuffled(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function triviaRoute() {
  const p = S.puzzle;
  return (S.status === 'won' ? L.pathWithin(G, p.a, p.b, S.guesses) : L.bestShortest(G, p.a, p.b, S.guesses).path) || [];
}
function buildTrivia() {
  const ids = triviaRoute().filter(id => QUIZ[id] && QUIZ[id].length);
  const r = L.rng('trivia-' + S.puzzle.seed + '-' + ids.join(''));
  const themes = shuffled(Object.keys(THEMES), r);
  const items = ids.map((id, i) => {
    const qs = QUIZ[id];
    let cand = qs.map((q, k) => k).filter(k => qs[k][0] === themes[i % themes.length]);
    if (!cand.length) cand = qs.map((q, k) => k);
    return { id, k: cand[Math.floor(r() * cand.length)], order: shuffled([1, 2, 3, 4], r), pick: null };
  });
  S.trivia = { items, cur: 0, started: false };
}
const triviaRight = it => it.pick === 1;
function renderTrivia() {
  const box = $('trivia');
  if (!isOver()) { box.hidden = true; box.innerHTML = ''; return; }
  if (!S.trivia || !S.trivia.items) buildTrivia();
  const T = S.trivia, n = T.items.length;
  if (!n) { box.hidden = true; return; }
  box.hidden = false;
  if (!T.started) {
    box.innerHTML = '<div class="tv-head"><span class="sub">Trivia da rota</span><h2>' + n + ' perguntas, uma por país</h2></div>' +
      '<p>Teste o que você sabe sobre os países da rota: ' + T.items.map(it => esc(nm(it.id))).join(', ') + '.</p>' +
      '<div class="actions"><button class="btn primary" type="button" id="tv-start">Começar a trivia</button></div>';
    $('tv-start').addEventListener('click', () => { T.started = true; persist(); renderTrivia(); showTriviaCountry(); });
    return;
  }
  if (T.cur >= n) {
    const ok = T.items.filter(triviaRight).length;
    const verdict = ok === n ? 'Gabaritou!' : ok >= n * 0.7 ? 'Mandou bem!' : ok >= n * 0.4 ? 'Bom começo.' : 'Hora de estudar a ficha dos países.';
    box.innerHTML = '<div class="tv-head"><span class="sub">Trivia da rota</span><h2>' + ok + ' de ' + n + ' · ' + verdict + '</h2></div>' +
      '<ol class="tv-recap">' + T.items.map(it => {
        const q = QUIZ[it.id][it.k];
        return '<li class="' + (triviaRight(it) ? 'ok' : 'no') + '"><span class="tv-mark">' + (triviaRight(it) ? '✓' : '✗') + '</span><span><b>' + flag(it.id) + ' ' + esc(nm(it.id)) + '</b> · ' + esc(q[1]) + ' <em>' + esc(q[2]) + '</em></span></li>';
      }).join('') + '</ol>' +
      '<div class="actions"><button class="btn" type="button" id="tv-share">Copiar resultado</button></div>';
    $('tv-share').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(shareText()); $('tv-share').textContent = 'Copiado!'; }
      catch (e) { setMsg(shareText().replace(/\n/g, ' · ')); $('tv-share').textContent = 'Texto exibido acima'; }
    });
    return;
  }
  const it = T.items[T.cur];
  const q = QUIZ[it.id][it.k];
  const answered = it.pick !== null;
  const opts = it.order.map(o => {
    let cls = 'tv-opt';
    if (answered && o === 1) cls += ' right';
    else if (answered && o === it.pick) cls += ' wrong';
    return '<button type="button" class="' + cls + '" data-o="' + o + '"' + (answered ? ' disabled' : '') + '>' + esc(q[o + 1]) + '</button>';
  }).join('');
  box.innerHTML = '<div class="tv-head"><span class="sub">Trivia da rota · pergunta ' + (T.cur + 1) + ' de ' + n + '</span>' +
    '<div class="tv-dots">' + T.items.map((x, i) => '<i class="' + (x.pick === null ? (i === T.cur ? 'cur' : '') : triviaRight(x) ? 'ok' : 'no') + '"></i>').join('') + '</div></div>' +
    '<p class="tv-country">' + flag(it.id) + ' <b>' + esc(nm(it.id)) + '</b> <span class="tv-theme">' + THEMES[q[0]] + '</span></p>' +
    '<h3 class="tv-q">' + esc(q[1]) + '</h3><div class="tv-opts">' + opts + '</div>' +
    (answered ? '<p class="tv-exp ' + (triviaRight(it) ? 'ok' : 'no') + '"><b>' + (triviaRight(it) ? 'Certo!' : 'Não foi dessa vez.') + '</b> ' + esc(q[6]) + '</p>' +
      '<div class="actions"><button class="btn primary" type="button" id="tv-next">' + (T.cur + 1 < n ? 'Próxima pergunta' : 'Ver resultado') + '</button></div>' : '');
  box.querySelectorAll('.tv-opt').forEach(b => b.addEventListener('click', () => { it.pick = +b.dataset.o; persist(); renderTrivia(); $('tv-next') && $('tv-next').focus(); }));
  const nx = $('tv-next');
  if (nx) nx.addEventListener('click', () => { T.cur++; persist(); renderTrivia(); if (T.cur < n) showTriviaCountry(); box.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); });
}
function showTriviaCountry() {
  const T = S.trivia; if (!T || T.cur >= T.items.length) return;
  const id = T.items[T.cur].id;
  MapView.focus([id], true); MapView.select(id);
}

function renderResult() {
  const box = $('result');
  if (!isOver()) { box.hidden = true; box.innerHTML = ''; return; }
  const p = S.puzzle;
  const best = L.bestShortest(G, p.a, p.b, S.guesses);
  const mine = L.pathWithin(G, p.a, p.b, S.guesses);
  let html;
  if (S.status === 'won') {
    const extra = S.guesses.length - p.k;
    const title = extra === 0 ? 'Rota perfeita!' : 'Chegou ao destino!';
    const line = extra === 0
      ? 'Você usou exatamente o mínimo de ' + p.k + ' países.'
      : 'Você usou ' + S.guesses.length + ' palpites. O mínimo era ' + p.k + ' (' + extra + ' a mais).';
    html = '<h2>' + title + '</h2><p>' + line + '</p>' +
      '<div class="sub">Sua rota</div><div class="route">' + stopsHtml(mine) + '</div>';
    const mineLen = mine.length - 2;
    if (mineLen > p.k || best.count > 1) {
      html += '<div class="sub">' + (best.count > 1 ? 'Uma das ' + best.count + ' rotas mais curtas' : 'Rota mais curta') + '</div><div class="route">' + stopsHtml(best.path) + '</div>';
    }
  } else {
    html = '<h2>Solução</h2><p>' + (best.count > 1 ? 'Existem ' + best.count + ' rotas mais curtas com ' + p.k + ' países no meio. Esta reaproveita o máximo dos seus palpites:' : 'A única rota mais curta tem ' + p.k + ' países no meio:') + '</p>' +
      '<div class="route">' + stopsHtml(best.path) + '</div>';
  }
  html += '<p class="sub">Clique em qualquer país para abrir a ficha completa.</p>';
  html += '<div class="actions"><button class="btn" type="button" id="share">Copiar resultado</button>' +
    '<button class="btn primary" type="button" id="again">' + (S.mode === 'daily' ? 'Jogar livre' : 'Novo desafio') + '</button></div>';
  box.innerHTML = html; box.hidden = false;
  box.querySelectorAll('.stop').forEach(b => b.addEventListener('click', () => { openCard(b.dataset.id); MapView.focus([b.dataset.id], true); }));
  $('share').addEventListener('click', async () => {
    const txt = shareText();
    try { await navigator.clipboard.writeText(txt); $('share').textContent = 'Copiado!'; }
    catch (e) { setMsg(txt.replace(/\n/g, ' · ')); $('share').textContent = 'Texto exibido acima'; }
  });
  $('again').addEventListener('click', () => newFree());
}

// ---------- ficha do país ----------
const ST = window.GEO_STATS || {};
const INFO = window.GEO_INFO || {};
const SP_AREA = 248219, RJ_AREA = 43750, SPCITY_AREA = 1521;
const nf = (n, d) => n.toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
const RANK = (() => {
  const by = f => G.list.filter(c => ST[c.id] && ST[c.id][f]).sort((a, b) => ST[b.id][f] - ST[a.id][f]).map(c => c.id);
  const pop = by('pop'), gdp = by('gdp'), area = by('area');
  return { pop: id => pop.indexOf(id) + 1, gdp: id => gdp.indexOf(id) + 1, area: id => area.indexOf(id) + 1 };
})();
function fmtPop(n) {
  if (n >= 1e9) return nf(n / 1e9, 2) + ' bilhão' + (n >= 2e9 ? 'ões' : '');
  if (n >= 1e6) return nf(n / 1e6, n >= 1e8 ? 0 : 1) + ' milhões';
  if (n >= 1e4) return nf(Math.round(n / 1e3)) + ' mil';
  return nf(n);
}
function fmtGdp(b) {
  if (b >= 1000) return 'US$ ' + nf(b / 1000, 2) + ' trilhões';
  if (b >= 1) return 'US$ ' + nf(b, b >= 100 ? 0 : 1) + ' bilhões';
  return 'US$ ' + nf(b * 1000) + ' milhões';
}
function times(x) { return x >= 10 ? nf(Math.round(x)) : nf(x, 1); }
function vezes(x) { return times(x) + (x < 2 ? ' vez' : ' vezes'); }
function habitantes(n) { const t = fmtPop(n); return t + (/(milhões|bilhão|bilhões)$/.test(t) ? ' de habitantes' : ' habitantes'); }
function fmtArea(a) { return a >= 10 || Number.isInteger(a) ? nf(a) : nf(a, 2); }
function ordinal(r, total, maior, menor) { return r === 1 ? 'o ' + maior : r === total ? 'o ' + menor : 'o ' + r + 'º ' + maior; }
function areaCompare(a) {
  if (a >= SP_AREA * 1.15) return 'cerca de ' + vezes(a / SP_AREA) + ' o estado de São Paulo';
  if (a >= SP_AREA * 0.85) return 'quase o mesmo tamanho do estado de São Paulo (' + nf(a / SP_AREA * 100) + '%)';
  if (a >= RJ_AREA * 1.15) return nf(a / SP_AREA * 100) + '% do estado de São Paulo, ou ' + vezes(a / RJ_AREA) + ' o estado do Rio de Janeiro';
  if (a >= RJ_AREA * 0.85) return 'quase o mesmo tamanho do estado do Rio de Janeiro (' + nf(a / RJ_AREA * 100) + '%)';
  if (a >= SPCITY_AREA * 2) return nf(a / RJ_AREA * 100) + '% do estado do Rio de Janeiro';
  if (a >= SPCITY_AREA) return 'cerca de ' + vezes(a / SPCITY_AREA) + ' a área da cidade de São Paulo (1.521 km²)';
  if (a >= 1) return 'apenas ' + nf(a / SPCITY_AREA * 100, a / SPCITY_AREA < 0.1 ? 1 : 0) + '% da área da cidade de São Paulo (1.521 km²)';
  return 'menor que muitos bairros: cabe mais de três mil vezes na cidade de São Paulo';
}
function numClima(id) {
  const s = ST[id]; if (!s) return '';
  return 'Tem ' + fmtArea(s.area) + ' km² de área' + (s.note ? ' (' + s.note + ')' : '') + ', ' + areaCompare(s.area) + '; é ' + ordinal(RANK.area(id), G.list.length, 'maior', 'menor') + ' em território entre os ' + G.list.length + ' países do jogo.';
}
function numDemo(id) {
  const s = ST[id]; if (!s) return '';
  const dens = s.pop / s.area;
  const r = RANK.pop(id);
  return 'Tem cerca de ' + habitantes(s.pop) + ' (' + (r === 1 ? 'o país mais populoso do mundo' : r === G.list.length ? 'o menos populoso do jogo' : r + 'º mais populoso do mundo') + ') e densidade de ' + nf(dens, dens < 10 ? 1 : 0) + ' hab./km².';
}
function numEco(id) {
  const s = ST[id]; if (!s) return '';
  if (!s.gdp) return 'O FMI não publica estimativa recente do PIB deste país.';
  const r = RANK.gdp(id);
  return 'O PIB nominal estimado para 2025 é de ' + fmtGdp(s.gdp) + ', ' + (r === 1 ? 'a maior economia do mundo' : 'a ' + r + 'ª maior economia do mundo') + ', com PIB per capita de US$ ' + nf(s.pc) + '.';
}
const SECTIONS = [['c', 'Clima e relevo', numClima, 'after'], ['d', 'Demografia', numDemo, 'before'], ['e', 'Economia', numEco, 'before'], ['h', 'História', null], ['p', 'Política', null]];

// ---------- modo desafio: fichas sem nome para países não descobertos ----------
let challenge = (store.get('challenge') ?? true) !== false;
const DEMONYMS = {
  US: 'americano americana americanos americanas estadunidense estadunidenses norte-americano norte-americanos',
  GB: 'britânico britânica britânicos britânicas inglês inglesa ingleses', JP: 'japonês japonesa japoneses japonesas',
  DE: 'alemão alemã alemães alemãs', CN: 'chinês chinesa chineses chinesas', PT: 'português portuguesa portugueses portuguesas',
  GR: 'grego grega gregos gregas', TR: 'turco turca turcos turcas', EG: 'egípcio egípcia egípcios egípcias',
  SE: 'sueco sueca suecos suecas', CH: 'suíço suíça suíços suíças', DK: 'dinamarquês dinamarquesa dinamarqueses',
  HU: 'húngaro húngara húngaros húngaras magiares', CZ: 'tcheco tcheca tchecos tchecas', SK: 'eslovaco eslovaca eslovacos eslovacas',
  HR: 'croata croatas', LV: 'letão letã letões', PL: 'polonês polonesa poloneses', BY: 'bielorrusso bielorrussa bielorrussos',
  KZ: 'cazaque cazaques', UZ: 'uzbeque uzbeques', TM: 'turcomeno turcomena turcomenos turcomenas', KG: 'quirguiz quirguizes',
  TJ: 'tadjique tadjiques tajique tajiques', AF: 'afegão afegã afegãos afegãs', IN: 'indiano indiana indianos indianas',
  IR: 'iraniano iraniana iranianos iranianas persa persas', SY: 'sírio síria sírios sírias', SA: 'saudita sauditas',
  KW: 'kuwaitiano kuwaitianos', QA: 'catari cataris', AE: 'emiradense emiradenses', OM: 'omani omanis omanense',
  YE: 'iemenita iemenitas', BT: 'butanês butaneses', BD: 'bengali bengalis', MM: 'birmanês birmanesa birmaneses birmaneses',
  KP: 'coreano coreana coreanos coreanas', KR: 'coreano coreana coreanos coreanas', TH: 'tailandês tailandesa tailandeses',
  LA: 'laosiano laosianos', VN: 'vietnamita vietnamitas', TW: 'taiwanês taiwanesa taiwaneses', MY: 'malaio malaia malaios',
  LK: 'cingalês cingaleses', LY: 'líbio líbia líbios', MA: 'marroquino marroquina marroquinos', EH: 'saharaui saharauis',
  ML: 'malinês malineses', NE: 'nigerino nigerinos', TD: 'chadiano chadianos', SD: 'sudanês sudaneses', SS: 'sul-sudanês sul-sudaneses',
  ET: 'etíope etíopes', GA: 'gabonês gaboneses', CM: 'camaronês camaroneses', CF: 'centro-africano centro-africanos',
  CD: 'congolês congoleses', CG: 'congolês congoleses', TG: 'togolês togoleses', GH: 'ganês ganeses ganense',
  BF: 'burquinense burquinenses', CI: 'marfinense marfinenses', GQ: 'equato-guineense equato-guineenses', MG: 'malgaxe malgaxes',
  NZ: 'neozelandês neozelandeses', NL: 'holandês holandesa holandeses neerlandês', BE: 'belga belgas',
  IL: 'israelense israelenses', EC: 'equatoriano equatorianos', SV: 'salvadorenho salvadorenhos', CR: 'costarriquenho costarriquenhos',
  PA: 'panamenho panamenhos', NI: 'nicaraguense nicaraguenses', HN: 'hondurenho hondurenhos', GT: 'guatemalteco guatemaltecos',
  DO: 'dominicano dominicanos', MN: 'mongol mongóis', SI: 'esloveno eslovena eslovenos', RO: 'romeno romena romenos',
  BG: 'búlgaro búlgara búlgaros', CY: 'cipriota cipriotas', MC: 'monegasco monegascos', XK: 'kosovar kosovares',
  ZA: 'sul-africano sul-africanos', CV: 'cabo-verdiano cabo-verdianos', LS: 'basoto basotos', BW: 'tswana tswanas'
};
const SUFFIXES = ['s', 'e', 'o', 'a', 'i', 'os', 'as', 'es', 'is', 'no', 'na', 'nos', 'nas', 'ano', 'ana', 'anos', 'anas', 'iano', 'iana', 'ianos', 'ianas',
  'ense', 'enses', 'esa', 'eses', 'esas', 'ino', 'ina', 'inos', 'inas', 'eiro', 'eira', 'eiros', 'eiras', 'eno', 'ena', 'enos', 'enas',
  'io', 'ia', 'ios', 'ias', 'ita', 'itas', 'ues', 'uesa', 'ueses', 'ol', 'ola', 'ois', 'iaco', 'iaca', 'iacos'];
const ALL_KEYS = new Map(); G.index.forEach(e => { if (!ALL_KEYS.has(e.key)) ALL_KEYS.set(e.key, new Set()); ALL_KEYS.get(e.key).add(e.id); });
const maskCache = {};
function maskTerms(id) {
  if (maskCache[id]) return maskCache[id];
  const c = G.byId[id];
  const out = []; const seen = new Set();
  const add = (txt, kind) => { const w = L.norm(txt).split(' ').filter(Boolean); const k = w.join(' '); if (w.length && !seen.has(k)) { seen.add(k); out.push({ w, kind }); } };
  [c.name, ...c.aliases].forEach(t => add(t, 'país'));
  add(c.capital.replace(/\s*\(.*\)$/, ''), 'capital');
  (DEMONYMS[id] || '').split(' ').filter(Boolean).forEach(t => add(t, 'gentílico'));
  [c.name, ...c.aliases].map(L.norm).filter(n => n && !n.includes(' ')).forEach(n => {
    const bases = [n];
    if (/[aeiou]$/.test(n) && n.length - 1 >= 4) bases.push(n.slice(0, -1));
    if (/ia$/.test(n) && n.length - 2 >= 4) bases.push(n.slice(0, -2));
    bases.forEach(b => SUFFIXES.forEach(suf => {
      const f = b + suf;
      const other = ALL_KEYS.get(f);
      if (f !== n && f.length >= 5 && !(other && !other.has(id))) add(f, 'gentílico');
    }));
  });
  out.sort((a, b) => b.w.length - a.w.length);
  return (maskCache[id] = out);
}
function maskedHtml(text, id) {
  const terms = maskTerms(id);
  const parts = text.split(/(\p{L}+)/u);
  const wi = []; for (let i = 1; i < parts.length; i += 2) wi.push(i);
  const nw = wi.map(i => L.norm(parts[i]));
  const out = parts.map(esc);
  for (let k = 0; k < wi.length; k++) {
    for (const t of terms) {
      const n = t.w.length;
      if (k + n > wi.length) continue;
      let ok = true;
      for (let j = 0; j < n; j++) if (nw[k + j] !== t.w[j]) { ok = false; break; }
      if (!ok) continue;
      out[wi[k]] = '<span class="mask">' + t.kind + '</span>';
      for (let i = wi[k] + 1; i <= wi[k + n - 1]; i++) out[i] = '';
      k += n - 1;
      break;
    }
  }
  return out.join('');
}
function isMystery(id) {
  if (!challenge || isOver()) return false;
  const p = S.puzzle;
  return id !== p.a && id !== p.b && !S.guesses.includes(id);
}

let cardId = null;
function openCard(id) {
  const c = G.byId[id]; if (!c) return;
  const card = $('card');
  const over = isOver();
  const p = S.puzzle;
  const info = INFO[id] || {};
  const mystery = isMystery(id);
  cardId = id;
  let chip = '';
  if (id === p.a) chip = '<span class="chip end">Partida</span>';
  else if (id === p.b) chip = '<span class="chip end">Chegada</span>';
  else if (S.guesses.includes(id)) { const t = L.tier(G, p.a, p.b, id); chip = '<span class="chip t' + t + '">Seu palpite · ' + TIER_TXT[t] + '</span>'; }
  else if (mystery) chip = '<span class="chip">Modo desafio · use as pistas</span>';
  let nb;
  if (!c.neighbors.length) nb = 'Nenhuma fronteira terrestre';
  else if (over) nb = '<div class="nbrs">' + c.neighbors.map(n => '<button type="button" data-id="' + n + '">' + esc(nm(n)) + '</button>').join('') + '</div>';
  else nb = c.neighbors.length + ' vizinho' + (c.neighbors.length > 1 ? 's' : '') + ' (nomes no fim da partida)';
  const s = ST[id] || {};
  const facts = '<div class="facts"><div><span>População</span><b>' + (s.pop ? fmtPop(s.pop) : '—') + '</b></div>' +
    '<div><span>Área</span><b>' + (s.area ? fmtArea(s.area) + ' km²' : '—') + '</b></div>' +
    '<div><span>PIB per capita</span><b>' + (s.pc ? 'US$ ' + nf(s.pc) : 's/ dado') + '</b></div></div>';
  const secs = SECTIONS.map(([k, title, num, where]) => {
    const prose = info[k] || '';
    const n = num ? num(id) : '';
    const text = where === 'before' ? [n, prose].filter(Boolean).join(' ') : [prose, n].filter(Boolean).join(' ');
    const body = mystery ? maskedHtml(text, id) : esc(text);
    return '<section class="sec s-' + k + '"><h4>' + title + '</h4><p>' + (body || 'Ficha em preparação.') + '</p></section>';
  }).join('');
  const head = mystery
    ? '<header><h3><span class="qflag" aria-hidden="true">?</span> País não descoberto</h3><p class="meta">' + esc(c.continent) + ' · nome, bandeira e capital aparecem quando você acertar este país ou ao fim da partida</p>' + chip + '</header>'
    : '<header><h3>' + flag(id) + ' ' + esc(c.name) + '</h3><p class="meta">Capital: ' + esc(c.capital) + ' · ' + esc(c.continent) + '</p>' + chip + '</header>';
  card.innerHTML = '<button class="x" type="button" aria-label="Fechar ficha">×</button>' + head +
    facts + '<section class="sec s-f"><h4>Fronteiras</h4><p>' + nb + '</p></section>' + secs +
    '<p class="src">Números: população pelas estimativas oficiais e da ONU (2022–2026); área pela Divisão de Estatística da ONU; PIB pelo FMI (World Economic Outlook, outubro de 2025). Comparações com SP (248.219 km²) e RJ (43.750 km²) pelo IBGE.</p>';
  card.classList.toggle('mystery', mystery);
  card.hidden = false; card.scrollTop = 0;
  card.querySelector('.x').addEventListener('click', closeCard);
  card.querySelectorAll('.nbrs button').forEach(b => b.addEventListener('click', () => { openCard(b.dataset.id); MapView.focus([b.dataset.id], true); }));
  MapView.select(id);
}
function closeCard() { $('card').hidden = true; cardId = null; MapView.select(null); }
function refreshCard() { if (cardId && !$('card').hidden) { const top = $('card').scrollTop; openCard(cardId); $('card').scrollTop = top; } }
$('challenge').checked = challenge;
$('challenge').addEventListener('change', e => { challenge = e.target.checked; store.set('challenge', challenge); refreshCard(); });

// ---------- autocompletar ----------
let sugg = [], active = -1;
function showSugg() {
  const box = $('sugg'); const inp = $('guess');
  sugg = L.suggest(G, inp.value, 6).filter(id => !S.guesses.includes(id));
  active = sugg.length ? 0 : -1;
  if (!sugg.length || !inp.value.trim()) { box.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
  box.innerHTML = sugg.map((id, i) => '<li role="option" id="opt-' + id + '" data-id="' + id + '" aria-selected="' + (i === active) + '"><span>' + flag(id) + '</span><span>' + esc(nm(id)) + '</span><span class="cc">' + id + '</span></li>').join('');
  box.hidden = false; inp.setAttribute('aria-expanded', 'true');
  box.querySelectorAll('li').forEach(li => li.addEventListener('mousedown', e => { e.preventDefault(); pick(li.dataset.id); }));
  updateActive();
}
function updateActive() {
  const items = $('sugg').querySelectorAll('li');
  items.forEach((li, i) => li.setAttribute('aria-selected', i === active));
  $('guess').setAttribute('aria-activedescendant', active >= 0 && items[active] ? items[active].id : '');
}
function hideSugg() { $('sugg').hidden = true; $('guess').setAttribute('aria-expanded', 'false'); }
function pick(id) { $('guess').value = ''; hideSugg(); submit(id); $('guess').focus(); }

$('guess').addEventListener('input', showSugg);
$('guess').addEventListener('keydown', e => {
  if ($('sugg').hidden) return;
  if (e.key === 'ArrowDown') { active = Math.min(sugg.length - 1, active + 1); updateActive(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { active = Math.max(0, active - 1); updateActive(); e.preventDefault(); }
  else if (e.key === 'Escape') hideSugg();
});
$('guess').addEventListener('blur', () => setTimeout(hideSugg, 120));
$('guess-form').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('guess').value;
  if (!v.trim()) return;
  let id = L.lookup(G, v);
  if (!id && !$('sugg').hidden && active >= 0) id = sugg[active];
  $('guess').value = ''; hideSugg();
  submit(id);
});

// ---------- controles ----------
$('mode-daily').addEventListener('click', () => { if (S.mode !== 'daily') newDaily(); });
$('mode-free').addEventListener('click', () => { if (S.mode !== 'free') newFree(); });
$('new-free').addEventListener('click', newFree);
$('diff-chips').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
  diff = +b.dataset.k;
  $('diff-chips').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  newFree();
}));
$('hint').addEventListener('click', useHint);
$('reveal').addEventListener('click', giveUp);
$('help-open').addEventListener('click', () => { $('help').hidden = false; $('help-close').focus(); });
$('help-close').addEventListener('click', () => { $('help').hidden = true; });
$('help').addEventListener('click', e => { if (e.target === $('help')) $('help').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('help').hidden = true; closeCard(); } });
(function () {
  const st = L.stats(G);
  $('help-stats').textContent = st.countries + ' países no jogo · ' + st.withBorders + ' com fronteira terrestre · ' + st.borders + ' fronteiras mapeadas';
})();

// ---------- mapa ----------
const MapView = (function () {
  const svg = d3.select('#map');
  const vp = svg.append('g');
  const gBase = vp.append('g');
  const gC = vp.append('g');
  const gEdges = vp.append('g');
  const gRoute = vp.append('g');
  const gMk = vp.append('g');
  const gLbl = vp.append('g');
  let W = 800, H = 500, k = 1;
  let mode = 'loading';
  let feats = [];            // features com forma
  const labelLL = {};        // id -> [lon, lat]
  const tiny = new Set();    // países pequenos demais: recebem marcador
  const projection = d3.geoNaturalEarth1();
  const path = d3.geoPath(projection);
  let selected = null;
  let focusIds = [];

  const zoomer = d3.zoom().scaleExtent([1, 60]).on('zoom', e => {
    vp.attr('transform', e.transform); k = e.transform.k; rescale();
  });
  svg.call(zoomer).on('dblclick.zoom', null);

  G.list.forEach(c => { labelLL[c.id] = [c.lon, c.lat]; });

  function size() {
    const r = svg.node().getBoundingClientRect();
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    svg.attr('viewBox', [0, 0, W, H]);
    projection.fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' });
    zoomer.translateExtent([[-W * 0.2, -H * 0.2], [W * 1.2, H * 1.2]]).extent([[0, 0], [W, H]]);
  }

  function stateOf(id) {
    if (!S) return '';
    const p = S.puzzle;
    if (id === p.a) return 'start';
    if (id === p.b) return 'end';
    if (S.guesses.includes(id)) return 't' + L.tier(G, p.a, p.b, id);
    if (isOver() && solSet().has(id)) return 'sol';
    return '';
  }
  function solSet() { return new Set(L.bestShortest(G, S.puzzle.a, S.puzzle.b, S.guesses).path); }
  function known(id) { return !!G.byId[id] && (isOver() || stateOf(id) !== ''); }
  function revealed() {
    const p = S.puzzle; const s = new Set([p.a, p.b, ...S.guesses]);
    if (isOver()) solSet().forEach(id => s.add(id));
    return [...s];
  }

  function draw() {
    size();
    gBase.selectAll('*').remove();
    gBase.append('path').attr('class', 'sphere').attr('d', path({ type: 'Sphere' }));
    gBase.append('path').attr('class', 'grat').attr('d', path(d3.geoGraticule10())).attr('vector-effect', 'non-scaling-stroke');
    if (mode === 'shapes') {
      tiny.clear();
      gC.selectAll('path.c').data(feats, d => d.id).join('path').attr('class', 'c')
        .attr('d', path)
        .each(function (d) { const b = path.bounds(d); if ((b[1][0] - b[0][0]) * (b[1][1] - b[0][1]) < 10 && G.byId[d.id]) tiny.add(d.id); });
      G.list.forEach(c => { if (!feats.find(f => f.id === c.id)) tiny.add(c.id); });
    } else if (mode === 'dots') {
      tiny.clear(); G.list.forEach(c => tiny.add(c.id));
    }
    paint();
  }

  function paint(newId) {
    if (mode === 'loading' || !S) return;
    if (mode === 'shapes') {
      gC.selectAll('path.c')
        .attr('class', d => 'c ' + (G.byId[d.id] ? stateOf(d.id) : 'other') + (known(d.id) ? ' known' : '') + (d.id === selected ? ' sel' : ''))
        .on('click', (e, d) => { if (G.byId[d.id]) openCard(d.id); });
    }
    // marcadores: países minúsculos (ou todos, no mapa simplificado)
    const mkIds = mode === 'dots' ? G.list.map(c => c.id) : [...tiny].filter(id => stateOf(id) !== '' || id === selected);
    gMk.selectAll('circle').data(mkIds, d => d).join('circle')
      .attr('class', id => 'mk ' + stateOf(id) + (known(id) ? ' known' : '') + (id === selected ? ' sel' : ''))
      .attr('cx', id => projection(labelLL[id])[0]).attr('cy', id => projection(labelLL[id])[1])
      .on('click', (e, id) => openCard(id));
    // no mapa simplificado, liga vizinhos revelados
    const rev = revealed();
    const edges = [];
    if (mode === 'dots') rev.forEach(a => G.byId[a].neighbors.forEach(b => { if (a < b && rev.includes(b)) edges.push([a, b]); }));
    gEdges.selectAll('line').data(edges, d => d.join('-')).join('line').attr('class', 'edge-line')
      .attr('x1', d => projection(labelLL[d[0]])[0]).attr('y1', d => projection(labelLL[d[0]])[1])
      .attr('x2', d => projection(labelLL[d[1]])[0]).attr('y2', d => projection(labelLL[d[1]])[1]);
    gLbl.selectAll('text').data(rev, d => d).join('text').attr('class', 'lbl-t')
      .attr('x', id => projection(labelLL[id])[0]).attr('y', id => projection(labelLL[id])[1])
      .text(id => nm(id));
    if (S.status === 'won') drawRoute(L.pathWithin(G, S.puzzle.a, S.puzzle.b, S.guesses), false);
    else gRoute.selectAll('*').remove();
    rescale();
    if (newId && !inView(newId) && L.tier(G, S.puzzle.a, S.puzzle.b, newId) <= 2) focus(focusIds.concat([newId]), true);
  }

  function rescale() {
    gLbl.selectAll('text').attr('font-size', 12 / k).attr('dy', id => (tiny.has(id) ? -9 : 0) / k)
      .style('stroke-width', 3 / k + 'px');
    gMk.selectAll('circle').attr('r', id => (mode === 'dots' ? (stateOf(id) ? 5 : 2.6) : 4.5) / k);
  }

  function inView(id) {
    const t = d3.zoomTransform(svg.node());
    const [x, y] = t.apply(projection(labelLL[id]));
    return x > 20 && x < W - 20 && y > 20 && y < H - 20;
  }

  function focus(ids, animate) {
    if (mode === 'loading') return;
    const pts = ids.map(id => projection(labelLL[id]));
    let x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0]));
    let y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const dx = Math.max(x1 - x0, W * 0.07), dy = Math.max(y1 - y0, H * 0.07);
    const s = Math.max(1, Math.min(14, 0.62 / Math.max(dx / W, dy / H)));
    const t = d3.zoomIdentity.translate(W / 2 - s * cx, H / 2 - s * cy).scale(s);
    if (animate && !reduceMotion) svg.transition().duration(750).call(zoomer.transform, t);
    else svg.call(zoomer.transform, t);
  }

  function fit(animate) {
    if (!S) return;
    const p = S.puzzle;
    if (!isOver()) focusIds = [p.a, p.b];
    else {
      const mine = S.status === 'won' ? (L.pathWithin(G, p.a, p.b, S.guesses) || []) : [];
      focusIds = [...new Set([...solSet(), ...mine])];
    }
    focus(focusIds, animate);
  }

  function drawRoute(route, animate) {
    gRoute.selectAll('*').remove();
    if (!route) return;
    const line = gRoute.append('path').attr('class', 'routeline')
      .attr('d', 'M' + route.map(id => projection(labelLL[id]).join(',')).join('L'));
    if (animate && !reduceMotion) {
      const len = line.node().getTotalLength();
      line.attr('stroke-dasharray', len + ' ' + len).attr('stroke-dashoffset', len)
        .transition().delay(300).duration(1100).attr('stroke-dashoffset', 0)
        .on('end', () => line.attr('stroke-dasharray', null));
    }
  }

  function celebrate(route) { fit(true); drawRoute(route, true); }

  function flash(id) {
    const el = gC.selectAll('path.c').filter(d => d.id === id);
    el.classed('sel', true); setTimeout(() => el.classed('sel', id === selected), 1600);
    if (!inView(id)) focus(focusIds.concat([id]), true);
  }

  function select(id) { selected = id; paint(); }

  function onPuzzle() { paint(); fit(false); }

  // --- carregamento dos contornos ---
  function fixWinding(g) {
    const fix = rings => d3.geoArea({ type: 'Polygon', coordinates: rings }) > 2 * Math.PI ? rings.map(r => r.slice().reverse()) : rings;
    if (g.type === 'Polygon') return { type: 'Polygon', coordinates: fix(g.coordinates) };
    if (g.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: g.coordinates.map(fix) };
    return g;
  }
  function useShapes(gd) {
    feats = [];
    for (const f of gd.features || []) {
      const id = String(f.id || (f.properties && f.properties.id) || '').toUpperCase();
      if (!id || id === 'AQ' || !f.geometry) continue;
      const geometry = fixWinding(f.geometry);
      const feat = { type: 'Feature', id, properties: {}, geometry };
      feats.push(feat);
      if (G.byId[id]) {
        const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
        let best = null, bestA = -1;
        polys.forEach(rings => { const a = d3.geoArea({ type: 'Polygon', coordinates: rings }); if (a > bestA) { bestA = a; best = rings; } });
        if (best) labelLL[id] = d3.geoCentroid({ type: 'Polygon', coordinates: best });
      }
    }
    if (feats.length < 100) return false;
    mode = 'shapes';
    $('map-status').hidden = true;
    $('map-note').hidden = false;
    $('map-note').textContent = 'Contornos: amCharts geodata (worldLow). Arraste e use a roda ou os botões para dar zoom.';
    draw(); fit(false);
    return true;
  }
  function useDots() {
    mode = 'dots';
    $('map-status').hidden = true;
    $('map-note').hidden = false;
    $('map-note').textContent = 'Mapa simplificado: não foi possível carregar os contornos dos países. O jogo funciona normalmente.';
    draw(); fit(false);
  }
  const SOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/amcharts5/5.21.5/geodata/worldLow.js',
    'https://cdnjs.cloudflare.com/ajax/libs/amcharts5/5.20.8/geodata/worldLow.js'
  ];
  function findGeo() {
    if (window.am5geodata_worldLow) return window.am5geodata_worldLow;
    const key = Object.keys(window).find(x => /^am5geodata_worldLow/.test(x));
    return key ? window[key] : null;
  }
  function load(i) {
    if (i >= SOURCES.length) return useDots();
    const s = document.createElement('script');
    let done = false;
    const next = () => { if (done) return; done = true; clearTimeout(timer); const gd = findGeo(); if (!(gd && gd.features && useShapes(gd))) load(i + 1); };
    const timer = setTimeout(() => { if (!done) { done = true; load(i + 1); } }, 9000);
    s.src = SOURCES[i]; s.async = true;
    s.onload = next; s.onerror = () => { if (done) return; done = true; clearTimeout(timer); load(i + 1); };
    document.head.appendChild(s);
  }

  // controles
  $('z-in').addEventListener('click', () => svg.transition().duration(250).call(zoomer.scaleBy, 1.6));
  $('z-out').addEventListener('click', () => svg.transition().duration(250).call(zoomer.scaleBy, 1 / 1.6));
  $('z-fit').addEventListener('click', () => fit(true));
  let rt;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (mode !== 'loading') { draw(); fit(false); } else size(); }, 120); }).observe(svg.node());

  size();
  return { paint, focus, fit, celebrate, flash, select, onPuzzle, load, useDots, useShapes };
})();

// ---------- início (preserva o estado entre versões publicadas) ----------
window.claude?.hot?.snapshot?.(() => (S ? JSON.parse(JSON.stringify(S)) : {}));
function start(data) {
  if (data && data.puzzle && G.byId[data.puzzle.a] && G.byId[data.puzzle.b]) { S = data; begin(false); }
  else newDaily();
  MapView.load(0);
  if (window.matchMedia && matchMedia('(pointer: fine)').matches) $('guess').focus();
}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
window.__geogame = { G, L, get state() { return S; }, submit, MapView };
})();
