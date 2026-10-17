/* ============================================================================
 * logros80.js — v2.5 · Catálogo ampliado de 80 logros + ceremonia
 *                "Campeón de Campeones · Mejor equipo del continente"
 * ----------------------------------------------------------------------------
 * - Los logros se desbloquean con EVENTOS REALES de la carrera, una sola vez
 *   (id estable 'a80_N'; unlockAchievement ya es idempotente).
 * - Premios: títulos, insignias y vitrina. Nunca dinero.
 * - Los que dependen de modos futuros (Regional, cuatro planteles, saga) se ven
 *   en el catálogo como 🔒 "Próximamente" y se activan cuando exista el modo.
 * - Los que ya existían (p. ej. Copa Presidente) se enlazan al logro original
 *   para no duplicarlos.
 * ========================================================================== */
(function (root) {
  'use strict';
  const gg = () => (typeof G !== 'undefined' ? G : null);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MEDIA = '/Retro-Football-Manager-SV/media-campeon-de-campeones.mp4';
  const BIG = ['ALI', 'FAS', 'AGU', 'FIR', 'INT']; // clásicos entre grandes (El Salvador; otros países: liga-xx.js → big)
  const bigIds = () => { try { return (typeof LG === 'function' && LG().big) || BIG; } catch (e) { return BIG; } };

  // st: 'i' implementado · 'd:<id>' enlazado a logro existente · 'v26' Modo Regional · 'v27' cuatro planteles · 'saga' Legado Cuscatleco
  const CAT = [
    ['Primeros pasos y cancha', [
      [1, 'Primer silbatazo', 'Completar el primer partido oficial.', 'i'],
      [2, 'La casa pesa', 'Ganar el primer partido oficial como local.', 'i'],
      [3, 'Cerrojo', 'Terminar un partido oficial con portería a cero.', 'i'],
      [4, 'Hat-trick', 'Un jugador del club marca tres goles en un partido oficial.', 'i'],
      [5, 'Nunca rendirse', 'Ganar un partido tras ir perdiendo por dos goles.', 'i'],
      [6, 'Revulsivo', 'Ganar un partido oficial habiendo usado 3 o más cambios.', 'i'],
      [7, 'Racha de acero', 'Completar cinco partidos oficiales consecutivos sin perder.', 'i'],
      [8, 'El muro', 'Mantener la portería a cero en cinco partidos oficiales seguidos.', 'i'],
      [9, 'Victoria imposible', 'Ganar a un rival con al menos 15 puntos más de media de equipo.', 'i'],
      [10, 'El derbi es nuestro', 'Ganar un clásico entre grandes (Alianza, FAS, Águila, Firpo, Isidro Metapán).', 'i']]],
    ['Liga nacional y Copa Presidente', [
      [11, 'Primer campeón', 'Ganar por primera vez una liga nacional.', 'd:champ_1_'],
      [12, 'Dueño del Apertura', 'Ganar el campeonato Apertura.', 'i'],
      [13, 'Dueño del Clausura', 'Ganar el campeonato Clausura.', 'i'],
      [14, 'Doblete nacional', 'Ganar Apertura y Clausura del mismo año futbolístico.', 'd:campeon_campeones'],
      [15, 'Copa en alto', 'Ganar por primera vez la Copa Presidente.', 'd:copa_presidente'],
      [16, 'Campeón invicto', 'Ganar la liga sin derrotas en la campaña.', 'i'],
      [17, 'La final es nuestra', 'Ganar una final de copa en tanda de penales.', 'i'],
      [18, 'Remontada histórica', 'Ser campeón después de quedar fuera de los primeros cuatro puestos a mitad de campaña.', 'i'],
      [19, 'El título se defiende', 'Revalidar una liga nacional en el siguiente año.', 'i'],
      [20, 'Palmarés creciente', 'Llegar a cinco títulos oficiales.', 'i']]],
    ['Centroamérica y CONCACAF', [
      [21, 'Pasaporte regional', 'Clasificar por primera vez a la Copa Centroamericana.', 'i'],
      [22, 'Primer triunfo regional', 'Ganar un partido de Copa Centroamericana.', 'i'],
      [23, 'Entre los ocho', 'Llegar a cuartos de final de la Copa Centroamericana.', 'i'],
      [24, 'Entre los cuatro', 'Llegar a semifinales de la Copa Centroamericana.', 'i'],
      [25, 'Noche de final', 'Clasificar a la final de la Copa Centroamericana.', 'i'],
      [26, 'Dueños de Centroamérica', 'Ganar la Copa Centroamericana.', 'd:copa_centroamericana'],
      [27, 'El escenario mayor', 'Clasificar por primera vez a la CONCACAF Champions Cup.', 'i'],
      [28, 'Gigante derribado', 'Eliminar en CONCACAF a un equipo con al menos 20 puntos más de media.', 'i'],
      [29, 'Final continental', 'Llegar a la final de la CONCACAF Champions Cup.', 'i'],
      [30, 'Campeones de CONCACAF', 'Ganar la CONCACAF Champions Cup.', 'd:concacaf_champions']]],
    ['Sub-17, Sub-20 y Reservas', [
      [31, 'Cantera al campo', 'Debutar un jugador Sub-17 en el Primer Equipo.', 'i'],
      [32, 'Generación U20', 'Debutar un jugador Sub-20 en el Primer Equipo.', 'i'],
      [33, 'Paso de Reserva', 'Promover un jugador de Reservas y darle minutos oficiales al Primer Equipo.', 'i'],
      [34, 'Cinco de la casa', 'Dar debut a cinco jugadores formados en el club en un año.', 'i'],
      [35, 'Campeones Sub-17', 'Ganar la liga Sub-17 del país.', 'i'],
      [36, 'Campeones Sub-20', 'Ganar la liga Sub-20 del país.', 'i'],
      [37, 'La Reserva manda', 'Ganar la liga de Reservas.', 'i'],
      [38, 'Once de casa', 'Alinear once jugadores formados en el club en un partido oficial.', 'i'],
      [39, 'La promesa se consolida', 'Un jugador promovido desde cantera alcanza 50 apariciones oficiales.', 'i'],
      [40, 'Venta de academia', 'Vender al extranjero un canterano con al menos 25 apariciones en el Primer Equipo.', 'i']]],
    ['Finanzas, estadio y gestión', [
      [41, 'Cuentas claras', 'Cerrar un año futbolístico con el informe económico completamente reconciliado.', 'i'],
      [42, 'En números verdes', 'Terminar el año con variación neta de caja positiva.', 'i'],
      [43, 'Nómina sostenible', 'Mantener la nómina bajo 65% del ingreso recurrente durante una temporada completa.', 'i'],
      [44, 'Mercado inteligente', 'Terminar un año con saldo neto de traspasos positivo y en la mitad alta de la tabla.', 'i'],
      [45, 'Casa propia', 'Adquirir un estadio propio para el club.', 'i'],
      [46, 'El estadio vive', 'Alcanzar 90% de ocupación media en cinco partidos de local.', 'i'],
      [47, 'Academia financiada', 'Invertir en instalaciones y cerrar el año sin déficit operativo.', 'i'],
      [48, 'Socio fiel', 'Mantener el mismo patrocinador principal durante dos temporadas completas.', 'i'],
      [49, 'Caja de seguridad', 'Mantener tres jornadas de costes inevitables cubiertas por caja libre.', 'i'],
      [50, 'De rojo a verde', 'Pasar de estado financiero "riesgo" a "estable" en un año futbolístico.', 'i']]],
    ['Carrera regional y cambios de club', [
      [51, 'Nuevo país, nuevo reto', 'Aceptar la primera oferta laboral fuera del país inicial.', 'i'],
      [52, 'DT trotamundos', 'Dirigir clubes de tres países centroamericanos distintos.', 'i'],
      [53, 'Mapa completo', 'Dirigir clubes en los cinco países regionales.', 'i'],
      [54, 'Éxito exportable', 'Ganar una liga nacional en dos países distintos.', 'i'],
      [55, 'Embajador regional', 'Ganar un título oficial en tres países distintos.', 'i'],
      [56, 'Ascenso soñado', 'Ascender un club salvadoreño desde Segunda División.', 'i'],
      [57, 'Misión rescate', 'Evitar el descenso de un club que estaba en zona roja a mitad de campaña.', 'i'],
      [58, 'Constructor de dinastías', 'Permanecer cinco años futbolísticos en el mismo club y ganar tres títulos.', 'i'],
      [59, 'Mercado sin fronteras', 'Comprar y vender jugadores con tres países distintos en una temporada.', 'i'],
      [60, 'Cien en el banquillo', 'Completar 100 partidos oficiales como DT.', 'i']]],
    ['Legado Cuscatleco: La ruta al Mundial', [
      [61, 'Las raíces', 'Completar el capítulo inicial de la saga.', 'saga'],
      [62, 'Primer heredero', 'Promover a Primer Equipo a uno de los jugadores protagonistas de la historia.', 'saga'],
      [63, 'Debutar una generación', 'Completar el capítulo de 2027.', 'saga'],
      [64, 'Centroamérica nos mira', 'Completar el capítulo regional de 2028.', 'saga'],
      [65, 'La Selecta llama', 'Recibir y aceptar la dirección de la Selección de El Salvador.', 'd:sel_on'],
      [66, 'Ruta mundialista', 'Clasificar a El Salvador a la Copa Mundial.', 'd:sel_mundial'],
      [67, 'Una victoria para el país', 'Ganar el primer partido mundialista de El Salvador en esa carrera.', 'saga'],
      [68, 'Generación Mundialista', 'Terminar la saga con clasificación y protagonistas del club convocados.', 'saga'],
      [69, 'Fábrica Cuscatleca', 'Desbloquear el final de más debuts y exportaciones de cantera.', 'saga'],
      [70, 'Milagro del Barrio', 'Desbloquear el final de ascenso/rescate financiero con una generación propia.', 'saga']]],
    ['Récords, dominio y secretos', [
      [71, 'Centenario de victorias', 'Alcanzar 100 victorias oficiales como DT.', 'i'],
      [72, 'Cien goles del club', 'El club llega a 100 goles oficiales bajo este DT.', 'i'],
      [73, 'Muralla centenaria', 'Alcanzar 100 porterías a cero en la carrera.', 'i'],
      [74, 'Coleccionista de copas', 'Ganar diez torneos oficiales a lo largo de la carrera.', 'i'],
      [75, 'Sin miedo al cambio', 'Ganar un partido oficial después de cambiar de formación durante el descanso.', 'i'],
      [76, 'Nueve de nueve', 'Ganar tres finales de copa consecutivas.', 'i'],
      [77, 'Temporada perfecta', 'Ganar todas las competiciones en que el club participó ese año (Apertura, Clausura, Copa y torneos internacionales jugados).', 'i'],
      [78, 'Campeón de Campeones', 'Ganar en un mismo año futbolístico la Copa Presidente, una liga nacional, la Copa Centroamericana y la CONCACAF Champions Cup. Desbloquea la ceremonia.', 'i'],
      [79, 'El continente a tus pies', 'Recibir el reconocimiento de "Mejor equipo del continente" en la pestaña de títulos.', 'i'],
      [80, 'Leyenda viva', 'Completar todos los capítulos principales de la saga y llegar a 20 títulos en la carrera.', 'saga']]]
  ];
  const ALL = []; CAT.forEach((c, gi) => c[1].forEach(x => ALL.push({ n: x[0], name: x[1], d: x[2], st: x[3], g: gi })));
  const byN = n => ALL.find(x => x.n === n);

  // ---- estado ----
  function active() { const g = gg(); return !!(g && g.clubes && g.userClubId && !g.reto); }
  function S() {
    const g = gg(); if (!g.ach80) g.ach80 = {};
    const a = g.ach80; a.u = a.u || {}; a.cer = a.cer || []; a.pend = a.pend || [];
    a.c = a.c || { pj: 0, w: 0, d: 0, l: 0, gf: 0, cs: 0, csStr: 0, unb: 0, fHome: 0, finals: [], occ: [], campLoss: {}, campPj: {}, posMid: {}, tk: {}, clubYears: {}, spon: [], centroSeen: 0, conSeen: 0 };
    return a;
  }
  function unlock(n, proof) {
    try {
      const it = byN(n); if (!it || !active()) return false;
      const a = S(), g = gg(), id = 'a80_' + n;
      if ((g.achievements || []).some(x => x.id === id)) return false;
      a.u[n] = { temp: g.temporada, camp: g.campania, club: g.userClubId, proof: proof || '' };
      unlockAchievement(id, it.name, it.d);
      return true;
    } catch (e) { console.warn('ach unlock', e); return false; }
  }
  const has = n => { const g = gg(); return !!(g && (g.achievements || []).some(x => x.id === 'a80_' + n)); };
  function doneLinked(alias) {
    try {
      const l = LOGROS.flatMap(c => c[1]).find(x => x[0] === alias);
      return l ? !!logroHecho(l) : (gg().achievements || []).some(a => a.id === alias || a.id.indexOf(alias) === 0);
    } catch (e) { return false; }
  }
  function done(it) { if (it.st.indexOf('d:') === 0) return doneLinked(it.st.slice(2)); return has(it.n); }

  // ---- eventos ----
  function myRating() { try { return teamRating(userClub()); } catch (e) { return 0; } }
  function onMatch(m) {
    try {
      if (!active() || !m) return;
      const a = S(), c = a.c, g = gg();
      const gf = m.gf | 0, ga = m.ga | 0, win = m.win != null ? !!m.win : gf > ga;
      const draw = !win && gf === ga && m.comp === 'Liga', loss = !win && !draw;
      const camp = g.temporada + (g.campania || 'Apertura');
      c.pj++; c.gf += gf;
      if (win) c.w++; else if (draw) c.d++; else c.l++;
      if (ga === 0) { c.cs++; c.csStr++; } else c.csStr = 0;
      if (!loss) c.unb++; else c.unb = 0;
      if (m.comp === 'Liga') { c.campPj[camp] = (c.campPj[camp] || 0) + 1; if (loss) c.campLoss[camp] = (c.campLoss[camp] || 0) + 1; }
      if (m.home === true && m.occ != null) { c.occ.push(+m.occ.toFixed(3)); if (c.occ.length > 5) c.occ.shift(); }
      unlock(1);
      if (m.home === true && !c.fHome) { c.fHome = 1; if (win) unlock(2); }
      if (ga === 0) unlock(3);
      if ((m.maxGoals | 0) >= 3) unlock(4);
      const live = m.live || {};
      if (win && (live.maxDef | 0) >= 2) unlock(5);
      if (win && (live.subs | 0) >= 3) unlock(6);
      if (c.unb >= 5) unlock(7);
      if (c.csStr >= 5) unlock(8);
      if (win && (m.ratingDiff | 0) >= 15) unlock(9);
      if (win && m.oppId && bigIds().indexOf(g.userClubId) >= 0 && bigIds().indexOf(m.oppId) >= 0) unlock(10);
      if (win && live.formChanged) unlock(75);
      if (c.w >= 100) unlock(71);
      if (c.gf >= 100) unlock(72);
      if (c.cs >= 100) unlock(73);
      if (c.pj >= 100) unlock(60);
      // torneos
      const st = String(m.stage || ''), ko = /Cuartos|Semifinal|Final/.test(st);
      if (m.comp === 'Centro') {
        if (win) unlock(22);
        if (/Cuartos/.test(st)) unlock(23); if (/Semifinal/.test(st)) { unlock(23); unlock(24); } if (/^Final/.test(st)) { unlock(23); unlock(24); unlock(25); }
      }
      if (m.comp === 'CONCACAF') {
        if (win && ko && (m.ratingDiff | 0) >= 20) unlock(28);
        if (/^Final/.test(st)) unlock(29);
      }
      if (/^Final/.test(st) && (m.comp === 'Copa' || m.comp === 'Centro' || m.comp === 'CONCACAF')) {
        c.finals.push(!!win); if (c.finals.length > 6) c.finals.shift();
        if (win && m.penWin) unlock(17);
        const l3 = c.finals.slice(-3); if (l3.length === 3 && l3.every(Boolean)) unlock(76);
      }
      lineup();
      try { if (root.LEG) LEG.onMatch(m); } catch (e) { }
      check();
    } catch (e) { console.warn('ACH.onMatch', e); }
  }
  // v2.9: canteranos en el once, promociones, comercio regional
  function lineup() {
    try {
      const g = gg(), u = userClub(), ids = (g.tactics && g.tactics.alineacion) || [];
      const xi = ids.map(id => u.plantilla.find(p => p.id === id)).filter(Boolean);
      const home = xi.filter(p => p.promo && p.promo.club === g.userClubId);
      home.forEach(p => { if (p.promo.from === 'u17') unlock(31); else if (p.promo.from === 'u20') unlock(32); else if (p.promo.from === 'res') unlock(33); });
      if (home.length >= 11) unlock(38);
    } catch (e) { }
  }
  function onPromo(p, from) {
    try {
      if (!active() || !p) return; const g = gg(), c = S().c;
      p.promo = { t: g.temporada, from: from || 'u17', club: g.userClubId };
      c.pr = c.pr || {}; c.pr[g.temporada] = (c.pr[g.temporada] || 0) + 1;
      if (c.pr[g.temporada] >= 5) unlock(34);
      if (root.LEG) LEG.onPromo(p, from);
    } catch (e) { console.warn('ACH.onPromo', e); }
  }
  function onTrade(country, kind) {
    try {
      if (!active()) return; const g = gg(), c = S().c; c.trade = c.trade || {};
      const t = c.trade[g.temporada] = c.trade[g.temporada] || { b: {}, s: {} };
      t[kind === 'buy' ? 'b' : 's'][country] = 1;
      const all = new Set(Object.keys(t.b).concat(Object.keys(t.s)));
      if (Object.keys(t.b).length && Object.keys(t.s).length && all.size >= 3) unlock(59);
    } catch (e) { }
  }
  function onSale(p, country) {
    try {
      if (!active()) return; const g = gg(); onTrade(country, 'sell');
      let home = 'El Salvador'; try { home = HOME(); } catch (e) { }
      if (p && p.promo && p.promo.club === g.userClubId && country !== home && ((p.stats && p.stats.pj) || 0) >= 25) unlock(40);
      if (root.LEG) LEG.onSale(p, country);
    } catch (e) { }
  }
  function onMid(pos, n) { try { if (!active()) return; const g = gg(), c = S().c; c.posMid[g.temporada + (g.campania || 'Apertura')] = { pos, n: n || 0 }; } catch (e) { } }

  // Revisión general (barata): títulos, clasificaciones, estadio.
  function check() {
    try {
      if (!active()) return;
      const g = gg(), a = S(), c = a.c, U = g.userClubId;
      const mine = (g.championHistory || []).filter(h => h.id === U && !/Sub-\d|Reservas/.test(h.comp || ''));
      mine.forEach(h => { const k = h.temp + '|' + (h.campania || '') + '|' + h.comp; if (!c.tk[k]) c.tk[k] = U; });
      const tkN = Object.keys(c.tk).length;
      if (tkN >= 5) unlock(20); if (tkN >= 10) unlock(74);
      const isLeague = h => /Primera|Segunda|Tercera|Liguilla/i.test(h.comp || '') && !/Copa|Supercopa|Campeón de Campeones/i.test(h.comp || '');
      const lg = mine.filter(isLeague);
      lg.forEach(h => {
        const camp = h.temp + (h.campania || 'Apertura');
        if (h.campania === 'Apertura') unlock(12); if (h.campania === 'Clausura') unlock(13);
        if ((c.campPj[camp] || 0) >= 10 && !(c.campLoss[camp] > 0)) unlock(16, camp);
        const pm = c.posMid[camp]; if (pm && pm.pos > 4) unlock(18, camp);
      });
      const temps = {}; lg.forEach(h => { temps[h.temp] = 1; });
      Object.keys(temps).forEach(t => { if (temps[+t + 1]) unlock(19); });
      // clasificaciones
      if (g.centroCup && (g.centroCup.teams || []).some(t => t && t.id === U)) unlock(21);
      if (g.concacafCup && (g.concacafCup.teams || []).some(t => t && t.id === U)) unlock(27);
      // estadio
      try { if (userClub().estadio && userClub().estadio.propio) unlock(45); } catch (e) { }
      if (c.occ.length >= 5 && c.occ.reduce((s, x) => s + x, 0) / c.occ.length >= 0.9) unlock(46);
      // v2.9: Regional (51-55) y planteles (35-37, 39)
      const R = g.reg, pal = g.palmares || [];
      if (R) { if ((R.moves || 0) >= 1) unlock(51); const cs = new Set((R.tray || []).map(e => e.pais)); if (cs.size >= 3) unlock(52); if (cs.size >= 5) unlock(53); }
      const h0 = (R && R.tray && R.tray[0] && R.tray[0].pais) || 'SV';
      const off = pal.filter(x => !/Sub-\d|Reservas|Supercopa/.test(x.comp || ''));
      if (new Set(off.filter(x => /^Primera|Liguilla/i.test(x.comp || '')).map(x => x.pais || h0)).size >= 2) unlock(54);
      if (new Set(off.map(x => x.pais || h0)).size >= 3) unlock(55);
      if (pal.some(x => x.comp === 'Campeonato Sub-17')) unlock(35);
      if (pal.some(x => x.comp === 'Campeonato Sub-20')) unlock(36);
      if (pal.some(x => x.comp === 'Campeonato Reservas')) unlock(37);
      try { if (userClub().plantilla.some(p => p.promo && p.promo.club === U && p.stats && p.stats.pj >= 50)) unlock(39); } catch (e) { }
      // dinastía: 5 años en el club y 3 títulos con él
      const yrs = c.clubYears[U] || 0, tkClub = Object.keys(c.tk).filter(k => c.tk[k] === U).length;
      if (yrs >= 5 && tkClub >= 3) unlock(58);
    } catch (e) { console.warn('ACH.check', e); }
  }

  function onCampaignEnd(info) {
    try {
      if (!active()) return;
      const g = gg(), c = S().c; info = info || {};
      // patrocinador principal de esta campaña (para "Socio fiel")
      c.spon.push(g.sponsor ? g.sponsor.nombre : null); if (c.spon.length > 6) c.spon.shift();
      const l4 = c.spon.slice(-4); if (l4.length === 4 && l4[0] && l4.every(x => x === l4[0])) unlock(48);
      if (info.promoted && info.lvl === 2) unlock(56);
      const pm = c.posMid[g.temporada + (g.campania || 'Apertura')];
      if (pm && pm.n && pm.pos >= pm.n - 1 && !info.relegated) unlock(57);
      check();
    } catch (e) { console.warn('ACH.onCampaignEnd', e); }
  }

  // Cierre del año futbolístico (lo llama FIN.closeCampaign('Clausura')).
  function onYearClose(y) {
    try {
      if (!active()) return;
      const g = gg(), a = S(), c = a.c, U = g.userClubId, r = y.rep || {};
      c.clubYears[U] = (c.clubYears[U] || 0) + 1;
      if (y.n > 0 && Math.abs(r.residual || 0) === 0) unlock(41);
      if ((r.net || 0) > 0) unlock(42);
      if ((r.carga || 9) < 0.65 && r.inc > 0) unlock(43);
      let pos = 99, n = 0; try { const lv = userClub().nivel, s = sortedDivision(lv); n = s.length; pos = s.findIndex(x => x.id === U) + 1; } catch (e) { }
      if ((r.traspasos || 0) > 0 && pos > 0 && pos <= Math.ceil(n / 2)) unlock(44);
      if ((r.operativo || 0) >= 0 && (r.inversion || 0) < 0) unlock(47);
      if ((r.aut || 0) >= 3) unlock(49);
      try { const L = g.ledger, i = L.order.indexOf(y.k); for (let j = i - 1; j >= 0; j--) { const p = L.years[L.order[j]]; if (p && p.rep) { if (p.rep.est === 'riesgo' && r.est === 'estable') unlock(50); break; } } } catch (e) { }
      check();
      // --- Campeón de Campeones: 4 títulos, mismo club, mismo año futbolístico ---
      const T = g.temporada, H = (g.championHistory || []).filter(h => h.id === U && h.temp === T);
      const copa = H.some(h => h.comp === 'Copa Presidente');
      const liga = (g.champions && (g.champions.apertura === U || g.champions.clausura === U)) || H.some(h => /Primera|Liguilla/i.test(h.comp || '') && !/Copa|Supercopa|Campeón de Campeones/i.test(h.comp || ''));
      const centro = H.some(h => h.comp === 'Copa Centroamericana');
      const conc = H.some(h => h.comp === 'CONCACAF Champions Cup');
      if (copa && liga && centro && conc) awardCeremony(T);
      // --- Temporada perfecta: ambos torneos de liga + Copa Presidente, sin perder ninguna final/eliminatoria jugada ---
      try {
        const aper = g.champions && g.champions.apertura === U, clau = g.champions && g.champions.clausura === U;
        const lost = ch => ch && ch.champion && ch.champion !== U && (ch.teams || []).some(t => t && t.id === U);
        if (aper && clau && copa && !lost(g.centroCup) && !lost(g.concacafCup)) unlock(77);
      } catch (e) { }
    } catch (e) { console.warn('ACH.onYearClose', e); }
  }

  // ---- ceremonia ----
  function awardCeremony(T) {
    const g = gg(), a = S();
    if (a.cer.some(x => x.temp === T && x.clubId === g.userClubId)) return; // idempotente: no se repite al recargar
    const e = { temp: T, clubId: g.userClubId, club: (function () { try { return userClub().nombre; } catch (x) { return g.userClubId; } })(), color: (function () { try { return userClub().color; } catch (x) { return '#f5c542'; } })(), at: Date.now() };
    a.cer.push(e); a.pend.push(a.cer.length - 1);
    unlock(78, 'año ' + T); unlock(79, 'año ' + T);
    try { pushNews('👑 ¡CAMPEÓN DE CAMPEONES! ' + e.club + ' es el mejor equipo del continente ' + T + '.', 'gol', 'club'); } catch (x) { }
  }
  function showPendingCeremony(next) {
    try {
      if (!active()) { if (typeof next === 'function') next(); return false; }
      const a = S(); if (!a.pend.length) { if (typeof next === 'function') next(); return false; }
      const i = a.pend.shift(); play(i, next); return true;
    } catch (e) { if (typeof next === 'function') next(); return false; }
  }
  const CSS = `#ach-cer{position:fixed;inset:0;z-index:3000;background:radial-gradient(ellipse at 50% 30%,#2a1a00 0%,#0a0600 70%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center;overflow:auto;font-family:inherit}
#ach-cer h1{font-family:'Press Start 2P',monospace;font-size:clamp(14px,3.6vw,28px);color:#ffd447;text-shadow:0 0 18px #ffb300,0 3px 0 #7a4b00;margin:8px 0;line-height:1.5;animation:cerPop .8s cubic-bezier(.2,1.6,.4,1) both}
#ach-cer h2{font-family:'Press Start 2P',monospace;font-size:clamp(9px,2.2vw,15px);color:#7ef2c8;margin:4px 0 12px;animation:cerPop 1s .25s both}
#ach-cer .cer-club{font-size:clamp(18px,4.5vw,34px);font-weight:800;margin:6px 0 14px;animation:cerPop 1s .5s both}
#ach-cer .cer-tr{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:6px 0 14px}
#ach-cer .cer-tr div{background:rgba(255,212,71,.1);border:2px solid #ffd447;border-radius:12px;padding:10px 12px;min-width:112px;font-size:13px;animation:cerDrop .7s both}
#ach-cer .cer-tr div b{display:block;font-size:30px}
#ach-cer video{max-width:min(92vw,640px);max-height:34vh;border:3px solid #ffd447;border-radius:10px;background:#000;margin:6px 0}
#ach-cer .cer-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}
#ach-cer canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
@keyframes cerPop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes cerDrop{0%{transform:translateY(-60px) rotate(-8deg);opacity:0}100%{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){#ach-cer *{animation:none!important}}`;
  function ensureCss() { if (document.getElementById('ach-cer-css')) return; const s = document.createElement('style'); s.id = 'ach-cer-css'; s.textContent = CSS; document.head.appendChild(s); }
  let RAF = null;
  function confetti(cv) {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const ctx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
      const cols = ['#ffd447', '#7ef2c8', '#ff6b6b', '#5ec8ff', '#fff'], P = [];
      for (let i = 0; i < 90; i++) P.push({ x: Math.random() * cv.width, y: -Math.random() * cv.height, v: 2 + Math.random() * 4, s: 4 + Math.random() * 6, c: cols[i % cols.length], r: Math.random() * 6.28, w: (Math.random() - .5) * 2 });
      const t0 = performance.now();
      (function f(t) { ctx.clearRect(0, 0, cv.width, cv.height); P.forEach(p => { p.y += p.v; p.x += p.w; p.r += .1; if (p.y > cv.height) { p.y = -10; } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }); if (t - t0 < 6500) RAF = requestAnimationFrame(f); else ctx.clearRect(0, 0, cv.width, cv.height); })(t0);
    } catch (e) { }
  }
  function close(next) {
    try { if (RAF) cancelAnimationFrame(RAF); const o = document.getElementById('ach-cer'); if (o) { const v = o.querySelector('video'); if (v) { try { v.pause(); } catch (e) { } } o.remove(); } } catch (e) { }
    if (typeof next === 'function') setTimeout(next, 80);
  }
  function play(i, next) {
    const a = S(), e = a.cer[i]; if (!e) { if (typeof next === 'function') next(); return; }
    ensureCss(); const old = document.getElementById('ach-cer'); if (old) old.remove();
    const o = document.createElement('div'); o.id = 'ach-cer';
    const trophies = [['🏆', 'Copa Presidente'], ['🇸🇻', 'Liga nacional'], ['🌎', 'Copa Centroamericana'], ['🌐', 'CONCACAF Champions Cup']];
    o.innerHTML = `<canvas></canvas>
      <h1>CAMPEÓN DE CAMPEONES<br>MEJOR EQUIPO DEL CONTINENTE</h1>
      <h2>Año futbolístico ${esc(e.temp)}</h2>
      <div class="cer-club" style="color:${esc(e.color || '#ffd447')}">${esc(e.club)}</div>
      <div class="cer-tr">${trophies.map((t, k) => `<div style="animation-delay:${0.9 + k * 0.35}s"><b>${t[0]}</b>${t[1]}</div>`).join('')}</div>
      <div id="cer-media"></div>
      <div class="cer-btns"><button class="btn btn-p" id="cer-skip">▶ Continuar</button></div>`;
    document.body.appendChild(o);
    o.querySelector('#cer-skip').onclick = () => close(next);
    confetti(o.querySelector('canvas'));
    // video opcional (se carga sólo ahora; si no existe se queda la animación + insignia, nunca un cuadro roto)
    try {
      fetch(MEDIA, { method: 'HEAD' }).then(r => {
        if (!r.ok || !document.getElementById('ach-cer')) return;
        const box = document.getElementById('cer-media'); if (!box) return;
        box.innerHTML = `<video src="${MEDIA}" playsinline muted preload="auto"></video><div class="cer-btns"><button class="btn btn-sm" id="cer-play">▶ Reproducir</button><button class="btn btn-sm" id="cer-mute">🔊 Sonido</button></div>`;
        const v = box.querySelector('video');
        v.onerror = () => { box.innerHTML = ''; };
        v.play().catch(() => { });
        box.querySelector('#cer-play').onclick = () => { v.currentTime = 0; v.play().catch(() => { }); };
        box.querySelector('#cer-mute').onclick = e2 => { v.muted = !v.muted; e2.target.textContent = v.muted ? '🔊 Sonido' : '🔇 Silenciar'; if (!v.muted) v.play().catch(() => { }); };
      }).catch(() => { });
    } catch (x) { }
  }
  function replay(i) { play(i, null); }

  // ---- UI en la pestaña Logros ----
  function panelHTML() {
    try {
      if (!active()) return '';
      check();
      const a = S(); let ok = 0;
      const groups = CAT.map((c, gi) => {
        const rows = ALL.filter(x => x.g === gi).map(it => {
          const d = done(it), pend = !d && it.st === 'saga';
          if (d) ok++;
          const lab = pend ? '<small class="amber">📖 Se logra en la pestaña Legado</small>' : '';
          const when = d && a.u[it.n] ? `<br><small class="green">✔ ${esc(a.u[it.n].temp)} ${esc(a.u[it.n].camp || '')}</small>` : (d ? '<br><small class="green">✔ Conseguido</small>' : '');
          return `<div class="offer" style="${d ? '' : 'opacity:.6'}"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">${d ? '🏅' : '🔒'}</span><div><b class="${d ? 'gold' : 'muted'}">#${it.n} ${esc(it.name)}</b><br><small class="muted">${esc(it.d)}</small>${lab ? '<br>' + lab : ''}${when}</div></div></div>`;
        }).join('');
        return `<details style="margin:6px 0"><summary class="panel-title" style="cursor:pointer">${esc(c[0])}</summary>${rows}</details>`;
      }).join('');
      const cer = a.cer.length ? `<div class="offer" style="border-color:#ffd447"><b class="gold">👑 CAMPEÓN DE CAMPEONES · MEJOR EQUIPO DEL CONTINENTE</b><br>${a.cer.map((e, i) => `<div style="margin-top:4px">${esc(e.club)} · ${esc(e.temp)} <button class="btn btn-sm" onclick="ACH.replay(${i})">▶ Volver a ver</button></div>`).join('')}</div>` : '';
      return `<div class="panel-title" style="margin-top:14px">🏅 Catálogo ampliado · ${ok}/80</div><div class="bar" style="margin:6px 0"><i style="width:${Math.round(ok / 80 * 100)}%"></i></div>
        <p class="muted" style="font-size:14px">Se desbloquean con hechos reales de tu carrera y sólo dan prestigio, nunca dinero. Los de 📖 Legado se logran jugando la saga.</p>${cer}${groups}`;
    } catch (e) { return ''; }
  }

  function migrate() { try { if (active()) { S(); check(); } } catch (e) { } }

  root.ACH = { CAT, ALL, onMatch, onPromo, onTrade, onSale, onMid, onCampaignEnd, onYearClose, check, showPendingCeremony, replay, panelHTML, migrate, unlock, has, awardCeremony, active };
})(typeof window !== 'undefined' ? window : globalThis);
