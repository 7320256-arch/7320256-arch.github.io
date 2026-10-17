/* legado.js — RFM v2.9 · "Legado Cuscatleco: La ruta al Mundial"
 * Saga narrativa OPCIONAL de cuatro años de carrera (cuatro capítulos) para una carrera salvadoreña, en DT, Presidente o Fundador.
 * Sigue a tres protagonistas (un juvenil salvadoreño, una promesa extranjera y un veterano capitán) y lee hechos reales:
 * caja, cantera, promociones, minutos, ventas al extranjero, torneos regionales, convocatorias y clasificación mundialista.
 * Premios: historia, prestigio (+reputación), logros y finales. Nunca dinero.
 * Si te mudás a otro país la saga queda en pausa; si cambiás de club, los protagonistas que quedaron atrás se reemplazan. */
(function (root) {
  'use strict';
  const gg = () => (typeof G !== 'undefined' ? G : null);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOC = { pri: 'Primer Equipo', res: 'Reservas', u20: 'Sub-20', u17: 'Sub-17' };
  const ROLES = { juv: 'Joven promesa salvadoreña', ext: 'Promesa de la región', vet: 'Capitán y guía' };
  const ICO = { juv: '🇸🇻', ext: '🌎', vet: '🎖' };
  const NEXTSTEP = 4;

  function active() { const g = gg(); return !!(g && g.clubes && g.userClubId && !g.reto && !(g.pres && g.pres.fund && g.pres.fund.fase === 'amateur')); }
  const sv = () => { const g = gg(); return !!g && (!g.pais || g.pais === 'SV'); };
  function fresh() { return { v: 1, st: 'idle', y0: null, n: 0, base: null, pro: {}, cnt: { promos: 0, ventasExt: 0, tit: 0, convMax: 0 }, yr: { reg: false, top3: false, rel: false }, cap: [], end: null, log: [], pend: [], sold: {}, heredero: false, runs: 0 }; }
  function L() { const g = gg(); if (!g) return null; if (!g.leg) g.leg = fresh(); const l = g.leg; ['cnt', 'yr', 'pro', 'sold'].forEach(k => { if (!l[k]) l[k] = fresh()[k]; }); if (!l.cap) l.cap = []; if (!l.log) l.log = []; if (!l.pend) l.pend = []; return l; }
  function migrate() { try { if (gg() && gg().clubes) L(); } catch (e) { } }

  /* ---------- jugadores ---------- */
  function allPlayers() {
    const u = userClub(), out = u.plantilla.map(p => ({ p, loc: 'pri' }));
    try { if (root.PL && PL.active()) ['res', 'u20', 'u17'].forEach(c => PL.arr(c).forEach(p => out.push({ p, loc: c }))); } catch (e) { }
    return out;
  }
  function findP(id) { return allPlayers().find(x => x.p.id === id) || null; }
  const isSal = p => (p.nacionalidad || 'El Salvador') === 'El Salvador';
  function mkExt() {
    const u = userClub(), pos = pick(['MED', 'DEL', 'DEF']);
    const p = genPlayer(pos, 3); p.edad = 18; p.nacionalidad = pick(['Guatemala', 'Honduras', 'Costa Rica', 'Panamá', 'Nicaragua']);
    p.media = calcMedia(p); p.potencial = Math.max(p.potencial || 0, 76 + rnd(8)); p.scouted = true; p.contrato = 3; p.moral = 80; p.equipoOrigen = 'Academia regional';
    p.valorMercado = Math.round(p.media * p.media * 40 * ageFactor(18));
    let ok = false; try { if (root.PL && PL.active() && PL.arr('u20').length < 22) { PL.arr('u20').push(p); ok = true; } } catch (e) { }
    if (!ok) u.plantilla.push(p);
    return { p, loc: ok ? 'u20' : 'pri' };
  }
  function choose(role, used) {
    const A = allPlayers().filter(x => !used.has(x.p.id)); let c = null;
    if (role === 'juv') c = A.filter(x => isSal(x.p) && x.p.edad <= 20 && x.loc !== 'pri').sort((a, b) => b.p.potencial - a.p.potencial)[0] || A.filter(x => isSal(x.p) && x.p.edad <= 22).sort((a, b) => b.p.potencial - a.p.potencial)[0] || A.filter(x => isSal(x.p)).sort((a, b) => a.p.edad - b.p.edad)[0];
    else if (role === 'ext') { const REG5 = ['Guatemala', 'Honduras', 'Costa Rica', 'Panamá', 'Nicaragua'], F = A.filter(x => !isSal(x.p) && x.p.edad <= 23); c = F.filter(x => REG5.indexOf(x.p.nacionalidad) >= 0).sort((a, b) => b.p.potencial - a.p.potencial)[0] || mkExt(); }
    else c = A.filter(x => x.loc === 'pri' && isSal(x.p) && x.p.edad >= 29).sort((a, b) => b.p.media - a.p.media)[0] || A.filter(x => x.loc === 'pri').sort((a, b) => b.p.edad - a.p.edad)[0];
    return c ? c.p.id : null;
  }
  function ensureProtagonists(announce) {
    const l = L(), used = new Set(Object.values(l.pro).filter(Boolean)); let ch = 0;
    ['juv', 'ext', 'vet'].forEach(r => {
      const id = l.pro[r]; if (id && (findP(id) || l.sold[id])) return;
      const nid = choose(r, used); if (nid) { l.pro[r] = nid; used.add(nid); ch++; const f = findP(nid); if (announce && f) { try { pushNews(`📖 Legado: ${f.p.nombre} es ahora tu ${ROLES[r].toLowerCase()}.`, 'info', 'club'); } catch (e) { } } }
    });
    return ch;
  }

  /* ---------- seguimiento ---------- */
  function convCount() { const s = gg().sel; if (!s || !s.conv) return 0; const ids = new Set(allPlayers().map(x => x.p.id)); return s.conv.filter(id => ids.has(id)).length; }
  function qualified() { const s = gg().sel, l = L(); if (!s) return false; return (s.hist || []).some(h => h.y >= l.y0 && ((h.k === 'WCQ' && /Clasific/.test(h.res || '') && !/No clasific/.test(h.res || '')) || (h.k === 'WC' && h.res !== 'No participó'))); }
  function youthCount(c) { try { return root.PL && PL.active() ? PL.arr(c).length : 99; } catch (e) { return 99; } }
  function juvPJ() { const f = findP(L().pro.juv); return f ? ((f.p.stats && f.p.stats.pj) || 0) : 0; }
  function objectives(n) {
    const g = gg(), l = L(), u = userClub(), yr = l.yr, c = l.cnt;
    if (n === 0) return [
      { t: 'Caja del club en positivo', ok: g.budget >= 0, v: money(g.budget) },
      { t: 'Evitar el descenso este año', ok: !yr.rel, v: yr.rel ? 'Descendió' : 'Sin descenso' },
      { t: 'Cantera abierta: Sub-17 con 8+ y Sub-20 con 10+', ok: youthCount('u17') >= 8 && youthCount('u20') >= 10, v: youthCount('u17') + ' / ' + youthCount('u20') }];
    if (n === 1) return [
      { t: 'Subir 3 juveniles al Primer Equipo', ok: c.promos >= 3, v: c.promos + '/3' },
      { t: 'Tu promesa salvadoreña suma 10 partidos', ok: juvPJ() >= 10, v: juvPJ() + '/10' }];
    if (n === 2) return [
      { t: 'Competir afuera (Centroamericana/CONCACAF) o terminar Top 3', ok: !!(yr.reg || yr.top3), v: yr.reg ? 'Torneo regional' : yr.top3 ? 'Top 3' : 'Pendiente' },
      { t: 'Exportar talento: vender 1 jugador al extranjero', ok: c.ventasExt >= 1, v: c.ventasExt + '/1' },
      { t: 'Sin desmantelar el club: plantilla de 20+', ok: u.plantilla.length >= 20, v: String(u.plantilla.length) }];
    return [
      { t: 'Al menos 2 jugadores del club en la Selecta', ok: Math.max(c.convMax, convCount()) >= 2, v: Math.max(c.convMax, convCount()) + '/2' },
      { t: 'El Salvador clasifica al Mundial', ok: qualified(), v: qualified() ? 'Clasificó' : 'Pendiente' }];
  }
  const CH = [
    { n: 'Las raíces', ico: '🌱', intro: 'Todo gran legado empieza en casa. Estabilizá las cuentas de {club}, abrí el camino de la cantera y cuidá a quien llevará la bandera: {juv}.' },
    { n: 'Debutar una generación', ico: '🎽', intro: 'Es hora de que los chicos jueguen. Subí juveniles al Primer Equipo y dale minutos a {juv}: el país los está mirando.' },
    { n: 'Centroamérica nos mira', ico: '🌎', intro: 'La región fija sus ojos en {club}. Competí afuera o peleá arriba, vendé talento sin vaciar el vestuario. {ext} ya llama la atención de otros países.' },
    { n: 'La ruta al Mundial', ico: '🏆', intro: 'La Selecta se juega el sueño. Aportá jugadores del club y ayudá a que El Salvador llegue al Mundial. {vet} sabe lo que pesa esa camiseta.' }];
  const nameOf = r => { const f = findP(L().pro[r]); return f ? f.p.nombre : (L().sold[L().pro[r]] ? 'tu ex jugador' : 'el protagonista'); };
  const fill = t => t.replace('{club}', userClub().nombre).replace('{juv}', nameOf('juv')).replace('{ext}', nameOf('ext')).replace('{vet}', nameOf('vet'));

  /* ---------- ciclo ---------- */
  function start() {
    const g = gg(), l = L(); if (!active() || !sv()) { toast('La saga se juega en una carrera salvadoreña'); return; }
    if (l.st === 'run') return;
    const keepRuns = l.runs || 0, u = userClub(); Object.assign(l, fresh()); l.runs = keepRuns + 1;
    l.st = 'run'; l.y0 = g.temporada; l.n = 0;
    l.base = { club: u.nombre, clubId: u.id, nivel: u.nivel, tier: u.tier, caja: g.budget };
    ensureProtagonists(false);
    pushNews(`📖 Comienza el Legado Cuscatleco con ${u.nombre}.`, 'gol', 'club');
    autoSave(); closeModal(); renderAll(); switchView('legado');
    openModal(`<div class="modal-title">📖 Legado Cuscatleco · Capítulo 1</div><p class="muted">${esc(CH[0].n)}</p><p>${esc(fill(CH[0].intro))}</p><p class="muted"><small>Seguí el avance en la pestaña Legado. Podés ignorar un capítulo: tu carrera sigue igual.</small></p><div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="closeModal()">▶ Empezar</button></div>`);
  }
  function onPromo(p, from) {
    try {
      const l = L(); if (!l || l.st !== 'run' || !active() || !sv()) return;
      l.cnt.promos++;
      const r = ['juv', 'ext', 'vet'].find(k => l.pro[k] === p.id);
      if (r && (r === 'juv' || r === 'ext') && !l.heredero) { l.heredero = true; if (root.ACH) ACH.unlock(62, p.nombre); pushNews(`📖 Legado: ${p.nombre} llega al Primer Equipo. ¡Primer heredero!`, 'gol', 'club'); }
    } catch (e) { }
  }
  function onSale(p, country) {
    try {
      const l = L(); if (!l || l.st !== 'run' || !active() || !sv()) return;
      if (country && country !== 'El Salvador') l.cnt.ventasExt++;
      if (Object.values(l.pro).indexOf(p.id) >= 0) { l.sold[p.id] = country || 'El Salvador'; pushNews(`📖 Legado: ${p.nombre} deja el club (${country || 'El Salvador'}).`, 'info', 'club'); }
    } catch (e) { }
  }
  function onMatch(m) { try { const l = L(); if (l && l.st === 'run' && m && (m.comp === 'Centro' || m.comp === 'CONCACAF')) l.yr.reg = true; } catch (e) { } }

  function checkWC() {
    try {
      const s = gg().sel; if (!s || !s.comp || s.comp.k !== 'WC' || !s.comp.groups) return;
      const won = s.comp.groups.some(g => (g.res || []).some(x => (x[1] === 'SLV' && x[3] > x[4]) || (x[2] === 'SLV' && x[4] > x[3])));
      if (won && root.ACH) ACH.unlock(67);
    } catch (e) { }
  }
  function onCampaign(res, fired) {
    try {
      const g = gg(); if (!g || !active()) return; checkWC();
      const l = L(); if (!sv()) return;
      if (l.st === 'done') { check80(); return; }
      if (l.st !== 'run') return;
      const yr = l.yr; ensureProtagonists(true);
      if (res.lvl === 1 && res.pos <= 3) yr.top3 = true; if (res.relegated) yr.rel = true; if (res.titulo) l.cnt.tit++;
      l.cnt.convMax = Math.max(l.cnt.convMax, convCount());
      if (res.campania === 'Clausura') closeChapter(res);
    } catch (e) { console.warn('LEG.onCampaign', e); }
  }
  const scenePro = r => { const f = findP(L().pro[r]); const l = L(); if (f) return `${ICO[r]} <b>${esc(f.p.nombre)}</b> (${f.p.edad}, ${f.p.posicion}, ${f.p.media}/${f.p.potencial}) — ${LOC[f.loc]} · ${(f.p.stats && f.p.stats.pj) || 0} partidos`; const s = l.sold[l.pro[r]]; return `${ICO[r]} ${esc(ROLES[r])} — ${s ? 'vendido (' + esc(s) + ')' : 'ya no está en el club'}`; };
  function closeChapter(res) {
    const g = gg(), l = L(), n = l.n, ob = objectives(n), k = ob.filter(o => o.ok).length;
    const r = k === ob.length ? 'ok' : k >= Math.ceil(ob.length / 2) ? 'parcial' : 'no';
    l.cap[n] = { n, res: r, y: g.temporada, ob: ob.map(o => ({ t: o.t, ok: o.ok, v: o.v })) };
    const rep = r === 'ok' ? 3 : r === 'parcial' ? 1 : 0; if (rep) g.reputacion = Math.min(100, (g.reputacion || 50) + rep);
    if (r === 'ok' && root.ACH) ACH.unlock([61, 63, 64][n] || 0, 'capítulo ' + (n + 1));
    const tone = { ok: 'Capítulo cumplido. ' + ['La casa está en orden y el camino quedó abierto.', 'Una generación empieza a hacerse un lugar.', 'Centroamérica ya sabe de dónde vienen estos muchachos.', 'La Selecta tuvo la sangre del club.'][n], parcial: 'Se logró a medias. ' + ['Faltaron piezas, pero la base está.', 'Hubo debuts, aunque la generación aún no despega.', 'El club se asomó a la región sin terminar de convencer.', 'La Selecta sigue en camino.'][n], no: 'No fue el año. La historia sigue y aún hay tiempo de enderezarla.' }[r];
    const html = `<div class="modal-title">${CH[n].ico} Capítulo ${n + 1} · ${esc(CH[n].n)}</div>
      <p class="${r === 'ok' ? 'green' : r === 'parcial' ? 'amber' : 'red'}"><b>${r === 'ok' ? '✔ Cumplido' : r === 'parcial' ? '◐ A medias' : '✖ No cumplido'}</b>${rep ? ` · +${rep} de reputación` : ''}</p><p>${esc(tone)}</p>
      <div class="pr-report">${ob.map(o => `<div class="pr-rep-row"><span>${o.ok ? '✔' : '✖'} ${esc(o.t)}</span><b>${esc(o.v)}</b></div>`).join('')}</div>
      <hr class="sep"><div class="pr-msgs">${['juv', 'ext', 'vet'].map(x => '<div>' + scenePro(x) + '</div>').join('')}</div>`;
    l.pend.push(html); l.log.unshift({ y: g.temporada, t: `${CH[n].ico} ${CH[n].n}: ${r === 'ok' ? 'cumplido' : r === 'parcial' ? 'a medias' : 'no cumplido'}` });
    pushNews(`📖 Legado · Capítulo ${n + 1} «${CH[n].n}»: ${r === 'ok' ? 'cumplido' : r === 'parcial' ? 'a medias' : 'no cumplido'}.`, r === 'no' ? 'info' : 'bueno', 'club');
    l.n = n + 1; l.yr = { reg: false, top3: false, rel: false };
    if (n === NEXTSTEP - 1) finish(); else if (l.pend) l.pend.push(`<div class="modal-title">${CH[n + 1].ico} Capítulo ${n + 2} · ${esc(CH[n + 1].n)}</div><p>${esc(fill(CH[n + 1].intro))}</p>`);
  }
  function endings() {
    const g = gg(), l = L(), u = userClub(), c = l.cnt, b = l.base || {};
    const q = qualified(), cv = c.convMax;
    const list = [];
    if (q && cv >= 2) list.push('mundialista');
    if ((b.nivel >= 2 || b.tier >= 4) && u.nivel < (b.nivel || 1) && g.budget >= 0 && c.promos >= 3) list.push('milagro');
    if (c.tit >= 2) list.push('gigante');
    if (c.promos >= 8 && c.ventasExt >= 3) list.push('fabrica');
    return list;
  }
  const ENDS = {
    mundialista: { n: 'Generación Mundialista', ico: '🏆', t: 'El Salvador clasificó al Mundial y {club} puso a sus hijos en la lista. La cantera, la región y la Selecta por fin hablaron el mismo idioma.' },
    milagro: { n: 'Milagro del Barrio', ico: '🏘', t: '{club} empezó desde abajo y terminó arriba, con las cuentas en orden y una generación propia. Nadie lo creía; todos lo cuentan.' },
    gigante: { n: 'Gigante Centroamericano', ico: '👑', t: '{club} dominó la región: títulos, respeto y rivales que ya no quieren cruzarlo. La bandera cuscatleca se ve desde lejos.' },
    fabrica: { n: 'Fábrica Cuscatleca', ico: '🏭', t: '{club} se volvió la fábrica de talento del país: récord de debutantes y ventas al extranjero. Quizá falte la copa, pero sobra legado.' },
    camino: { n: 'Una generación en camino', ico: '🌅', t: 'La saga cierra sin un final soñado, pero la semilla está plantada: {club} sigue formando a la próxima camada. El Mundial todavía puede llegar.' }
  };
  function finish() {
    const g = gg(), l = L(), list = endings(), k = list[0] || 'camino', e = ENDS[k];
    l.end = { k, alts: list.slice(1), y: g.temporada, club: userClub().nombre, stats: { promos: l.cnt.promos, ventasExt: l.cnt.ventasExt, tit: l.cnt.tit, conv: l.cnt.convMax, q: qualified() } };
    l.st = 'done';
    if (root.ACH) { if (list.indexOf('mundialista') >= 0) ACH.unlock(68); if (list.indexOf('fabrica') >= 0) ACH.unlock(69); if (list.indexOf('milagro') >= 0) ACH.unlock(70); }
    check80();
    g.reputacion = Math.min(100, (g.reputacion || 50) + 2);
    l.pend.push(`<div class="modal-title">${e.ico} Final: ${esc(e.n)}</div><p>${esc(e.t.replace('{club}', userClub().nombre))}</p><div class="pr-report"><div class="pr-rep-row"><span>Juveniles al Primer Equipo</span><b>${l.cnt.promos}</b></div><div class="pr-rep-row"><span>Ventas al extranjero</span><b>${l.cnt.ventasExt}</b></div><div class="pr-rep-row"><span>Títulos durante la saga</span><b>${l.cnt.tit}</b></div><div class="pr-rep-row"><span>Jugadores en la Selecta (máx.)</span><b>${l.cnt.convMax}</b></div></div><hr class="sep"><div class="pr-msgs">${['juv', 'ext', 'vet'].map(x => '<div>' + scenePro(x) + '</div>').join('')}</div><p class="muted"><small>Tu libro de legado queda en la pestaña Legado.</small></p>`);
    l.log.unshift({ y: g.temporada, t: `${e.ico} Final: ${e.n}` });
    pushNews(`📖 Legado Cuscatleco: final «${e.n}».`, 'gol', 'club');
  }
  function check80() {
    try {
      const g = gg(), l = L(); if (l.st !== 'done' || !root.ACH) return;
      const all4 = [0, 1, 2, 3].every(i => l.cap[i] && l.cap[i].res === 'ok');
      const tit = (g.palmares || []).filter(x => !/Sub-\d|Reservas|Supercopa/.test(x.comp || '')).length;
      if (all4 && tit >= 20) ACH.unlock(80);
    } catch (e) { }
  }
  let NEXT = null;
  function showPending(next) {
    try {
      const l = L();
      if (!l || !l.pend || !l.pend.length || !active()) { if (typeof next === 'function') next(); return false; }
      const html = l.pend.shift(); NEXT = next;
      openModal(html + `<div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="LEG.cont()">Continuar</button></div>`);
      return true;
    } catch (e) { if (typeof next === 'function') next(); return false; }
  }
  function cont() { const nx = NEXT; NEXT = null; closeModal(); showPending(nx); }

  /* ---------- pestaña ---------- */
  function proCard(r) {
    const l = L(), f = findP(l.pro[r]);
    if (!f) { const s = l.sold[l.pro[r]]; return `<div class="offer"><b>${ICO[r]} ${esc(ROLES[r])}</b><br><small class="muted">${s ? 'Vendido (' + esc(s) + ')' : 'Sin asignar'}</small></div>`; }
    const p = f.p, st = p.stats || {};
    return `<div class="offer"><b>${ICO[r]} ${esc(p.nombre)}</b> <small class="muted">· ${esc(ROLES[r])}</small><br><span class="posb pos-${p.posicion}">${p.posicion}</span> ${p.edad} años · media <b>${p.media}</b>/${p.potencial} · ${esc(p.nacionalidad || 'El Salvador')}<br><small class="muted">${LOC[f.loc]} · ${st.pj || 0} partidos · ${st.goles || 0} goles</small></div>`;
  }
  function render() {
    const h = document.getElementById('legado-panel'); if (!h) return; const g = gg(); if (!g) return;
    const l = L(); const head = '<div class="panel-title">📖 Legado Cuscatleco: La ruta al Mundial</div>';
    if (!active()) { h.innerHTML = head + `<p class="muted">${g.reto ? 'No está disponible en los retos.' : 'Disponible cuando tu club se profesionalice.'}</p>`; return; }
    const intro = '<p class="muted">Saga opcional de cuatro años (cuatro capítulos) que une cantera, primer equipo, región y la Selecta. Sigue a tres protagonistas y termina en uno de varios finales. Premia con historia, prestigio y logros, nunca con dinero. Podés ignorar un capítulo: tu carrera sigue igual.</p>';
    if (l.st === 'idle') {
      h.innerHTML = head + intro + (sv() ? `<div class="center" style="margin:12px 0"><button class="btn btn-p" onclick="LEG.start()">📖 Comenzar la saga con ${esc(userClub().nombre)}</button></div>` : '<div class="offer"><b>🔒 Se juega en El Salvador</b><br><small class="muted">Aceptá una oferta de un club salvadoreño desde 🌎 Región para entrar a la saga.</small></div>');
      return;
    }
    const paused = l.st === 'run' && !sv();
    const steps = CH.map((c, i) => { const cp = l.cap[i]; const cur = l.st === 'run' && i === l.n; const ic = cp ? (cp.res === 'ok' ? '✔' : cp.res === 'parcial' ? '◐' : '✖') : cur ? '▶' : '🔒'; return `<div class="offer" style="${cur ? 'border-color:#ffd447' : cp ? '' : 'opacity:.6'}"><b>${ic} ${c.ico} Capítulo ${i + 1} · ${esc(c.n)}</b>${cp ? `<br><small class="muted">${cp.y} · ${cp.res === 'ok' ? 'Cumplido' : cp.res === 'parcial' ? 'A medias' : 'No cumplido'}</small>` : ''}</div>`; }).join('');
    let body = '';
    if (paused) body += '<div class="offer" style="border-color:#ffb300"><b>⏸ En pausa</b><br><small class="muted">Estás fuera de El Salvador. La saga sigue cuando vuelvas a un club salvadoreño.</small></div>';
    if (l.st === 'run') {
      try { ensureProtagonists(false); } catch (e) { }
      const n = l.n, ob = objectives(n);
      body += `<div class="panel-title" style="margin-top:10px">${CH[n].ico} Capítulo ${n + 1} · ${esc(CH[n].n)}</div><p>${esc(fill(CH[n].intro))}</p><div class="pr-report">${ob.map(o => `<div class="pr-rep-row"><span>${o.ok ? '✔' : '⬜'} ${esc(o.t)}</span><b>${esc(o.v)}</b></div>`).join('')}</div><small class="muted">Se evalúa al cerrar el año (fin del Clausura).</small>`;
    } else if (l.end) {
      const e = ENDS[l.end.k]; body += `<div class="offer" style="border-color:#ffd447"><b class="gold">${e.ico} Final: ${esc(e.n)}</b><br>${esc(e.t.replace('{club}', l.end.club))}${l.end.alts.length ? `<br><small class="muted">También cumplías: ${l.end.alts.map(a => esc(ENDS[a].n)).join(', ')}</small>` : ''}</div><div class="pr-report"><div class="pr-rep-row"><span>Juveniles al Primer Equipo</span><b>${l.end.stats.promos}</b></div><div class="pr-rep-row"><span>Ventas al extranjero</span><b>${l.end.stats.ventasExt}</b></div><div class="pr-rep-row"><span>Títulos durante la saga</span><b>${l.end.stats.tit}</b></div><div class="pr-rep-row"><span>Jugadores en la Selecta (máx.)</span><b>${l.end.stats.conv}</b></div></div><div class="center" style="margin:10px 0"><button class="btn btn-sm" onclick="LEG.again()">↻ Empezar una nueva saga</button></div>`;
    }
    h.innerHTML = head + intro + `<div class="panel-title" style="margin-top:6px">Capítulos</div>${steps}${body}<div class="panel-title" style="margin-top:10px">Protagonistas</div>${['juv', 'ext', 'vet'].map(proCard).join('')}${l.log.length ? `<div class="panel-title" style="margin-top:10px">Diario</div>${l.log.slice(0, 10).map(x => `<div class="offer"><small class="muted">${x.y}</small> ${esc(x.t)}</div>`).join('')}` : ''}`;
  }
  function again() { openModal(`<div class="modal-title">↻ Nueva saga</div><p>Se reemplaza el libro de legado actual por una saga nueva con tu club de hoy. Los logros ya conseguidos se mantienen.</p><div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="LEG.reset()">Empezar</button> <button class="btn" onclick="closeModal()">Cancelar</button></div>`); }
  function reset() { const l = L(); l.st = 'idle'; start(); }

  root.LEG = { active, migrate, start, onPromo, onSale, onMatch, onCampaign, showPending, cont, render, again, reset, objectives, qualified, convCount, L, ENDS, CH };
})(typeof window !== 'undefined' ? window : globalThis);
