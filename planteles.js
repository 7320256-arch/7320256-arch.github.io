/* ============================================================================
 * planteles.js — v2.7 · Cuatro planteles por club + ligas juveniles
 * ----------------------------------------------------------------------------
 * Primer Equipo (G.clubes[id].plantilla), Reservas, Sub-20 y Sub-17 del club del usuario.
 *  - Cada jugador vive en UN solo plantel (identidad única). Subir/bajar = mover entre listas.
 *  - Sub-17 = la academia (G.pres.cantera.jugadores): una sola fuente para DT y Presidente.
 *  - Reservas y Sub-20 viven en G.planteles. Rivales juveniles: equipos abstractos (rating)
 *    de los clubes de tu división, que juegan el MISMO calendario que el primer equipo.
 *  - Todo se simula solo (sin partidos que jugar a mano): una línea de noticias por fecha.
 *  - Elegibilidad por edad: Sub-17 ≤17, Sub-20 ≤20, Reservas sin tope. La edad sube una vez al año.
 *  - Costo: pequeño y fijo por fecha (entrenadores y viajes), asentado en el libro mayor.
 * ========================================================================== */
(function (root) {
  'use strict';
  const gg = () => (typeof G !== 'undefined' ? G : null);
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (typeof root.money === 'function' ? root.money(n) : '$' + Math.round(n).toLocaleString('en-US'));

  const ORDER = ['u17', 'u20', 'res', 'pri'];                 // de abajo hacia arriba
  const CAT = {
    u17: { n: 'Sub-17', ico: '🌱', maxAge: 17, cap: 18, off: -27, titulo: 'Campeonato Sub-17' },
    u20: { n: 'Sub-20', ico: '🎓', maxAge: 20, cap: 22, off: -17, titulo: 'Campeonato Sub-20' },
    res: { n: 'Reservas', ico: '🛡', maxAge: 99, cap: 24, off: -9, titulo: 'Campeonato Reservas' },
    pri: { n: 'Primer Equipo', ico: '⭐', maxAge: 99, cap: 28, off: 0 }
  };
  const FIRST_MIN = 16, FIRST_MAX = 28;
  const COST = { 1: 1300, 2: 600, 3: 270 };                   // por categoría y fecha

  function active() {
    const g = gg();
    if (!g || !g.clubes || !g.userClubId || g.reto) return false;
    try { if (root.PRES && PRES.isFund && PRES.isFund()) return false; } catch (e) { }
    return true;
  }
  const isPres = () => { try { return !!(root.PRES && PRES.isPres && PRES.isPres()); } catch (e) { return false; } };
  const club = () => userClub();

  // ---- estado ----
  function st() {
    const g = gg();
    if (!g.planteles) g.planteles = { res: [], u20: [], u17: [] };
    const p = g.planteles; p.res = p.res || []; p.u20 = p.u20 || []; p.u17 = p.u17 || [];
    if (!g.plStats) g.plStats = { promos: 0, rel: 0 };
    if (!g.juv) g.juv = { key: '', tabs: { res: {}, u20: {}, u17: {} }, last: {}, noise: {}, hist: [] };
    return p;
  }
  // La Sub-17 es la academia (misma lista para DT y Presidente).
  function arr(cat) {
    const g = gg(), p = st();
    if (cat === 'pri') return club().plantilla;
    if (cat === 'u17') {
      if (g.pres && g.pres.cantera) { if (!Array.isArray(g.pres.cantera.jugadores)) g.pres.cantera.jugadores = []; return g.pres.cantera.jugadores; }
      return p.u17;
    }
    return p[cat];
  }
  function setArr(cat, a) {
    const g = gg(), p = st();
    if (cat === 'pri') club().plantilla = a;
    else if (cat === 'u17' && g.pres && g.pres.cantera) g.pres.cantera.jugadores = a;
    else p[cat] = a;
  }
  function find(id) {
    for (const c of ORDER) { const a = arr(c), i = a.findIndex(p => p.id === id); if (i >= 0) return { cat: c, i, p: a[i] }; }
    return null;
  }
  function refRating() { try { return teamRating(club()); } catch (e) { return 60; } }

  // ---- generación ----
  function mk(age, media, pot) {
    const pos = pick(['POR', 'DEF', 'DEF', 'MED', 'MED', 'DEL', 'DEL']);
    return mkPos(pos, age, media, pot);
  }
  function mkPos(pos, age, media, pot) {
    const f = v => clamp(Math.round(v + rnd(7) - 3), 8, 95);
    const a = { ataque: f(media), defensa: f(media), fisico: f(media - 3), porteria: f(media * 0.4) };
    if (pos === 'POR') { a.porteria = f(media + 12); a.ataque = f(media * 0.2); } else if (pos === 'DEF') a.defensa = f(media + 8); else if (pos === 'DEL') a.ataque = f(media + 8);
    const p = {
      id: uid(), nombre: uniqueName(), posicion: pos, edad: age, atributos: a, energia: 100, moral: 70 + rnd(16), contrato: 3, quiereIrse: false,
      lesionado: false, lesionJor: 0, yellowCards: 0, suspended: 0, nacionalidad: HOME(), equipoOrigen: 'Cantera ' + club().nombre,
      stats: { goles: 0, asistencias: 0, atajadas: 0, pj: 0 }, personalidad: Math.random() < 0.3 ? 'Promesa' : pick(PERSONALIDADES)
    };
    p.media = calcMedia(p); p.potencial = Math.max(clamp(Math.round(pot), 35, 92), p.media);
    p.salario = Math.round(p.media * p.media * 0.3 / 10) * 10; p.valorMercado = Math.round(p.media * p.media * 40 * ageFactor(p.edad));
    return p;
  }
  function fill(cat, target) {
    const a = arr(cat), ref = refRating(), c = CAT[cat];
    const posList = ['POR', 'POR', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL', 'DEL', 'MED', 'DEF', 'DEL'];
    let guard = 0;
    while (a.length < target && guard++ < 40) {
      const need = ['POR', 'DEF', 'MED', 'DEL'].find(po => a.filter(p => p.posicion === po).length < ({ POR: 2, DEF: 4, MED: 4, DEL: 3 }[po]));
      const pos = need || pick(posList);
      const age = cat === 'u17' ? 15 + rnd(3) : cat === 'u20' ? 17 + rnd(4) : 19 + rnd(6);
      const media = clamp(Math.round(ref + c.off + rnd(11) - 5 + (age - (cat === 'u17' ? 16 : cat === 'u20' ? 18 : 21)) * 1.2), 18, 80);
      const grow = age <= 17 ? 14 + rnd(18) : age <= 20 ? 8 + rnd(12) : 3 + rnd(7);
      a.push(mkPos(pos, age, media, media + grow));
    }
  }
  function ensureSquads() {
    if (!active()) return;
    st();
    if (arr('u17').length < 10) fill('u17', 12);
    if (arr('u20').length < 12) fill('u20', 14);
    if (arr('res').length < 12) fill('res', 14);
  }

  // ---- reglas de edad ----
  function eligible(cat, p) { return p.edad <= CAT[cat].maxAge; }
  // Quien se pasa de edad sube de categoría (Sub-17 → Sub-20 → Reservas). Idempotente.
  function normalize() {
    if (!active()) return 0;
    st(); let moved = 0;
    const o17 = arr('u17').filter(p => p.edad > 17);
    if (o17.length) { setArr('u17', arr('u17').filter(p => p.edad <= 17)); o17.forEach(p => arr('u20').push(p)); moved += o17.length; }
    const o20 = arr('u20').filter(p => p.edad > 20);
    if (o20.length) { setArr('u20', arr('u20').filter(p => p.edad <= 20)); o20.forEach(p => arr('res').push(p)); moved += o20.length; }
    return moved;
  }

  // ---- movimientos ----
  function ageOk(to, p) { return to === 'pri' || to === 'res' || eligible(to, p); }
  function move(id, to) {
    try {
      if (!active()) return false;
      const f = find(id); if (!f) return false;
      if (f.cat === to) return false;
      const p = f.p;
      if (!ageOk(to, p)) { toast(`${p.nombre} tiene ${p.edad} años: no es elegible para ${CAT[to].n}`); return false; }
      if (to === 'pri' && arr('pri').length >= FIRST_MAX) { toast('Plantel principal lleno (' + FIRST_MAX + '). Libera o vende a alguien.'); return false; }
      if (f.cat === 'pri' && arr('pri').length <= FIRST_MIN) { toast('El primer equipo necesita al menos ' + FIRST_MIN + ' jugadores.'); return false; }
      if (to !== 'pri' && arr(to).length >= CAT[to].cap) { toast(CAT[to].n + ' está lleno (' + CAT[to].cap + ').'); return false; }
      arr(f.cat).splice(f.i, 1);
      if (to === 'pri') {
        p.scouted = true; p.contrato = Math.max(2, p.contrato || 0); p.moral = Math.max(p.moral || 0, 78); p.cantera = true; try { if (window.ACH && ACH.onPromo) ACH.onPromo(p, f.cat); } catch (e) { }
        p.salario = Math.round((p.media * p.media * 0.9 + p.media * 15) / 10) * 10;
        st(); gg().plStats.promos = (gg().plStats.promos || 0) + 1;
      }
      if (f.cat === 'pri') { try { gg().tactics.alineacion = (gg().tactics.alineacion || []).filter(x => x !== id); ensureValidXI(); } catch (e) { } gg().plStats.rel = (gg().plStats.rel || 0) + 1; }
      arr(to).push(p);
      try { pushNews(`${CAT[to].ico} ${p.nombre} (${p.edad}, ${p.posicion}, ${p.media}/${p.potencial}) pasa a ${CAT[to].n}.`, to === 'pri' ? 'bueno' : 'info', 'club'); } catch (e) { }
      try { autoSave(); } catch (e) { }
      render(); try { if (typeof renderTopbar === 'function') renderTopbar(); } catch (e) { }
      return true;
    } catch (e) { console.warn('PL.move', e); return false; }
  }
  function up(id) { const f = find(id); if (!f) return; const to = ORDER[ORDER.indexOf(f.cat) + 1]; if (to) move(id, to); }
  function down(id) {
    const f = find(id); if (!f) return;
    let i = ORDER.indexOf(f.cat) - 1;
    while (i >= 0 && !ageOk(ORDER[i], f.p)) i--;
    if (i < 0) { toast('No hay una categoría inferior elegible para ' + f.p.nombre); return; }
    move(id, ORDER[i]);
  }
  function top(id) { move(id, 'pri'); }
  function release(id) {
    const f = find(id); if (!f || f.cat === 'pri') return;
    if (!confirm('¿Liberar a ' + f.p.nombre + ' (' + f.p.media + '/' + f.p.potencial + ')? No podrás recuperarlo.')) return;
    arr(f.cat).splice(f.i, 1);
    try { pushNews(`${CAT[f.cat].ico} ${f.p.nombre} deja ${CAT[f.cat].n} (liberado).`, 'info', 'club'); autoSave(); } catch (e) { }
    render();
  }

  // ---- liga juvenil ----
  function lvlU() { return divisionLevel(gg().userClubId); }
  function emptyT() { return { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }; }
  function ensureLeague() {
    const g = gg(); st();
    const lvl = lvlU(), key = g.temporada + (g.campania || 'Apertura') + ':' + lvl + ':' + g.userClubId;
    if (g.juv.key === key) return;
    g.juv.key = key; g.juv.temp = g.temporada; g.juv.camp = g.campania || 'Apertura';
    const ids = (g.divisiones[lvl] || []).slice();
    g.juv.tabs = { res: {}, u20: {}, u17: {} }; g.juv.last = {};
    ['res', 'u20', 'u17'].forEach(c => ids.forEach(id => { g.juv.tabs[c][id] = emptyT(); }));
    g.juv.noise = g.juv.noise || {};
    ids.forEach(id => { g.juv.noise[id] = g.juv.noise[id] || {}; ['res', 'u20', 'u17'].forEach(c => { const n = g.juv.noise[id][c]; g.juv.noise[id][c] = clamp(Math.round((n || 0) * 0.6 + rnd(7) - 3), -6, 6); }); });
  }
  function ratingOf(a) {
    const ok = a.filter(p => !p.lesionado && p.energia > 20);
    const xi = (ok.length >= 11 ? bestXI(ok, '4-4-2') : ok.slice().sort((x, y) => y.media - x.media).slice(0, 11));
    if (!xi.length) return 30;
    const avg = xi.reduce((s, p) => s + p.media, 0) / xi.length;
    return avg - Math.max(0, 11 - xi.length) * 4;
  }
  function rivalRating(id, cat) {
    const g = gg(); let r = 55;
    try { r = teamRating(g.clubes[id]); } catch (e) { }
    return r + CAT[cat].off + ((g.juv.noise[id] || {})[cat] || 0);
  }
  function simScore(rh, ra) {
    const base = 1.25, adv = 1.08;
    const lh = clamp(base * Math.exp((rh - ra) / 24) * adv, 0.15, 4.2), la = clamp(base * Math.exp((ra - rh) / 24) / adv, 0.15, 4.2);
    return { gh: poisson(lh), ga: poisson(la) };
  }
  function applyT(t, gf, gc) { t.pj++; t.gf += gf; t.gc += gc; if (gf > gc) { t.pg++; t.pts += 3; } else if (gf === gc) { t.pe++; t.pts += 1; } else t.pp++; }
  function sortedTab(cat) {
    const g = gg(), T = g.juv.tabs[cat] || {};
    return Object.keys(T).map(id => Object.assign({ id }, T[id])).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || (a.id < b.id ? -1 : 1));
  }
  function cname(id) { try { return gg().clubes[id].nombre; } catch (e) { return id; } }

  function playUser(cat, gf, ga) {
    const a = arr(cat);
    a.forEach(p => { if (p.lesionado) { p.lesionJor = (p.lesionJor || 1) - 1; if (p.lesionJor <= 0) { p.lesionado = false; p.lesionJor = 0; } } });
    const ok = a.filter(p => !p.lesionado && p.energia > 20);
    const xi = (ok.length >= 11 ? bestXI(ok, '4-4-2') : ok.slice(0, 11));
    const ids = new Set(xi.map(p => p.id));
    xi.forEach(p => {
      p.stats = p.stats || { goles: 0, asistencias: 0, atajadas: 0, pj: 0 }; p.stats.pj++;
      p.energia = clamp((p.energia || 100) - (8 + rnd(8)), 0, 100);
      if (Math.random() < 0.015) { p.lesionado = true; p.lesionJor = 1 + rnd(3); }
    });
    a.forEach(p => { if (!ids.has(p.id)) p.energia = clamp((p.energia || 100) + 10, 0, 100); });
    const sc = xi.filter(p => p.posicion === 'DEL').concat(xi.filter(p => p.posicion === 'MED'), xi);
    for (let i = 0; i < gf && sc.length; i++) { const s = pick(sc); s.stats.goles = (s.stats.goles || 0) + 1; }
  }

  function afterMatchday(jor, userGF, userGA) {
    try {
      if (!active()) return;
      ensureSquads(); normalize(); ensureLeague();
      const g = gg(), lvl = lvlU(), fx = (g.calendarios[lvl] || [])[jor - 1] || [], U = g.userClubId;
      const line = [];
      ['res', 'u20', 'u17'].forEach(cat => {
        const T = g.juv.tabs[cat];
        const mine = arr(cat);
        fx.forEach(m => {
          if (!T[m.h] || !T[m.a]) return;
          const rh = m.h === U ? ratingOf(mine) : rivalRating(m.h, cat), ra = m.a === U ? ratingOf(mine) : rivalRating(m.a, cat);
          const s = simScore(rh, ra);
          applyT(T[m.h], s.gh, s.ga); applyT(T[m.a], s.ga, s.gh);
          if (m.h === U || m.a === U) {
            const gf = m.h === U ? s.gh : s.ga, gc = m.h === U ? s.ga : s.gh;
            playUser(cat, gf, gc);
            g.juv.last[cat] = { j: jor, gf, ga: gc, opp: cname(m.h === U ? m.a : m.h), home: m.h === U };
            line.push(`${CAT[cat].n} ${gf}-${gc}`);
          }
        });
      });
      // costo fijo y chico por categoría con jugadores (la academia del Presidente ya paga su propio nivel)
      let cost = 0; const base = COST[lvl] || 270;
      ['res', 'u20'].forEach(c => { if (arr(c).length) cost += base; });
      if (!isPres() && arr('u17').length) cost += base;
      if (cost > 0) { g.budget -= cost; fin('Cantera', 'gasto', -cost, 'Planteles juveniles: entrenadores y viajes'); }
      if (line.length) pushNews(`🌱 Juveniles F${jor}: ${line.join(' · ')}.`, 'info', 'club');
    } catch (e) { console.warn('PL.afterMatchday', e); }
  }

  // ---- cierre de campaña ----
  function finalizeLeague() {
    const g = gg(), U = g.userClubId; if (!g.juv || !g.juv.tabs) return;
    const msgs = [];
    ['res', 'u20', 'u17'].forEach(cat => {
      const tab = sortedTab(cat); if (!tab.length || !tab[0].pj) return;
      const pos = tab.findIndex(r => r.id === U) + 1, champ = tab[0];
      g.juv.hist = g.juv.hist || []; g.juv.hist.unshift({ t: g.juv.temp, camp: g.juv.camp, cat, champ: cname(champ.id), pos });
      if (g.juv.hist.length > 30) g.juv.hist.length = 30;
      if (champ.id === U) {
        try { addChampionHistory(CAT[cat].titulo, g.clubes[U], 'Campeón juvenil ' + g.juv.camp); } catch (e) { }
        msgs.push(`🏆 ¡Campeón ${CAT[cat].n}!`);
        try { pushNews(`🏆 ${club().nombre} es campeón del ${CAT[cat].titulo}.`, 'gol', 'club'); } catch (e) { }
      } else if (pos) msgs.push(`${CAT[cat].n} ${pos}°`);
    });
    if (msgs.length) { try { pushNews('🌱 Cierre juvenil: ' + msgs.join(' · ') + '.', 'info', 'club'); } catch (e) { } }
    g.juv.key = '';                   // fuerza nueva tabla en la próxima campaña
  }
  function progress(cat, bonusYoung) {
    arr(cat).forEach(p => {
      if (!p.personalidad) p.personalidad = pick(PERSONALIDADES);
      if (!p.potencial || p.potencial < p.media) p.potencial = calcPotential(p);
      if (p.edad <= 23 && p.media < p.potencial) {
        const played = (p.stats && p.stats.pj) || 0;
        let gain = 1 + rnd(2) + (p.personalidad === 'Promesa' ? 1 : 0) + (played >= 8 ? 1 : 0) + (bonusYoung ? 1 : 0);
        gain = Math.min(gain, Math.max(1, p.potencial - p.media));
        ['ataque', 'defensa', 'fisico', 'porteria'].forEach(k => { p.atributos[k] = clamp(p.atributos[k] + gain, 1, 95); });
      } else if (p.edad >= 31) { const d = 1 + rnd(3); ['ataque', 'defensa', 'fisico', 'porteria'].forEach(k => { p.atributos[k] = clamp(p.atributos[k] - d, 1, 95); }); }
      p.media = calcMedia(p);
      p.valorMercado = Math.round(p.media * p.media * 40 * ageFactor(p.edad));
      p.energia = 100; p.lesionado = false; p.lesionJor = 0; p.stats = { goles: 0, asistencias: 0, atajadas: 0, pj: 0 };
    });
  }
  function dtIntake() {
    const g = gg(), lvl = divisionLevel(g.userClubId);
    const n = (lvl === 1 ? 3 : 2) + (root.EMB ? EMB.canteraBonus() : 0), a = arr('u17'), nuevos = [];
    for (let i = 0; i < n; i++) {
      const pot = clamp(Math.round((lvl === 1 ? 66 : lvl === 2 ? 60 : 56) + rnd(14) + rnd(10) - 4), 45, 86);
      const med0 = clamp(pot - 26 - rnd(12), 24, 50);
      nuevos.push(mk(15 + rnd(3), med0, pot));
    }
    nuevos.forEach(p => a.push(p));
    while (a.length > CAT.u17.cap) { let k = 0; a.forEach((p, i) => { if (p.potencial < a[k].potencial) k = i; }); a.splice(k, 1); }
    if (nuevos.length) { try { pushNews(`🌱 Llegó una camada a la Sub-17: ${nuevos.map(p => `${p.nombre} (${p.posicion}, ${p.media}/${p.potencial})`).join(', ')}.`, 'bueno', 'club'); } catch (e) { } }
  }
  function autoPromoteDT() {
    if (isPres()) return;                               // el Presidente decide a mano
    const U = club(); const xi = bestXI(U.plantilla, '4-4-2');
    const floor = (xi.length ? Math.min.apply(null, xi.map(p => p.media)) : 50) - 2;
    const cand = arr('res').concat(arr('u20')).filter(p => p.edad >= 18 && p.media >= floor).sort((a, b) => b.media - a.media).slice(0, 2);
    cand.forEach(p => { if (arr('pri').length < 26) { const f = find(p.id); if (f) { arr(f.cat).splice(f.i, 1); p.scouted = true; p.contrato = 3; p.moral = 80; p.cantera = true; p.salario = Math.round((p.media * p.media * 0.9 + p.media * 15) / 10) * 10; U.plantilla.push(p); gg().plStats.promos = (gg().plStats.promos || 0) + 1; try { if (window.ACH && ACH.onPromo) ACH.onPromo(p, f.cat); } catch (e) { } try { pushNews(`🌱 ${p.nombre} (${p.edad}, ${p.media}/${p.potencial}) sube solo al primer equipo.`, 'bueno', 'club'); unlockAchievement('cantera_debut', 'De la cantera', 'Subiste un juvenil de la cantera al primer equipo'); } catch (e) { } } } });
  }
  // Si un plantel supera su tope, salen libres los de menor proyección (los más veteranos primero en empate).
  function trim() {
    ['res', 'u20', 'u17'].forEach(cat => {
      const a = arr(cat), out = [];
      while (a.length > CAT[cat].cap) {
        let k = 0; a.forEach((p, i) => { const q = a[k]; if ((p.potencial + p.media) < (q.potencial + q.media) || ((p.potencial + p.media) === (q.potencial + q.media) && p.edad > q.edad)) k = i; });
        out.push(a.splice(k, 1)[0]);
      }
      if (out.length) { try { pushNews(`${CAT[cat].ico} Salen libres de ${CAT[cat].n} por falta de cupo: ${out.slice(0, 4).map(p => p.nombre).join(', ')}${out.length > 4 ? '…' : ''}.`, 'info', 'club'); } catch (e) { } }
    });
  }
  // se llama dentro de endSeason, ANTES de avanzar la campaña
  function onCampaignEnd(yearEnd) {
    try {
      if (!active()) return;
      ensureSquads(); ensureLeague(); finalizeLeague();
      progress('res', false); progress('u20', true);
      if (!isPres()) progress('u17', true);              // en Presidente la academia progresa sola (modo-presidente.js)
      if (yearEnd) {
        arr('res').forEach(p => p.edad++); arr('u20').forEach(p => p.edad++);
        if (!isPres()) arr('u17').forEach(p => p.edad++);
        const viejos = arr('res').filter(p => p.edad >= 27 && p.media < 55);
        if (viejos.length) { setArr('res', arr('res').filter(p => !viejos.includes(p))); try { pushNews(`🛡 Salen libres de Reservas: ${viejos.slice(0, 4).map(p => p.nombre).join(', ')}.`, 'info', 'club'); } catch (e) { } }
        if (!isPres()) dtIntake();
      }
      normalize(); autoPromoteDT(); trim(); ensureSquads();
    } catch (e) { console.warn('PL.onCampaignEnd', e); }
  }
  // cambio de club: el nuevo club empieza con sus propios planteles (los del club anterior se quedan allí)
  function reopen() {
    try {
      if (!active()) return; const g = gg();
      g.planteles = { res: [], u20: [], u17: [] }; g.juv = { key: '', tabs: { res: {}, u20: {}, u17: {} }, last: {}, noise: {}, hist: (g.juv && g.juv.hist) || [] };
      if (g.pres && g.pres.cantera) g.pres.cantera.jugadores = [];
      ensureSquads(); ensureLeague();
    } catch (e) { console.warn('PL.reopen', e); }
  }
  function migrate() { try { if (!gg() || !active()) { if (gg()) st(); return; } ensureSquads(); normalize(); } catch (e) { console.warn('PL.migrate', e); } }

  // ---- interfaz ----
  let TAB = 'u20';
  const tabBtn = (k, n, ico) => `<button class="btn btn-sm ${TAB === k ? 'btn-p' : ''}" onclick="PL.tab('${k}')">${ico} ${n} <small>(${(function () { try { return arr(k).length; } catch (e) { return 0; } })()})</small></button>`;
  function tab(k) { TAB = k; render(); }
  function posOrd(p) { return { POR: 0, DEF: 1, MED: 2, DEL: 3 }[p.posicion] || 9; }
  function playerRow(cat, p) {
    const next = ORDER[ORDER.indexOf(cat) + 1];
    const btn = (lbl, fn, tip, dis) => `<button class="btn btn-sm" ${dis ? 'disabled style="opacity:.4"' : ''} title="${tip}" onclick="PL.${fn}('${p.id}')">${lbl}</button>`;
    const noDown = cat === 'u17';
    return `<tr><td><span class="posb pos-${p.posicion}">${p.posicion}</span></td><td>${esc(p.nombre)}${p.lesionado ? ' <span class="red" title="Lesionado">🩹</span>' : ''}${p.potencial >= 80 ? ' <span class="gold" title="Gran potencial">★</span>' : ''}</td>
      <td class="center">${p.edad}</td><td class="center"><b>${p.media}</b><small class="muted">/${p.potencial}</small></td><td class="center">${Math.round(p.energia == null ? 100 : p.energia)}</td><td class="center">${(p.stats && p.stats.pj) || 0}</td><td class="center">${(p.stats && p.stats.goles) || 0}</td>
      <td class="right" style="white-space:nowrap">${next ? btn('⬆', 'up', 'Subir a ' + CAT[next].n) : ''}${cat !== 'pri' && next !== 'pri' ? btn('⭐', 'top', 'Subir directo al primer equipo') : ''}${!noDown ? btn('⬇', 'down', 'Bajar de categoría') : ''}${cat !== 'pri' ? btn('✖', 'release', 'Liberar') : ''}</td></tr>`;
  }
  function leagueCard(cat) {
    const g = gg(); ensureLeague();
    const tab = sortedTab(cat), me = tab.findIndex(r => r.id === g.userClubId), r = tab[me] || emptyT(), last = (g.juv.last || {})[cat];
    const top5 = tab.slice(0, 5).map((t, i) => `<tr class="${t.id === g.userClubId ? 'me' : ''}"><td class="center">${i + 1}</td><td>${esc(cname(t.id))}</td><td class="center">${t.pj}</td><td class="center"><b>${t.pts}</b></td><td class="center">${t.gf - t.gc >= 0 ? '+' : ''}${t.gf - t.gc}</td></tr>`).join('');
    return `<div class="offer"><b class="gold">${CAT[cat].ico} Campeonato ${CAT[cat].n}</b> · ${me >= 0 ? `<b>${me + 1}°</b> con ${r.pts} pts (${r.pg}G ${r.pe}E ${r.pp}P)` : 'sin tabla'}${last ? `<br><small class="muted">Último: ${last.home ? 'vs' : '@'} ${esc(last.opp)} · <b class="${last.gf > last.ga ? 'green' : last.gf < last.ga ? 'red' : 'amber'}">${last.gf}-${last.ga}</b> (F${last.j})</small>` : '<br><small class="muted">Aún no se juega.</small>'}
      <div class="scroll" style="max-height:170px;margin-top:6px"><table class="tbl" style="width:100%"><thead><tr><th>#</th><th>Club</th><th>PJ</th><th>Pts</th><th>DG</th></tr></thead><tbody>${top5}</tbody></table></div>
      <div class="center" style="margin-top:6px"><button class="btn btn-sm" onclick="PL.fullTable('${cat}')">📋 Tabla completa</button></div></div>`;
  }
  function fullTable(cat) {
    ensureLeague();
    const rows = sortedTab(cat).map((t, i) => `<tr class="${t.id === gg().userClubId ? 'me' : ''}"><td class="center">${i + 1}</td><td>${esc(cname(t.id))}</td><td class="center">${t.pj}</td><td class="center">${t.pg}</td><td class="center">${t.pe}</td><td class="center">${t.pp}</td><td class="center">${t.gf}:${t.gc}</td><td class="center"><b>${t.pts}</b></td></tr>`).join('');
    openModal(`<div class="modal-title">${CAT[cat].ico} Campeonato ${CAT[cat].n}</div><div class="scroll" style="max-height:60vh"><table class="tbl" style="width:100%"><thead><tr><th>#</th><th>Club</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF:GC</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div><div class="center" style="margin-top:8px"><button class="btn btn-p" onclick="closeModal()">Cerrar</button></div>`);
  }
  function render() {
    const el = $('planteles-panel'); if (!el) return;
    const g = gg();
    if (!g || !g.clubes) { el.innerHTML = ''; return; }
    if (!active()) { el.innerHTML = `<div class="panel-title">🧒 Planteles</div><p class="muted">Los planteles juveniles no están disponibles en este modo (${g.reto ? 'retos cortos' : 'fase amateur'}).</p>`; return; }
    ensureSquads(); normalize(); ensureLeague();
    const a = arr(TAB).slice().sort((x, y) => posOrd(x) - posOrd(y) || y.media - x.media);
    const c = CAT[TAB];
    const info = TAB === 'pri' ? `Tu primer equipo (${a.length}/${FIRST_MAX}). Podés bajar jugadores a Reservas o juveniles. Se gestiona completo en 👥 Plantilla.` :
      `${c.n}: ${a.length}/${c.cap} jugadores · ${TAB === 'u17' ? 'hasta 17 años' : TAB === 'u20' ? 'hasta 20 años' : 'sin límite de edad'}. Se juega y simula solo, en el mismo calendario que tu primer equipo.`;
    el.innerHTML = `<div class="panel-title">🧒 Planteles de ${esc(club().nombre)}</div>
      <p class="muted" style="font-size:15px">Un solo jugador, un solo plantel. La edad sube una vez al año (al cerrar el Clausura): quien se pasa de edad sube de categoría solo. ${isPres() ? 'Como Presidente decides tú quién sube al primer equipo.' : 'Como DT, los mejores de Reservas y Sub-20 pueden subir solos al cierre del año.'}</p>
      <div class="center" style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap;justify-content:center">${tabBtn('pri', 'Primer Equipo', '⭐')}${tabBtn('res', 'Reservas', '🛡')}${tabBtn('u20', 'Sub-20', '🎓')}${tabBtn('u17', 'Sub-17', '🌱')}</div>
      ${TAB !== 'pri' ? leagueCard(TAB) : ''}
      <div class="muted" style="font-size:14px;margin:8px 0">${info}</div>
      <div class="scroll" style="max-height:55vh"><table class="tbl" style="width:100%"><thead><tr><th>Pos</th><th>Jugador</th><th>Edad</th><th>Med/Pot</th><th>Ener</th><th>PJ</th><th>G</th><th></th></tr></thead><tbody>${a.map(p => playerRow(TAB, p)).join('') || '<tr><td colspan="8" class="muted">Sin jugadores.</td></tr>'}</tbody></table></div>
      <p class="muted" style="font-size:13px;margin-top:8px">Costo juvenil: ${money(COST[lvlU()] || 270)} por categoría y fecha (entrenadores y viajes), visible en el libro mayor como "Cantera".</p>`;
  }

  root.PL = { active, normalize, move, up, down, top, release, afterMatchday, onCampaignEnd, dtIntake, reopen, migrate, render, tab, fullTable, arr, find, fill, ensureSquads, ensureLeague, sortedTab, CAT, ORDER };
})(typeof window !== 'undefined' ? window : globalThis);
