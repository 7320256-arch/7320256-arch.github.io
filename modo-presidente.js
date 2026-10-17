/* modo-presidente.js — Presidente, Fundación, Elecciones y Cantera (Retro Football Manager SV v1.9). Generado desde src/. */
(function (root) {
'use strict';
/* ===================== PARTE 1 · núcleo, datos y generadores ===================== */
const VER = 1;
const LVF = { 1: 1, 2: 0.55, 3: 0.3 };
const ESTILOS = ['Ofensivo', 'Equilibrado', 'Defensivo', 'Contragolpe'];
const APODOS = ['El Profe', 'El Estratega', 'El Ingeniero', 'El Zorro', 'El Tigre', 'El Maestro', 'El Sargento', 'El Mago', 'El Gallego', 'El Flaco', 'Don Chele', 'El Pelón'];
const NACS = ['El Salvador', 'El Salvador', 'El Salvador', 'El Salvador', 'Argentina', 'Uruguay', 'Colombia', 'México', 'Honduras', 'Costa Rica', 'España', 'Chile'];
const STAFF_ROLES = {
  fisio: { nombre: 'Fisioterapeuta', icon: '🩹', desc: 'Menos lesiones y recuperación más rápida.', fx: L => `Lesiones −${L * 10}% · cura +${L * 10}%/f` },
  prepFisico: { nombre: 'Preparador físico', icon: '🏃', desc: 'El plantel llega con más energía cada fecha.', fx: L => `Energía +${(L * 1.5).toFixed(1)}/fecha` },
  ojeador: { nombre: 'Jefe de ojeadores', icon: '🔭', desc: 'Informa jugadores del mercado sin costo.', fx: L => `Ojea ${L} jugador(es)/fecha` },
  analista: { nombre: 'Analista de video', icon: '📹', desc: 'Prepara a tu equipo contra cada rival.', fx: L => `Rendimiento +${(L * 1.2).toFixed(1)}%` },
  psicologo: { nombre: 'Psicólogo deportivo', icon: '🧠', desc: 'Mantiene alta la moral del vestuario.', fx: L => `Moral +${(L * 0.6).toFixed(1)}/fecha` },
  entPorteros: { nombre: 'Entrenador de porteros', icon: '🧤', desc: 'Mejora a tus guardametas poco a poco.', fx: L => `Portería +1 (${L * 3}%/fecha)` },
  jefeCantera: { nombre: 'Director de cantera', icon: '🌱', desc: 'Más y mejores canteranos cada año.', fx: L => `Camada +${Math.floor(L / 2) + 1} · pot. +${L * 2}` }
};
const STAFF_ORDER = ['fisio', 'prepFisico', 'ojeador', 'analista', 'psicologo', 'entPorteros', 'jefeCantera'];
const DIETAS = { austera: { n: 'Austera', mult: 0.5, apoyo: 0.25, d: 'Cobras poco; los socios lo valoran.' }, normal: { n: 'Normal', mult: 1, apoyo: 0, d: 'Dieta estándar de representación.' }, generosa: { n: 'Generosa', mult: 1.8, apoyo: -0.35, d: 'Más dinero para tu billetera, menos aprecio.' } };

function S() { return G && G.pres; }
function isPres() { return !!(G && G.rol === 'presidente' && G.pres); }
function isFund() { return !!(isPres() && G.pres.fund && G.pres.fund.fase === 'amateur'); }
function lvlN() { const u = userClub(); return u ? clamp(u.nivel || 3, 1, 3) : 3; }
function stars5(n) { n = clamp(Math.round(n), 0, 5); return '★'.repeat(n) + '☆'.repeat(5 - n); }
function ovrStars(o) { return clamp(Math.round(o / 20), 1, 5); }
function slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); }
function camKey() { return G.temporada + '-' + (G.campania || 'Apertura'); }
function absCamp() { return (G.temporada - 2026) * 2 + ((G.campania || 'Apertura') === 'Clausura' ? 1 : 0); }

/* ----- personas ----- */
function mkPerson() {
  const ap2 = Math.random() < 0.3 ? ' ' + pick(APELLIDOS) : '';
  return { id: uid(), nombre: pick(NOMBRES) + ' ' + pick(APELLIDOS) + ap2, nac: pick(NACS).replace('El Salvador', (typeof HOMEC === 'function' ? HOMEC() : 'El Salvador')) };
}
function dtOvr(d) { return Math.round(d.tactico * 0.4 + d.motivador * 0.25 + d.disciplina * 0.15 + d.cantera * 0.2); }
function dtWage(d, level) { const L = ovrStars(dtOvr(d)); return Math.round(2600 * (0.5 + 0.35 * L) * LVF[level || lvlN()] / 10) * 10; }
function staffWage(s, level) { return Math.round(1100 * (0.5 + 0.35 * s.nivel) * LVF[level || lvlN()] / 10) * 10; }
function genDT(q) {
  q = clamp(q + rnd(3) - 1, 1, 5);
  const base = q * 12 + 12, top = Math.random() < 0.05 ? 9 : 0, j = () => clamp(Math.round(base + top + rnd(25) - 12), 15, 94);
  const d = Object.assign(mkPerson(), { edad: 38 + rnd(26), apodo: Math.random() < 0.45 ? pick(APODOS) : '', tactico: j(), motivador: j(), cantera: j(), disciplina: j(), estilo: pick(ESTILOS), formPref: pick(['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1']), rep: clamp(q * 17 + rnd(15), 5, 98), satisf: 75 });
  return d;
}
function genStaff(rol, q) {
  let L = clamp(q + rnd(3) - 2, 1, 5); if (L === 5 && Math.random() > 0.25) L = 4; if (L === 4 && q < 4 && Math.random() > 0.5) L = 3;
  return Object.assign(mkPerson(), { rol, nivel: L, edad: 30 + rnd(30) });
}
function clubQ() { const u = userClub(); const tier = u.tier || 3; return clamp(Math.round(4.6 - (lvlN() - 1) * 1.0 - (tier - 3) * 0.35), 1, 5); }
function attraction() {
  const u = userClub();
  return 38 + (6 - (u.tier || 3)) * 5 + (3 - lvlN()) * 9 + (G.reputacion || 50) * 0.22 + ((G.confianza || 50) - 50) * 0.18 + (G.budget >= 0 ? 4 : -10);
}
function willing(ovrOrLevel, isStaff) {
  const need = isStaff ? 24 + ovrOrLevel * 9 : 20 + ovrOrLevel * 0.62;
  const a = attraction();
  return a >= need ? 'si' : a >= need - 12 ? 'caro' : 'no';
}
function ensureCandidates(force) {
  const s = S(); if (!s) return;
  if (!s.cand || force || s.cand.key !== camKey()) {
    const q = clubQ();
    const dts = []; const qs = [q - 1, q, q, q + 1, q + 1, q + 2, q - 2, 5];
    qs.forEach(x => dts.push(genDT(clamp(x, 1, 5))));
    const staff = {}; STAFF_ORDER.forEach(r => { staff[r] = [genStaff(r, clamp(q - 1, 1, 5)), genStaff(r, q), genStaff(r, clamp(q + 1, 1, 5)), genStaff(r, 5)]; });
    s.cand = { key: camKey(), dts, staff };
  }
}
function lvl(rol) { const s = S(); if (!s || !s.staff || !s.staff[rol]) return 0; return s.staff[rol].nivel || 0; }

/* ----- efectos económicos / deportivos ----- */
function payroll() {
  if (!isPres()) return 0; const s = S(); let t = 0;
  if (s.dt) t += s.dt.sueldoSem || 0;
  STAFF_ORDER.forEach(r => { if (s.staff[r]) t += s.staff[r].sueldoSem || 0; });
  if (s.cantera) t += Math.round((s.cantera.nivel || 1) * 260 * LVF[lvlN()] / 10) * 10;
  return t;
}
function dtEdgeValue() {
  const s = S(); let e = 0;
  if (s && s.dt) { e += (dtOvr(s.dt) - 55) / 55 * 0.10; e += ((s.dt.satisf == null ? 70 : s.dt.satisf) - 60) / 100 * 0.03; } else e -= 0.05;
  e += lvl('analista') * 0.012 + lvl('prepFisico') * 0.006;
  if (root.ECO) e += ECO.edge();
  return clamp(e, -0.1, 0.2);
}
function edgeFor(homeId, awayId) {
  if (!isPres() || !G.userClubId) return null;
  const e = dtEdgeValue(); const f = 1 + e, c = 1 - e * 0.6;
  if (homeId === G.userClubId) return { h: f, a: c };
  if (awayId === G.userClubId) return { h: c, a: f };
  return null;
}
function injuryChance() { return isPres() ? 0.025 * (1 - 0.1 * lvl('fisio')) * (root.ECO ? ECO.inj() : 1) : 0.025; }
function dietaValue() {
  const base = { 1: 36000, 2: 20000, 3: 11000 }[lvlN()] || 11000;
  const k = DIETAS[(S() && S().dieta) || 'normal'] || DIETAS.normal;
  return Math.round(base * k.mult / 100) * 100;
}
/* ===================== PARTE 2 · estado, contratos, DT automático, ganchos ===================== */
function newPres(mode) {
  G.rol = 'presidente';
  const old = G.pres || {};
  G.pres = {
    v: VER, mode: mode || 'existente', cargo: { restantes: 8, total: 8, desde: G.temporada }, dieta: 'normal', dt: null,
    staff: {}, cand: null, cantera: old.cantera || { nivel: 1, jugadores: [], hist: [], ult: null, upg: 0 },
    promesas: old.promesas || [], camp: null, fund: old.fund || null, venc: [], alertas: [], lastLoss: old.lastLoss || null, exDT: !!old.exDT, prepKey: '', logs: []
  };
  STAFF_ORDER.forEach(r => G.pres.staff[r] = null);
  G.salarioDT = dietaValue();
  return G.pres;
}
function interimDT() {
  const d = genDT(clubQ()); d.sueldoSem = dtWage(d); d.contrato = 2; d.satisf = 70; return d;
}
function migrate() {
  if (!G) return;
  if (!G.rol) G.rol = 'DT';
  if (G.pres) {
    const s = G.pres;
    if (!s.staff) s.staff = {}; STAFF_ORDER.forEach(r => { if (s.staff[r] === undefined) s.staff[r] = null; });
    if (!s.cantera) s.cantera = { nivel: 1, jugadores: [], hist: [], ult: null, upg: 0 };
    if (!s.alertas) s.alertas = []; if (!s.promesas) s.promesas = []; if (!s.venc) s.venc = []; if (!s.cargo) s.cargo = { restantes: 8, total: 8, desde: G.temporada };
    if (!s.dieta) s.dieta = 'normal'; if (s.prepKey == null) s.prepKey = '';
  }
  try { if (root.AV3D) AV3D.ensure(); } catch (e) { }
  if (isPres()) G.salarioDT = dietaValue();
}

/* ----- contratos ----- */
function personCard(p) { return p && p.nombre; }
function hireDT(id, temps) {
  const s = S(); if (!s) return; ensureCandidates();
  const c = s.cand.dts.find(x => x.id === id); if (!c) { toast('Candidato no disponible'); return; }
  if (s.dt) { toast('Primero despide al DT actual'); return; }
  const w = willing(dtOvr(c)); if (w === 'no') { toast(c.nombre + ' rechaza tu oferta: el club no lo convence'); return; }
  c.sueldoSem = Math.round(dtWage(c) * (w === 'caro' ? 1.3 : 1) * (temps >= 2 ? 0.92 : 1) / 10) * 10;
  c.contrato = temps * 2; c.satisf = 75; s.dt = c; s.cand.dts = s.cand.dts.filter(x => x.id !== id);
  pushNews(`🧑‍🏫 ${c.nombre} es el nuevo DT de ${userClub().nombre} (${c.estilo}, contrato ${temps} temporada(s)).`, 'bueno', 'club');
  G.confianza = clamp(G.confianza + 1.5, 0, 100);
  toast('Contratado: ' + c.nombre); autoSave(); refresh();
}
function fireIndemn(p) { const left = Math.min(p.contrato || 0, 2); return Math.round((p.sueldoSem || 0) * 22 * left * 0.3 / 10) * 10; }
function fireDT() {
  const s = S(); if (!s || !s.dt) return; const d = s.dt; const cost = fireIndemn(d);
  s.dt = null; G.budget -= cost; if (cost) fin('Directiva', 'gasto', -cost, 'Indemnización a ' + d.nombre);
  pushNews(`🚪 ${d.nombre} fue despedido como DT${cost ? ' (indemnización ' + money(cost) + ')' : ''}.`, 'malo', 'club');
  closeModal(); toast('DT despedido'); autoSave(); refresh();
}
function renewDT() {
  const s = S(); if (!s || !s.dt) return; const d = s.dt;
  if ((d.satisf || 0) < 30) { toast(d.nombre + ' no quiere renovar: está muy molesto'); return; }
  const up = 1.05 + ((d.satisf || 0) < 50 ? 0.25 : 0);
  d.sueldoSem = Math.round(d.sueldoSem * up / 10) * 10; d.contrato = (d.contrato || 0) + 4; d.satisf = clamp((d.satisf || 0) + 6, 0, 100);
  pushNews(`✍ ${d.nombre} renueva 2 temporadas más (${money(d.sueldoSem)}/fecha).`, 'bueno', 'club'); closeModal(); toast('Contrato renovado'); autoSave(); refresh();
}
function hireStaff(rol, id) {
  const s = S(); if (!s) return; ensureCandidates();
  const c = (s.cand.staff[rol] || []).find(x => x.id === id); if (!c) { toast('Candidato no disponible'); return; }
  if (s.staff[rol]) { toast('Ya tienes ' + STAFF_ROLES[rol].nombre + ': despídelo primero'); return; }
  const w = willing(c.nivel, true); if (w === 'no') { toast(c.nombre + ' rechaza: tu club no lo seduce'); return; }
  c.sueldoSem = Math.round(staffWage(c) * (w === 'caro' ? 1.3 : 1) / 10) * 10; c.contrato = 4;
  s.staff[rol] = c; s.cand.staff[rol] = s.cand.staff[rol].filter(x => x.id !== id);
  pushNews(`${STAFF_ROLES[rol].icon} ${c.nombre} se une al club como ${STAFF_ROLES[rol].nombre}.`, 'bueno', 'club');
  toast(STAFF_ROLES[rol].nombre + ' contratado'); autoSave(); refresh();
}
function fireStaff(rol) {
  const s = S(); if (!s || !s.staff[rol]) return; const p = s.staff[rol]; const cost = fireIndemn(p);
  s.staff[rol] = null; G.budget -= cost; if (cost) fin('Directiva', 'gasto', -cost, 'Indemnización a ' + p.nombre);
  pushNews(`${STAFF_ROLES[rol].icon} ${p.nombre} deja el club${cost ? ' (indemnización ' + money(cost) + ')' : ''}.`, 'info', 'club');
  closeModal(); toast('Contrato rescindido'); autoSave(); refresh();
}
function renewStaff(rol) {
  const s = S(); if (!s || !s.staff[rol]) return; const p = s.staff[rol];
  p.sueldoSem = Math.round(p.sueldoSem * 1.06 / 10) * 10; p.contrato = (p.contrato || 0) + 4;
  pushNews(`✍ ${p.nombre} renueva como ${STAFF_ROLES[rol].nombre}.`, 'bueno', 'club'); toast('Renovado'); autoSave(); refresh();
}
function setDieta(k) { const s = S(); if (!s || !DIETAS[k]) return; s.dieta = k; G.salarioDT = dietaValue(); toast('Dieta ' + DIETAS[k].n.toLowerCase()); autoSave(); refresh(); }

/* ----- confirmaciones genéricas ----- */
const PEND = {}; let PENDN = 0;
function ask(title, html, okLabel, fn, danger) {
  const n = ++PENDN; PEND[n] = fn;
  openModal(`<div class="modal-title">${title}</div><div class="pr-ask">${html}</div><div class="center" style="margin-top:12px"><button class="btn ${danger ? 'btn-d' : 'btn-p'}" onclick="PRES._do(${n})">${okLabel}</button> <button class="btn" onclick="closeModal()">Cancelar</button></div>`);
}
function _do(n) { const f = PEND[n]; delete PEND[n]; if (f) f(); }
function confirmFireDT() { const d = S().dt; if (!d) return; const c = fireIndemn(d); ask('🚪 ¿Despedir al DT?', `<b>${esc(d.nombre)}</b> (${stars5(ovrStars(dtOvr(d)))}) tiene ${d.contrato} campaña(s) de contrato.<br>Indemnización: <b class="red">${money(c)}</b>.<br><small>Mientras no haya DT el equipo juega con un interino y el rendimiento baja.</small>`, 'Despedir', fireDT, true); }
function confirmFireStaff(r) { const p = S().staff[r]; if (!p) return; const c = fireIndemn(p); ask('Rescindir contrato', `<b>${esc(p.nombre)}</b> · ${STAFF_ROLES[r].nombre}<br>Indemnización: <b class="red">${money(c)}</b>.`, 'Rescindir', () => fireStaff(r), true); }

/* ----- DT automático ----- */
let busy = false;
function nextOppObj() { try { const m = userNextMatch(); if (!m) return null; return concacafTeam(m.h === G.userClubId ? m.a : m.h); } catch (e) { return null; } }
function dtDecide() {
  const s = S(), u = userClub(), dt = s.dt; const style = dt ? dt.estilo : 'Equilibrado';
  const keys = ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '4-2-3-1'];
  const scored = keys.map(k => {
    const xi = bestXI(u.plantilla, k); const avg = xi.reduce((a, p) => a + (p.media || 50), 0) / Math.max(1, xi.length);
    let b = 0; if (dt && dt.formPref === k) b += 1.2; if (style === 'Ofensivo' && k === '4-3-3') b += 0.8; if (style === 'Defensivo' && k === '5-3-2') b += 0.8; if (style === 'Contragolpe' && k === '4-4-2') b += 0.4;
    return { k, sc: avg + b };
  }).sort((a, b) => b.sc - a.sc);
  const tac = dt ? dt.tactico : 30; const q = 0.35 + tac * 0.0065;
  const form = !dt ? '4-4-2' : (Math.random() < q ? scored[0].k : scored[Math.min(rnd(3), scored.length - 1)].k);
  const opp = nextOppObj(); const d = opp ? teamRating(u) - teamRating(opp) : 0;
  let ment = 'Equilibrada';
  if (style === 'Ofensivo') ment = d > -6 ? 'Ofensiva' : 'Equilibrada';
  else if (style === 'Defensivo') ment = d >= 8 ? 'Equilibrada' : 'Defensiva';
  else if (style === 'Contragolpe') ment = d >= 6 ? 'Equilibrada' : 'Contraataque';
  else ment = d >= 8 ? 'Ofensiva' : d <= -8 ? 'Contraataque' : 'Equilibrada';
  const xi = bestXI(u.plantilla, form); const avgE = xi.reduce((a, p) => a + (p.energia || 0), 0) / Math.max(1, xi.length);
  const T = G.tactics; T.formacion = form; T.mentalidad = ment; T.presion = (style === 'Ofensivo' && avgE > 70) ? 'Alta' : (avgE < 55 ? 'Baja' : 'Media'); T.ritmo = style === 'Ofensivo' ? 'Directo' : style === 'Defensivo' ? 'Pausado' : 'Normal';
  T.alineacion = xi.map(p => p.id);
  const atk = xi.reduce((a, p) => a + p.atributos.ataque, 0) / 11, def = xi.reduce((a, p) => a + p.atributos.defensa, 0) / 11;
  G.training = G.training || { intensidad: 'Normal', enfoque: 'Equilibrado' };
  G.training.enfoque = atk < def - 4 ? 'Ataque' : def < atk - 4 ? 'Defensa' : 'Equilibrado';
  G.training.intensidad = avgE < 55 ? 'Descanso' : (avgE > 85 && dt && dt.disciplina > 70 ? 'Intenso' : 'Normal');
  return { form, ment, opp };
}
function autoPrepare() {
  if (!isPres() || isFund() || busy || LIVE || SIM) return; busy = true;
  try {
    const s = S(); const info = dtDecide(); ensureWeekPrep();
    const hadPrep = prepComplete();
    if (!hadPrep) {
      simulatePreparation();
      G.noticias = G.noticias.filter(n => !(n.j === G.jornadaActual && /^(🏋 Entrenamiento|🧊 Recuperación|🏨 Concentración)/.test(n.x || '')));
    }
    const key = camKey() + '-' + G.jornadaActual + '-' + G.matchMode;
    if (s.prepKey !== key) {
      s.prepKey = key; const w = G.weekPrep; const dt = s.dt;
      const b = (dt ? dt.tactico / 100 * 1.2 : 0) + lvl('analista') * 0.25; w.bonusAtk = (w.bonusAtk || 0) + b; w.bonusDef = (w.bonusDef || 0) + b;
      pushNews(`📋 ${dt ? 'El DT ' + dt.nombre.split(' ').slice(-1)[0] : 'El interino'} define ${G.tactics.formacion} · ${G.tactics.mentalidad}${info.opp ? ' ante ' + info.opp.nombre : ''}.`, 'info', 'club');
    }
  } finally { busy = false; }
}
function beforePlay() { if (isPres() && !isFund()) autoPrepare(); return true; }
function liveHook(kind) {
  if (!isPres() || isFund()) return;
  if (kind === 'decision') {
    setTimeout(() => {
      if (!LIVE || LIVE.phase !== 'decision') return;
      const lead = LIVE.sU - LIVE.sR; const st = S().dt ? S().dt.estilo : 'Equilibrado';
      let ch = 'balance';
      if (lead < 0) ch = st === 'Defensivo' ? 'balance' : 'attack'; else if (lead > 0) ch = st === 'Ofensivo' ? 'balance' : 'defend'; else ch = st === 'Ofensivo' ? 'attack' : st === 'Defensivo' ? 'defend' : 'balance';
      chooseLiveDecision(ch);
    }, 1100);
  } else if (kind === 'halftime') {
    setTimeout(() => {
      if (!LIVE || LIVE.phase !== 'halftime') return;
      const lead = LIVE.sU - LIVE.sR; if (lead < 0 && G.tactics.mentalidad !== 'Ofensiva') G.tactics.mentalidad = 'Ofensiva'; else if (lead > 0 && G.tactics.mentalidad === 'Ofensiva') G.tactics.mentalidad = 'Equilibrada';
      try { ensureValidXI(); } catch (e) { }
      continueSecondHalf();
    }, 1700);
  }
}

/* ----- tras cada fecha de liga ----- */
function afterMatchday(gf, ga) {
  if (!isPres()) return;
  const s = S(), u = userClub(), dt = s.dt, res = gf > ga ? 'w' : gf < ga ? 'l' : 'd';
  if (dt) dt.satisf = clamp((dt.satisf == null ? 70 : dt.satisf) + (res === 'w' ? 2.5 : res === 'd' ? 0.3 : -2.2) - (G.budget < 0 ? 0.4 : 0), 0, 100);
  G.confianza = clamp(G.confianza + (res === 'w' ? 0.7 : res === 'd' ? 0.1 : -0.6) + (G.budget < 0 ? (G.budget < -100000 ? -1 : -0.5) : 0) + (dt ? 0 : -0.4), 0, 100);
  const pf = lvl('prepFisico'), ps = lvl('psicologo'), fi = lvl('fisio');
  u.plantilla.forEach(p => {
    if (pf) p.energia = clamp(p.energia + pf * 1.5, 0, 100);
    if (ps) { p.moral = clamp((p.moral || 60) + ps * 0.6, 0, 100); if (p.quiereIrse && Math.random() < 0.08 * ps) p.quiereIrse = false; }
    if (dt) p.moral = clamp((p.moral || 60) + (dt.motivador - 55) / 45, 0, 100);
    if (p.lesionado && fi && p.lesionJor > 0 && Math.random() < 0.10 * fi) { p.lesionJor--; if (p.lesionJor <= 0) { p.lesionado = false; p.lesionJor = 0; } }
  });
  const ep = lvl('entPorteros');
  if (ep && Math.random() < 0.03 * ep) {
    const gk = u.plantilla.filter(p => p.posicion === 'POR' && p.media < (p.potencial || p.media)).sort((a, b) => a.edad - b.edad)[0];
    if (gk) { gk.atributos.porteria = clamp(gk.atributos.porteria + 1, 1, 95); gk.media = calcMedia(gk); gk.valorMercado = Math.round(gk.media * gk.media * 40 * ageFactor(gk.edad)); }
  }
  const oj = lvl('ojeador');
  if (oj) { const pool = [...(G.mercado || []), ...(G.agentOffers || [])].filter(p => !p.scouted); for (let i = 0; i < oj && pool.length; i++) pool.splice(rnd(pool.length), 1)[0].scouted = true; }
  if (dt) {
    if (dt.satisf < 30 && Math.random() < 0.08) { pushNews(`😤 ${dt.nombre} está molesto con la directiva y se lo dice a la prensa.`, 'malo', 'club'); s.alertas.push({ t: 'dt', x: 'El DT está molesto: revisa sus resultados y su contrato.' }); }
    if (dt.satisf < 12 && Math.random() < 0.3) { pushNews(`🚪 ${dt.nombre} renuncia como DT de ${u.nombre}.`, 'malo', 'club'); s.alertas.push({ t: 'dt', x: dt.nombre + ' renunció. Necesitas contratar un DT.' }); s.dt = null; }
  }
  G.salarioDT = dietaValue();
  if (s.alertas.length > 6) s.alertas = s.alertas.slice(-6);
}

/* ----- fin de campaña ----- */
function tickContracts(msgs) {
  const s = S();
  if (s.dt) { s.dt.contrato--; if (s.dt.contrato <= 0) { msgs.push(`🧑‍🏫 Terminó el contrato de ${s.dt.nombre}: dejó el club.`); pushNews('📄 Terminó el contrato del DT ' + s.dt.nombre + '.', 'info', 'club'); s.dt = null; } else if (s.dt.contrato === 1) msgs.push(`⏳ El contrato de ${s.dt.nombre} (DT) termina en una campaña. Puedes renovarlo.`); }
  STAFF_ORDER.forEach(r => { const p = s.staff[r]; if (!p) return; p.contrato--; if (p.contrato <= 0) { msgs.push(`${STAFF_ROLES[r].icon} Se fue ${p.nombre} (${STAFF_ROLES[r].nombre}): contrato terminado.`); s.staff[r] = null; } else if (p.contrato === 1) msgs.push(`⏳ ${STAFF_ROLES[r].nombre}: contrato de ${p.nombre} termina en una campaña.`); });
}
function endSeasonHook(res, fired) {
  if (!G) return false;
  if (G.rol !== 'presidente' || !G.pres) return electionIfDue ? electionIfDue(res, fired) : false;
  const s = S(), msgs = [];
  const closeBook = () => {
    tickContracts(msgs);
    if (s.dt) s.dt.satisf = clamp((s.dt.satisf || 60) + (res.met ? 8 : -10) + (res.titulo ? 10 : 0), 0, 100);
    const dv = dietaValue(); G.budget -= dv; fin('Directiva', 'gasto', -dv, 'Dieta del presidente'); pushNews(`💼 Dieta de la presidencia: ${money(dv)} (a tu billetera).`, 'info', 'club');
    const dk = DIETAS[s.dieta || 'normal']; if (dk.apoyo) G.confianza = clamp(G.confianza + dk.apoyo * 10, 0, 100);
    s.cargo.restantes = Math.max(0, s.cargo.restantes - 1);
    const cm = canteraSeasonEnd ? canteraSeasonEnd(res) : []; cm.forEach(m => msgs.push(m));
    const pm = promesasCheck ? promesasCheck(res) : []; pm.forEach(m => msgs.push(m));
    s.alertas = []; s.prepKey = '';
  };
  closeBook();
  if (fired) { destitucionModal(res); return true; }
  if (s.cargo.restantes <= 0) { reeleccion(res, msgs); return true; }
  autoSave(); renderAll();
  informeModal(res, msgs);
  return true;
}
function informeModal(res, msgs) {
  const s = S(), u = userClub();
  const dtL = s.dt ? `${esc(s.dt.nombre)} · ${stars5(ovrStars(dtOvr(s.dt)))} · satisfacción ${Math.round(s.dt.satisf)}%` : '<span class="red">Sin DT</span>';
  openModal(`<div class="modal-title">📋 Informe de la presidencia · ${res.season} ${res.campania || ''}</div>
    <div class="pr-report">
      <div class="pr-rep-row"><span>Posición final</span><b>${res.pos}° en ${DIV_NAMES[res.lvl]}</b> ${res.met ? '<span class="tag green">OBJETIVO ✓</span>' : '<span class="tag red">OBJETIVO ✗</span>'}</div>
      <div class="pr-rep-row"><span>Apoyo de los socios</span><b>${Math.round(G.confianza)}/100</b></div>
      <div class="pr-rep-row"><span>Caja del club</span><b class="${G.budget < 0 ? 'red' : 'green'}">${money(G.budget)}</b></div>
      <div class="pr-rep-row"><span>Director técnico</span><b>${dtL}</b></div>
      <div class="pr-rep-row"><span>Mandato</span><b>${s.cargo.restantes} campaña(s) restantes</b></div>
    </div>
    ${msgs.length ? '<hr class="sep"><div class="pr-msgs">' + msgs.map(m => '<div>' + esc(m) + '</div>').join('') + '</div>' : ''}
    ${res.playoff ? `<hr class="sep"><div class="offer"><b class="gold">Liguilla Primera</b><br>Campeón: ${esc(res.playoff.champion)}</div>` : ''}
    ${root.REG ? REG.block('year', res) : ''}
    <div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="closeModal();switchView('despacho')">Ir al Despacho</button> <button class="btn" onclick="closeModal();switchView('tecnico')">🧑‍🏫 Cuerpo técnico</button></div>`);
}
function destitucionModal(res) {
  let offers = []; try { offers = generateOffers(true); } catch (e) { }
  openModal(`<div class="modal-title">🗳 ¡Los socios te destituyen!</div>
    <p>Tras quedar <b>${res.pos}°</b> en ${DIV_NAMES[res.lvl]}, la asamblea de <b>${esc(res.club || userClub().nombre)}</b> te retiró la presidencia.</p>
    <p class="muted">Tu historial te abre otra puerta: volver al banquillo como director técnico.</p>
    <div id="offer-list">${offers.map(renderOffer).join('')}</div>${root.REG ? REG.block('fired', res) : ''}`);
}
function reeleccion(res, msgs) {
  const s = S();
  const r = voteResult('reeleccion');
  const win = r.you >= 50;
  const body = voteHTML(r);
  if (win) {
    s.cargo.restantes = s.cargo.total = 8; s.cargo.desde = G.temporada; G.reputacion = clamp(G.reputacion + 6, 0, 100); G.confianza = clamp(G.confianza + 8, 0, 100);
    pushNews('🗳 ¡Reelegido! ' + G.managerName + ' seguirá 4 temporadas más al frente de ' + userClub().nombre + '.', 'bueno', 'club');
    autoSave(); renderAll();
    openModal(`<div class="modal-title">🗳 Asamblea de socios · Reelección</div>${body}<p class="green center"><b>¡Ganaste! Cuatro temporadas más.</b></p>${msgs.length ? '<div class="pr-msgs">' + msgs.map(m => '<div>' + esc(m) + '</div>').join('') + '</div>' : ''}<div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="closeModal()">Seguir</button></div>`);
  } else {
    let offers = []; try { offers = generateOffers(false); } catch (e) { }
    pushNews('🗳 No fuiste reelegido. Termina tu etapa como presidente.', 'malo', 'club'); autoSave(); renderAll();
    openModal(`<div class="modal-title">🗳 Asamblea de socios · Reelección</div>${body}<p class="red center"><b>No fuiste reelegido.</b></p><p class="muted">Puedes volver a dirigir como DT en otro club:</p><div id="offer-list">${offers.map(renderOffer).join('') || '<p class="muted">Sin ofertas hoy.</p>'}</div>${root.REG ? REG.block('fired', res) : ''}`);
  }
}
function refresh() { try { renderAll(); } catch (e) { console.error('PRES.refresh', e); } }
/* ===================== PARTE 3 · cantera / academia ===================== */
const CANT_COST = [0, 0, 60000, 140000, 260000, 450000]; // costo de subir DESDE nivel-1 → nivel
function canteraUpgCost() { const c = S().cantera; return Math.round(CANT_COST[Math.min(5, c.nivel + 1)] * LVF[lvlN()] * 1.0 / 1000) * 1000; }
function upgradeCantera() {
  const c = S().cantera; if (c.nivel >= 5) { toast('La academia ya es nivel máximo'); return; }
  const cost = canteraUpgCost(); if (G.budget < cost) { toast('Te faltan ' + money(cost - G.budget)); return; }
  G.budget -= cost; c.nivel++; fin('Cantera', 'gasto', -cost, 'Academia nivel ' + c.nivel);
  pushNews(`🌱 Inauguras la academia nivel ${c.nivel} (${money(cost)}).`, 'bueno', 'club'); autoSave(); refresh(); toast('Academia nivel ' + c.nivel);
}
function mkProspect() {
  const c = S().cantera, jc = lvl('jefeCantera'), dt = S().dt;
  const pos = pick(['POR', 'DEF', 'DEF', 'MED', 'MED', 'DEL', 'DEL']);
  const base = 50 + c.nivel * 3.2 + jc * 1.5 + (dt ? dt.cantera / 40 : 1);
  let pot = Math.round(base + (rnd(15) + rnd(15) - 14) * 0.9);
  // diamante: raro, crece con nivel y jefe de cantera
  if (Math.random() < 0.012 + c.nivel * 0.012 + jc * 0.006) pot += 8 + rnd(8);
  pot = clamp(pot, 38, 92);
  const med0 = clamp(pot - 26 - rnd(14), 20, 50);
  const f = v => clamp(Math.round(v + rnd(9) - 4), 8, 90);
  const a = { ataque: f(med0), defensa: f(med0), fisico: f(med0 - 4), porteria: f(med0 * 0.4) };
  if (pos === 'POR') { a.porteria = f(med0 + 12); a.ataque = f(med0 * 0.2); }
  else if (pos === 'DEF') a.defensa = f(med0 + 8);
  else if (pos === 'DEL') a.ataque = f(med0 + 8);
  const p = { id: uid(), nombre: uniqueName(), posicion: pos, edad: 15 + rnd(3), atributos: a, energia: 100, moral: 75, contrato: 3, quiereIrse: false, lesionado: false, lesionJor: 0, yellowCards: 0, suspended: 0, nacionalidad: 'El Salvador', equipoOrigen: 'Cantera ' + userClub().nombre, stats: { goles: 0, asistencias: 0, atajadas: 0, pj: 0 }, personalidad: pick(['Promesa', 'Promesa', 'Profesional', 'Leal', 'Ambicioso']) };
  p.media = calcMedia(p); p.potencial = Math.max(pot, p.media); p.scouted = (jc >= 2 || lvl('ojeador') >= 3);
  p.salario = Math.round(p.media * p.media * 0.42 / 10) * 10; p.valorMercado = Math.round(p.media * p.media * 40 * ageFactor(p.edad));
  return p;
}
function newCamada() {
  const c = S().cantera, jc = lvl('jefeCantera'); const n = 3 + Math.floor(c.nivel / 2) + Math.floor(jc / 2) + (root.EMB ? root.EMB.canteraBonus() : 0);
  const nuevos = []; for (let i = 0; i < n; i++) nuevos.push(mkProspect());
  c.jugadores = (c.jugadores || []).concat(nuevos).slice(-14); c.ult = G.temporada; return nuevos;
}
function canteraSeasonEnd(res) {
  const s = S(), c = s.cantera, msgs = [];
  if (!c) return msgs;
  const dtC = s.dt ? s.dt.cantera : 40;
  (c.jugadores || []).forEach(p => {
    const gap = Math.max(0, p.potencial - p.media); const g = Math.min(gap, Math.round(gap * (0.12 + 0.015 * c.nivel + dtC / 1500) + rnd(3) - 1));
    ['ataque', 'defensa', 'fisico'].forEach(k => p.atributos[k] = clamp(p.atributos[k] + Math.round(g * (0.7 + Math.random() * 0.6)), 1, 95));
    if (p.posicion === 'POR') p.atributos.porteria = clamp(p.atributos.porteria + g, 1, 95);
    p.media = calcMedia(p); if (res && res.campania === 'Clausura') p.edad++;
    p.salario = Math.round(p.media * p.media * 0.42 / 10) * 10; p.valorMercado = Math.round(p.media * p.media * 40 * ageFactor(p.edad));
  });
  if (res && res.campania === 'Clausura') {
    // vencen: con 19 años o más hay que decidir
    const u = userClub();
    const vence = root.PL && PL.active() ? [] : c.jugadores.filter(p => p.edad >= 19);   // v2.7: con Planteles, quien se pasa de edad sube a Sub-20 solo
    vence.forEach(p => {
      if (u.plantilla.length < 26 && p.media >= 45) { promote(p.id, true); msgs.push(`🌱 ${p.nombre} (${p.edad}) sube al primer equipo (${p.media}/${p.potencial}).`); }
      else { c.jugadores = c.jugadores.filter(x => x.id !== p.id); msgs.push(`🌱 ${p.nombre} sale de la academia (sin lugar en el plantel).`); }
    });
    if (s.dt && s.dt.cantera >= 70 && !(root.PL && PL.active())) {
      const best = c.jugadores.filter(p => p.edad >= 17).sort((a, b) => b.media - a.media)[0];
      if (best && u.plantilla.length < 26) { promote(best.id, true); msgs.push(`🧑‍🏫 ${s.dt.nombre.split(' ').slice(-1)[0]} lanza a ${best.nombre} al primer equipo.`); }
    }
    const nuevos = newCamada(); msgs.push(`🌱 Llegó una camada de ${nuevos.length} canteranos${nuevos.some(p => p.potencial >= 80) ? ' — ¡con un diamante!' : ''}.`);
    c.hist.unshift({ t: G.temporada, n: nuevos.length, mejor: Math.max.apply(null, nuevos.map(p => p.potencial)) }); c.hist = c.hist.slice(0, 8);
    s.alertas.push({ t: 'cantera', x: 'Nueva camada en la academia.' });
    if (root.PL) PL.normalize();
  }
  return msgs;
}
function promote(id, silent) {
  const c = S().cantera, u = userClub(); const i = c.jugadores.findIndex(p => p.id === id); if (i < 0) return;
  if (u.plantilla.length >= 30) { if (!silent) toast('Plantilla llena (30). Vende o libera a alguien.'); return; }
  const p = c.jugadores.splice(i, 1)[0]; p.scouted = true; p.contrato = 3; p.moral = 80; p.equipoOrigen = 'Cantera ' + u.nombre; p.cantera = true;
  u.plantilla.push(p); try { if (root.ACH && ACH.onPromo) ACH.onPromo(p, 'u17'); } catch (e) { }
  if (!silent) { pushNews(`🌱 ${p.nombre} (${p.edad}, ${p.posicion}) debuta en el primer equipo.`, 'bueno', 'club'); toast('Promovido: ' + p.nombre); autoSave(); refresh(); }
}
function releaseProspect(id) {
  const c = S().cantera; const p = c.jugadores.find(x => x.id === id); if (!p) return;
  ask('Liberar canterano', `¿Liberar a <b>${esc(p.nombre)}</b> (${p.media}/${p.potencial})? No podrás recuperarlo.`, 'Liberar', () => { c.jugadores = c.jugadores.filter(x => x.id !== id); closeModal(); autoSave(); refresh(); }, true);
}
function evalProspect(id) {
  const c = S().cantera; const p = c.jugadores.find(x => x.id === id); if (!p || p.scouted) return; const cost = 1200;
  if (G.budget < cost) { toast('Necesitas ' + money(cost)); return; } G.budget -= cost; fin('Cantera', 'gasto', -cost, 'Evaluación de ' + p.nombre); p.scouted = true; autoSave(); refresh();
}
// promesas de campaña (se evalúan al cierre de cada campaña)
function promesasCheck(res) {
  const s = S(), msgs = []; if (!s.promesas || !s.promesas.length) return msgs; const u = userClub();
  s.promesas.forEach(p => {
    if (p.hecha || p.fallida) return; p.edad = (p.edad || 0) + 1;
    let ok = false;
    if (p.tipo === 'fichaje') ok = u.plantilla.some(x => x.media >= p.meta);
    else if (p.tipo === 'ascenso') ok = u.nivel < p.meta;
    else if (p.tipo === 'titulo') ok = !!res.titulo;
    else if (p.tipo === 'estadio') ok = !!(u.estadio && ((u.estadio.nivel || 1) >= p.meta || u.estadio.propio));
    else if (p.tipo === 'cantera') ok = S().cantera.nivel >= p.meta;
    else if (p.tipo === 'superavit') ok = G.budget > 0;
    else if (p.tipo === 'entradas') ok = (u.estadio.precio || 3) <= p.meta;
    if (ok) { p.hecha = true; G.confianza = clamp(G.confianza + 6, 0, 100); msgs.push(`✅ Promesa cumplida: ${p.desc}`); pushNews('✅ Cumpliste una promesa: ' + p.desc, 'bueno', 'club'); }
    else if (p.tipo === 'entradas' && p.edad < p.limite) { /* se mantiene */ }
    else if (p.edad >= p.limite) { p.fallida = true; G.confianza = clamp(G.confianza - 12, 0, 100); msgs.push(`❌ Promesa incumplida: ${p.desc} (−12 apoyo)`); pushNews('❌ Promesa incumplida: ' + p.desc, 'malo', 'club'); }
    else if (p.tipo === 'entradas' && p.edad >= p.limite) { p.hecha = true; msgs.push(`✅ Mantuviste entradas bajas: ${p.desc}`); }
  });
  return msgs;
}
/* ===================== PARTE 4 · elecciones y campaña ===================== */
const PROMESAS = {
  fichaje: { n: 'Fichar a una estrella', d: () => `Tener un jugador de media ≥ ${teamRating(userClub()) + 6}`, meta: () => teamRating(userClub()) + 6, lim: 4, bono: 7 },
  ascenso: { n: 'Ascender de categoría', d: () => 'Subir de división', meta: () => userClub().nivel, lim: 4, bono: 12, solo: () => userClub().nivel > 1 },
  titulo: { n: 'Ser campeón', d: () => 'Ganar el título de liga', meta: () => 1, lim: 4, bono: 14, solo: () => userClub().nivel === 1 },
  estadio: { n: 'Mejorar el estadio', d: () => 'Tener estadio propio o nivel 2+', meta: () => 2, lim: 4, bono: 8 },
  cantera: { n: 'Academia de nivel 3', d: () => 'Academia juvenil nivel 3', meta: () => 3, lim: 4, bono: 6 },
  superavit: { n: 'Cuentas sanas', d: () => 'Terminar con caja positiva', meta: () => 0, lim: 2, bono: 6 },
  entradas: { n: 'Entradas accesibles', d: () => 'No subir las entradas por 2 campañas', meta: () => (userClub().estadio.precio || 3), lim: 4, bono: 5 }
};
function eligible() {
  if (!G || G.rol === 'presidente') return { ok: false, why: 'Ya eres presidente' };
  const rep = G.reputacion || 0, h = (G.historia || []).length;
  const s = G.pres || {};
  if (s.lastLoss != null && absCamp() - s.lastLoss < 4) return { ok: false, why: 'Perdiste una elección hace poco. Espera 2 temporadas.' };
  const checks = [[rep >= 55, `Reputación ${Math.round(rep)}/55`], [h >= 3, `Campañas dirigidas ${h}/3`], [(G.confianza || 0) >= 45, `Confianza ${Math.round(G.confianza)}/45`]];
  return { ok: checks.every(c => c[0]), checks, why: '' };
}
function startCampaign() {
  const el = eligible(); if (!el.ok) { toast(el.why || 'Aún no cumples los requisitos'); return; }
  if (!G.pres) { G.pres = { v: VER, cargo: { restantes: 8, total: 8 }, staff: {}, cantera: { nivel: 1, jugadores: [], hist: [], ult: null, upg: 0 }, promesas: [], alertas: [], venc: [], dieta: 'normal', lastLoss: null }; STAFF_ORDER.forEach(r => G.pres.staff[r] = null); }
  const u = userClub(); const asamblea = (G.campania === 'Clausura' && G.jornadaActual >= 14) ? G.temporada + 1 : G.temporada;
  G.pres.camp = { club: u.id, apoyo: clamp(Math.round(34 + (G.reputacion - 50) * 0.5 + (G.confianza - 50) * 0.25), 15, 60), asamblea, usos: {}, promesas: [], rival: { nombre: pick(['Don ' + pick(NOMBRES) + ' ' + pick(APELLIDOS), 'Ing. ' + pick(NOMBRES) + ' ' + pick(APELLIDOS), 'Lic. ' + pick(NOMBRES) + ' ' + pick(APELLIDOS)]), perfil: pick(['empresario local', 'ex-presidente del club', 'dirigente histórico', 'líder de la barra']), fuerza: 38 + rnd(22) } };
  pushNews(`🗳 ${G.managerName} lanza su candidatura a la presidencia de ${u.nombre}. Asamblea: fin de la temporada ${asamblea}.`, 'info', 'club');
  autoSave(); renderAll(); openCampaign();
}
const ACCIONES = {
  mitin: { n: '📣 Mitin en el barrio', c: 3000, max: 3, f: c => { const g = 4 + rnd(4); c.apoyo += g; return `El mitin movilizó a la afición (+${g}).`; } },
  tv: { n: '📺 Entrevista en TV', c: 5000, max: 2, f: c => { if (Math.random() < 0.15) { c.apoyo -= 3; return 'Te equivocaste al aire y se hizo viral (−3).'; } const g = 5 + rnd(5); c.apoyo += g; return `Buena entrevista (+${g}).`; } },
  cena: { n: '🍽 Cena con los socios', c: 8000, max: 1, f: c => { const g = 8 + rnd(5); c.apoyo += g; return `Los socios quedaron encantados (+${g}).`; } },
  debate: { n: '🎤 Debate con el rival', c: 0, max: 1, f: c => { const sc = G.reputacion + rnd(40) - 20 - c.rival.fuerza; const g = clamp(Math.round(sc / 6), -6, 9); c.apoyo += g; return g >= 0 ? `Ganaste el debate (+${g}).` : `Saliste mal parado del debate (${g}).`; } }
};
function campAction(k) {
  const c = G.pres && G.pres.camp; if (!c) return; const a = ACCIONES[k]; const u = c.usos[k] || 0;
  if (u >= a.max) { toast('Ya no puedes repetir esto en esta campaña'); return; }
  if ((G.managerWallet || 0) < a.c) { toast('Tu billetera personal no alcanza (' + money(a.c) + ')'); return; }
  G.managerWallet -= a.c; c.usos[k] = u + 1; const m = a.f(c); c.apoyo = clamp(c.apoyo, 0, 90); toast(m); autoSave(); openCampaign();
}
function promesaToggle(k) {
  const c = G.pres && G.pres.camp; if (!c) return; const P = PROMESAS[k]; if (P.solo && !P.solo()) return;
  const i = c.promesas.indexOf(k); if (i >= 0) c.promesas.splice(i, 1); else { if (c.promesas.length >= 3) { toast('Máximo 3 promesas'); return; } c.promesas.push(k); }
  openCampaign();
}
function cancelCampaign() { ask('Retirar candidatura', 'Perderás lo invertido en la campaña. ¿Retirarte?', 'Retirarme', () => { G.pres.camp = null; closeModal(); autoSave(); renderAll(); }, true); }
function openCampaign() {
  const c = G.pres && G.pres.camp; if (!c) { openElections(); return; }
  const prom = Object.keys(PROMESAS).filter(k => !PROMESAS[k].solo || PROMESAS[k].solo());
  openModal(`<div class="modal-title">🗳 Campaña a la presidencia</div>
  <div class="pr-vote"><div class="pr-vbar"><i style="width:${clamp(c.apoyo, 0, 100)}%"></i><b>${Math.round(c.apoyo)}%</b></div><small>Tu intención de voto (se define en la asamblea de fin de temporada ${c.asamblea}). Rival: <b>${esc(c.rival.nombre)}</b>, ${esc(c.rival.perfil)}.</small></div>
  <div class="panel-title" style="font-size:10px;margin-top:10px">Acciones de campaña · billetera ${money(G.managerWallet || 0)}</div>
  <div class="pr-acts">${Object.keys(ACCIONES).map(k => { const a = ACCIONES[k], u = c.usos[k] || 0; return `<button class="btn btn-sm" ${u >= a.max ? 'disabled' : ''} onclick="PRES.campAction('${k}')">${a.n} ${a.c ? '· ' + money(a.c) : '· gratis'} (${u}/${a.max})</button>`; }).join('')}</div>
  <div class="panel-title" style="font-size:10px;margin-top:10px">Promesas (máx. 3, dan votos hoy y cobran factura si las incumples)</div>
  <div class="pr-prom">${prom.map(k => { const P = PROMESAS[k], on = c.promesas.includes(k); return `<label class="pr-pr ${on ? 'on' : ''}" onclick="PRES.promesaToggle('${k}')"><b>${on ? '☑' : '☐'} ${P.n}</b><small>${esc(P.d())} · plazo ${P.lim} campañas · +${P.bono}</small></label>`; }).join('')}</div>
  <div class="center" style="margin-top:12px"><button class="btn" onclick="closeModal()">Seguir dirigiendo</button> <button class="btn btn-d btn-sm" onclick="PRES.cancelCampaign()">Retirar candidatura</button></div>`);
}
function openElections() {
  if (G.rol === 'presidente') { openMandato(); return; }
  const el = eligible(); const u = userClub();
  openModal(`<div class="modal-title">🗳 Elecciones de ${esc(u.nombre)}</div>
    <p>Si tu carrera es buena, los socios pueden confiarte la presidencia. Puedes seguir dirigiendo mientras haces campaña; al ganar, pasas a ser <b>presidente</b>: dejas el banquillo y contratas tú al DT y al personal.</p>
    <div class="pr-checks">${(el.checks || []).map(c => `<div class="${c[0] ? 'green' : 'red'}">${c[0] ? '✓' : '✗'} ${c[1]}</div>`).join('')}${el.why ? '<div class="red">' + el.why + '</div>' : ''}</div>
    <div class="center" style="margin-top:12px">${el.ok ? '<button class="btn btn-p" onclick="PRES.startCampaign()">🗳 Postularme</button>' : '<button class="btn" disabled>Aún no cumples requisitos</button>'} <button class="btn" onclick="closeModal()">Cerrar</button></div>`);
}
function openMandato() {
  const s = S();
  openModal(`<div class="modal-title">🏛 Mandato y promesas</div>
  <p>Te quedan <b>${s.cargo.restantes}</b> campaña(s) de mandato. Apoyo de socios: <b>${Math.round(G.confianza)}/100</b>.</p>
  <div class="pr-prom">${(s.promesas || []).length ? s.promesas.map(p => `<div class="pr-pr ${p.hecha ? 'on' : p.fallida ? 'bad' : ''}"><b>${p.hecha ? '✅' : p.fallida ? '❌' : '⏳'} ${esc(p.desc)}</b><small>${p.hecha ? 'Cumplida' : p.fallida ? 'Incumplida' : `Plazo: ${Math.max(0, p.limite - (p.edad || 0))} campaña(s)`}</small></div>`).join('') : '<p class="muted">No hiciste promesas de campaña.</p>'}</div>
  <div class="panel-title" style="font-size:10px;margin-top:10px">Tu dieta de presidente</div>
  <div class="pr-acts">${Object.keys(DIETAS).map(k => `<button class="btn btn-sm ${s.dieta === k ? 'btn-p' : ''}" onclick="PRES.setDieta('${k}');PRES.openMandato()">${DIETAS[k].n} · ${money(Math.round(({ 1: 36000, 2: 20000, 3: 11000 }[lvlN()]) * DIETAS[k].mult / 100) * 100)}</button>`).join('')}</div><small class="muted">${DIETAS[s.dieta].d} Se paga del presupuesto del club al cerrar cada campaña.</small>
  <div class="center" style="margin-top:12px"><button class="btn" onclick="closeModal()">Cerrar</button> <button class="btn btn-sm" onclick="closeModal();ECO.resign()">🚪 Renunciar</button></div>`);
}
function voteResult(kind) {
  const s = S() || {}; const c = (G.pres && G.pres.camp);
  let base;
  if (kind === 'reeleccion') base = G.confianza * 0.8 + G.reputacion * 0.15 + 4;
  else base = c.apoyo + (G.historia && G.historia.length ? 0 : 0);
  const prom = (kind === 'reeleccion' ? (s.promesas || []) : []).reduce((a, p) => a + (p.hecha ? 2 : p.fallida ? -4 : 0), 0);
  const rival = (c && c.rival) ? c.rival.fuerza : 40 + rnd(20);
  const you = clamp(Math.round(base + prom + rnd(11) - 5 - (rival - 48) * 0.35), 5, 95);
  return { you, rival: 100 - you, rivalName: (c && c.rival ? c.rival.nombre : 'Candidato opositor') };
}
function voteHTML(r) { return `<div class="pr-vote"><div class="pr-vlab"><span>${esc(G.managerName)}</span><span>${esc(r.rivalName)}</span></div><div class="pr-vbar two"><i style="width:${r.you}%"></i><b>${r.you}%</b><em>${r.rival}%</em></div></div>`; }
let LASTRES = null;
function afterElection() { closeModal(); if (LASTRES) showOffersModal(LASTRES); }
function electionIfDue(res, fired) {
  LASTRES = res;
  const c = G.pres && G.pres.camp; if (!c || c.club !== G.userClubId) return false;
  if (res.campania !== 'Clausura' || res.season < c.asamblea) return false; // se vota al cerrar la Clausura de la temporada pactada
  const r = voteResult('campana'); const win = r.you >= 50;
  if (win) {
    const promesas = (c.promesas || []).map(k => ({ id: uid(), tipo: k, desc: PROMESAS[k].d(), meta: PROMESAS[k].meta(), limite: PROMESAS[k].lim, edad: 0, hecha: false, fallida: false }));
    const wasDT = G.managerName;
    newPres('desdeDT'); G.pres.exDT = true; G.pres.promesas = promesas; G.reputacion = clamp(G.reputacion + 8, 0, 100); G.confianza = clamp(55 + (r.you - 50), 40, 90);
    c.promesas.forEach(k => { G.confianza = clamp(G.confianza + PROMESAS[k].bono * 0.6, 0, 100); });
    G.pres.dt = null; ensureCandidates(true);
    pushNews(`🗳 ¡${wasDT} gana las elecciones y es el nuevo presidente de ${userClub().nombre}!`, 'gol', 'club');
    try { unlockAchievement('presidente', 'Presidente electo', 'Ganaste las elecciones del club'); } catch (e) { }
    autoSave(); renderAll();
    openModal(`<div class="modal-title">🗳 Asamblea de socios · ¡Presidente!</div>${voteHTML(r)}<p class="green center"><b>¡Ganaste las elecciones!</b></p><p>Dejas el banquillo. Ahora tú decides <b>quién dirige al equipo</b> y con qué cuerpo técnico. Tu mandato dura 4 temporadas.</p><div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="closeModal();switchView('tecnico')">🧑‍🏫 Elegir DT</button></div>`);
  } else {
    G.pres.camp = null; G.pres.lastLoss = absCamp(); G.confianza = clamp(G.confianza - 6, 0, 100);
    pushNews('🗳 Perdiste las elecciones del club.', 'malo', 'club'); autoSave(); renderAll();
    openModal(`<div class="modal-title">🗳 Asamblea de socios</div>${voteHTML(r)}<p class="red center"><b>Perdiste por ${r.rival - r.you} puntos.</b></p><p class="muted">Podrás postularte otra vez en 2 temporadas.</p><div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="PRES.afterElection()">Continuar</button></div>`);
  }
  return true;
}
/* ===================== PARTE 5 · club desde cero + liga amateur ===================== */
const AM_NAMES = ['Deportivo Los Pinos', 'Atlético Cuscatlán', 'Juventud Izalqueña', 'Real Santa Lucía', 'Sporting Las Palmas', 'Unión Chalateca', 'Deportivo La Ceiba', 'Estrella Roja FC', 'Racing San Rafael', 'Halcones de Apopa', 'Fénix de Soyapango', 'Tigres de Ilopango', 'Pumas de Sonsonate', 'Cañeros del Sur', 'Lobos de Cojutepeque', 'Gallos de Jiquilisco', 'Mineros del Norte', 'Barrio Nuevo FC', 'Deportivo Las Flores', 'Atlético San Marcos'];
const CIUDADES_SV = ['San Salvador', 'Santa Ana', 'San Miguel', 'Soyapango', 'Santa Tecla', 'Apopa', 'Sonsonate', 'Usulután', 'Ahuachapán', 'Zacatecoluca', 'Cojutepeque', 'La Unión', 'Chalatenango', 'San Vicente', 'Cabañas', 'Ilobasco', 'Nahuizalco', 'Metapán'];
const COLORES = ['#d62828', '#0b6b8f', '#1d8a3a', '#f2a900', '#6a1b9a', '#111827', '#e85d04', '#0077b6', '#9d0208', '#2a9d8f', '#ff5ec7', '#7a4a2b'];
const AM_TOTAL = 14;
function ciudades() { try { const l = (typeof LG === 'function') ? LG() : null; return (l && l.cities) || CIUDADES_SV; } catch (e) { return CIUDADES_SV; } }
let FORM = { nombre: '', ciudad: '', abrev: '', color: '#0b6b8f', modo: 'normal' };
const MODOS = { austero: { n: 'Austero', b: 40000, d: 'Menos caja, más mérito.' }, normal: { n: 'Normal', b: 60000, d: 'Lo justo para empezar.' }, fuerte: { n: 'Respaldado', b: 90000, d: 'Un empresario amigo pone capital.' } };

function mkAmPlayer(pos, boost) {
  const p = genPlayer(pos, 5);
  if (boost) { ['ataque', 'defensa', 'fisico'].forEach(k => p.atributos[k] = clamp(p.atributos[k] + boost, 1, 70)); if (pos === 'POR') p.atributos.porteria = clamp(p.atributos.porteria + boost, 1, 70); }
  p.media = calcMedia(p); p.potencial = Math.max(p.potencial, p.media); p.scouted = true; p.equipoOrigen = 'Liga amateur'; p.nacionalidad = (typeof HOMEC === 'function' ? HOMEC() : 'El Salvador');
  p.salario = Math.round(p.media * p.media * 0.42 / 10) * 10; p.valorMercado = Math.round(p.media * p.media * 40 * ageFactor(p.edad)); p.contrato = 2;
  return p;
}
function mkAmSquad(boost) {
  const w = { POR: 2, DEF: 6, MED: 6, DEL: 4 }, s = []; POS.forEach(p => { for (let i = 0; i < w[p]; i++) s.push(mkAmPlayer(p, boost)); }); return s;
}
function amMarket(n) {
  const o = []; for (let i = 0; i < n; i++) { const p = mkAmPlayer(pick(POS), rnd(9)); if (Math.random() < 0.2) p.edad = 18 + rnd(4); p.precio = Math.round(p.valorMercado * (0.18 + Math.random() * 0.16) / 100) * 100; p.comision = Math.round(p.precio * 0.06); p.equipoOrigen = pick(['Libre', 'Liga departamental', 'Reserva', 'Academia regional']); p.libre = p.equipoOrigen === 'Libre'; o.push(p); }
  return o.sort((a, b) => b.media - a.media);
}
function foundHook() {
  const f = FORM, baseId = G.userClubId;
  const nombre = (f.nombre || '').trim().slice(0, 28) || 'C.D. Nuevo Amanecer';
  let id = (slug(f.abrev) || slug(nombre).replace(/^(CD|FC|CF|DEPORTIVO|CLUB)/, '')).slice(0, 3) || 'NUE'; id = id.padEnd(3, 'X');
  let k = 0; while (G.clubes[id]) { id = id.slice(0, 2) + String.fromCharCode(65 + (k++ % 26)); }
  const city = f.ciudad || ciudades()[0]; const modo = MODOS[f.modo] || MODOS.normal;
  const club = { id, nombre, ciudad: city, color: f.color, tier: 5, nivel: 3, estadioPropio: false, plantilla: withNamePool(() => mkAmSquad(3)), tabla: emptyTabla(), forma: [], budget: modo.b, amateur: true };
  club.estadio = initStadium(id, 3, false, city); club.estadio.aforo = 1500; club.estadio.alquiler = 1200; club.estadio.nombre = 'Cancha municipal de ' + city; club.estadio.fans = 12;
  G.clubes[id] = club; G.userClubId = id; G.budget = modo.b; G.estadio = club.estadio; G.sponsor = null; G.sponsorOffers = genSponsorOffers(3);
  G.tactics.alineacion = bestXI(club.plantilla, '4-4-2').map(p => p.id); G.objetivo = setObjectiveFor(club, G.divisiones);
  G.reputacion = 40; G.confianza = 60; G.mercado = withNamePool(() => amMarket(12)); G.agentOffers = withNamePool(() => amMarket(6)).map(p => { p.ofrecido = true; return p; });
  newPres('fund');
  const names = shuffle(AM_NAMES.slice()).slice(0, 7), rivals = {};
  names.forEach((n, i) => { const rid = 'AM' + (i + 1); rivals[rid] = { id: rid, nombre: n, ciudad: pick(ciudades()), color: pick(COLORES), tier: 5, nivel: 3, plantilla: withNamePool(() => mkAmSquad(rnd(5))), tabla: emptyTabla(), forma: [] }; });
  const ids = [id].concat(Object.keys(rivals));
  G.pres.fund = { fase: 'amateur', temporada: 1, jor: 1, ids, rivals, cal: roundRobinFull(ids), hist: [], last: null, sig: null };
  G.pres.dt = interimDT(); G.pres.dt.sueldoSem = Math.round(G.pres.dt.sueldoSem * 0.6 / 10) * 10; G.pres.dt.contrato = 2;
  G.pres.cantera.nivel = 1; G.salarioDT = 0;
  G.pres.dieta = 'austera';
}
function amClub(id) { return id === G.userClubId ? userClub() : G.pres.fund.rivals[id]; }
function amTable() { return G.pres.fund.ids.map(amClub).sort(tableSort); }
function amNext() { const f = G.pres.fund; if (f.jor > AM_TOTAL) return null; const r = f.cal[f.jor - 1]; return r.find(m => m.h === G.userClubId || m.a === G.userClubId); }
function amPlay(n) {
  if (!isFund()) return; n = n || 1;
  for (let i = 0; i < n; i++) { if (!isFund()) break; amOne(); }
}
function amOne() {
  const f = G.pres.fund, u = userClub(); if (f.jor > AM_TOTAL) return;
  dtDecide();
  const round = f.cal[f.jor - 1]; let ugf = 0, uga = 0, home = false, opp = null;
  round.forEach(m => {
    const H = amClub(m.h), A = amClub(m.a); const r = quickSim(H, A);
    applyTabla(H, r.gh, r.ga); applyTabla(A, r.ga, r.gh);
    if (m.h === G.userClubId) { ugf = r.gh; uga = r.ga; home = true; opp = A; } else if (m.a === G.userClubId) { ugf = r.ga; uga = r.gh; opp = H; }
  });
  const win = ugf > uga;
  const gate = home ? Math.round(u.estadio.aforo * 0.45 * 4 * (0.8 + Math.random() * 0.5)) : 0;
  const sp = G.sponsor ? Math.round((G.sponsor.base + (win ? G.sponsor.win : 0)) * 0.45) : 0;
  const subs = 7000, wage = weeklyWage(), cost = Math.round(u.estadio.alquiler * (home ? 1 : 0.4));
  const net = gate + sp + subs - wage - cost; G.budget += net;
  fin('Liga amateur', 'ingreso', gate + sp + subs, 'Taquilla, patrocinio y subsidio de la alcaldía'); fin('Plantilla', 'gasto', -(wage + cost), 'Nómina y cancha');
  u.plantilla.forEach(p => { if (p.lesionado) { p.lesionJor--; if (p.lesionJor <= 0) { p.lesionado = false; p.lesionJor = 0; } } if (p.suspended > 0) p.suspended--; p.energia = clamp(p.energia + (p.lesionado ? 3 : 7), 0, 100); });
  G.tactics.alineacion.map(id => u.plantilla.find(p => p.id === id)).filter(Boolean).forEach(p => { if (!p.lesionado) { p.energia = clamp(p.energia - (10 + rnd(12)), 0, 100); if (Math.random() < injuryChance()) { p.lesionado = true; p.lesionJor = 1 + rnd(3); } } });
  pushNews(`📅 Amateur F${f.jor}: ${u.nombre} ${ugf}-${uga} ${opp ? opp.nombre : ''} (${net >= 0 ? '+' : ''}${money(net)}).`, win ? 'bueno' : ugf < uga ? 'malo' : 'info', 'club');
  f.last = { jor: f.jor, ugf, uga, opp: opp ? opp.nombre : '', home, net };
  G.jornadaActual = 1; afterMatchday(ugf, uga);
  if (G.budget < -40000) { G.confianza = clamp(G.confianza - 1.2, 0, 100); }
  f.jor++;
  if (f.jor % 4 === 1 && f.jor <= AM_TOTAL) { G.mercado = G.mercado.slice(3).concat(withNamePool(() => amMarket(3))); }
  if (f.jor > AM_TOTAL) { amSeasonEnd(); return; }
  autoSave(); renderAll(); toast(`F${f.jor - 1}: ${ugf}-${uga}`);
}
function amSeasonEnd() {
  const f = G.pres.fund, u = userClub(), t = amTable(), pos = t.findIndex(c => c.id === G.userClubId) + 1, msgs = [];
  const champ = t[0]; const won = pos === 1;
  f.hist.unshift({ t: f.temporada, pos, champ: champ.nombre, pts: u.tabla.pts });
  const prize = won ? 30000 : pos <= 3 ? 12000 : 4000; G.budget += prize; fin('Liga amateur', 'ingreso', prize, 'Premio de la liga amateur');
  G.confianza = clamp(G.confianza + (pos <= 2 ? 10 : pos <= 4 ? 2 : -8), 0, 100);
  if (G.pres.dt) G.pres.dt.satisf = clamp((G.pres.dt.satisf || 60) + (won ? 15 : pos <= 3 ? 4 : -8), 0, 100);
  tickContracts(msgs); canteraSeasonEnd({ campania: 'Clausura' }).forEach(m => msgs.push(m));
  if (won) { pushNews(`🏆 ¡${u.nombre} CAMPEÓN de la Liga Amateur y asciende a Tercera División!`, 'gol', 'club'); autoSave(); fundPromote(msgs, prize); return; }
  // otra temporada amateur
  G.temporada++; u.plantilla.forEach(p => { p.edad++; }); Object.values(f.rivals).forEach(r => { r.plantilla.forEach(p => p.edad++); });
  f.temporada++; f.jor = 1; f.cal = roundRobinFull(f.ids); [u].concat(Object.values(f.rivals)).forEach(c => { c.tabla = emptyTabla(); c.forma = []; });
  Object.values(f.rivals).forEach(r => { r.plantilla = r.plantilla.map(p => { if (Math.random() < 0.3) { const q = mkAmPlayer(p.posicion, rnd(5)); return q; } return p; }); });
  pushNews(`📋 Terminó la temporada amateur: ${pos}° lugar. Campeón: ${champ.nombre}.`, 'info', 'club'); autoSave(); renderAll();
  openModal(`<div class="modal-title">📋 Fin de la temporada amateur ${f.temporada - 1}</div><div class="pr-report"><div class="pr-rep-row"><span>Tu posición</span><b>${pos}° de 8</b></div><div class="pr-rep-row"><span>Campeón</span><b>${esc(champ.nombre)}</b></div><div class="pr-rep-row"><span>Premio</span><b class="green">${money(prize)}</b></div></div>${msgs.length ? '<hr class="sep"><div class="pr-msgs">' + msgs.map(m => '<div>' + esc(m) + '</div>').join('') + '</div>' : ''}<p class="muted">Solo el campeón asciende a Tercera División. ¡Refuerza el plantel y vuelve a intentarlo!</p><div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="closeModal();switchView('despacho')">Seguir</button></div>`);
}
function fundPromote(msgs, prize) {
  const f = G.pres.fund, u = userClub();
  const cand = G.divisiones[3].map(id => G.clubes[id]).sort((a, b) => teamRating(a) - teamRating(b))[0];
  const idx = G.divisiones[3].indexOf(cand.id); G.divisiones[3][idx] = u.id;
  u.nivel = 3; u.amateur = false; f.fase = 'pro'; f.ascendio = G.temporada;
  [1, 2, 3].forEach(l => G.divisiones[l].forEach(id => { const c = G.clubes[id]; c.tabla = emptyTabla(); c.forma = []; }));
  G.calendarios[3] = roundRobinFull(G.divisiones[3]);
  G.jornadaActual = 1; G.campania = 'Apertura'; G.matchMode = 'league'; G.temporada++; u.plantilla.forEach(p => p.edad++);
  G.copa = initCopa([].concat(G.divisiones[1], G.divisiones[2], G.divisiones[3])); G.centroCup = null; G.concacafCup = null; G.supercopaStage = null; G.playoffStage = null;
  G.sponsor = null; G.sponsorOffers = genSponsorOffers(3); G.budget += 40000; fin('Ascenso', 'ingreso', 40000, 'Bono por el ascenso a Tercera');
  G.mercado = genMarket(10); G.agentOffers = genAgentOffers(3); G.objetivo = setObjectiveFor(u, G.divisiones); G.reputacion = clamp(G.reputacion + 12, 0, 100);
  G.pres.cargo = { restantes: 8, total: 8, desde: G.temporada }; G.pres.dieta = 'normal'; G.salarioDT = dietaValue(); ensureCandidates(true);
  try { unlockAchievement('desde_cero', 'Del barrio a Tercera', 'Fundaste un club y ascendiste a Tercera División'); } catch (e) { }
  pushNews(`⬆ ${u.nombre} debuta en Tercera División. Desplazó a ${cand.nombre}.`, 'gol', 'club'); autoSave(); renderAll(); switchView('despacho');
  openModal(`<div class="modal-title">🏆 ¡ASCENSO A TERCERA DIVISIÓN!</div><p>Fundaste <b>${esc(u.nombre)}</b> y ganaste la Liga Amateur. A partir de ahora juegas el sistema de ligas profesional.</p><div class="pr-report"><div class="pr-rep-row"><span>Premio + bono</span><b class="green">${money((prize || 0) + 40000)}</b></div><div class="pr-rep-row"><span>Plantel</span><b>media ${teamRating(u)} (los rivales rondan ${Math.round(G.divisiones[3].filter(i => i !== u.id).reduce((a, i) => a + teamRating(G.clubes[i]), 0) / 11)})</b></div></div>${(msgs || []).length ? '<hr class="sep"><div class="pr-msgs">' + msgs.map(m => '<div>' + esc(m) + '</div>').join('') + '</div>' : ''}<p class="muted">Ahora sí se activan Copa Presidente, tabla completa y objetivos de directiva. Refuerza el equipo: la Tercera exige más.</p><div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="closeModal()">¡A jugar!</button></div>`);
}
function openFoundation() {
  FORM.nombre = FORM.nombre || ''; const f = FORM;
  openModal(`<div class="modal-title">🌱 Fundar un club</div>
  <div class="pr-form">
    <label>Nombre del club<input id="fd-nom" maxlength="28" placeholder="C.D. Nuevo Amanecer" value="${esc(f.nombre)}" oninput="PRES.formSet('nombre',this.value);PRES.formPreview()"></label>
    <div class="row2"><label>Ciudad<select id="fd-ciu" onchange="PRES.formSet('ciudad',this.value)">${ciudades().map((c, i) => `<option ${c === f.ciudad || (!f.ciudad && i === 0) ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    <label>Siglas (3)<input id="fd-abr" maxlength="3" placeholder="NAM" value="${esc(f.abrev)}" style="text-transform:uppercase" oninput="PRES.formSet('abrev',this.value);PRES.formPreview()"></label></div>
    <div class="lab">Color del club</div><div class="av-sw">${COLORES.map(c => `<button class="${f.color === c ? 'on' : ''}" style="background:${c}" aria-label="Color" onclick="PRES.formSet('color','${c}');PRES.openFoundation()"></button>`).join('')}</div>
    <div class="lab">Capital inicial</div><div class="av-chips">${Object.keys(MODOS).map(k => `<button class="${f.modo === k ? 'on' : ''}" onclick="PRES.formSet('modo','${k}');PRES.openFoundation()">${MODOS[k].n} · ${money(MODOS[k].b)}</button>`).join('')}</div><small class="muted">${MODOS[f.modo].d}</small>
    <div class="pr-prev" id="fd-prev"></div>
    <p class="muted" style="font-size:15px">Empiezas en la <b>Liga Amateur</b> (8 equipos, 14 fechas). El campeón asciende a Tercera División. Contratas tú al DT y al personal.</p>
  </div>
  <div class="center" style="margin-top:10px"><button class="btn btn-p" onclick="PRES.foundNext()">Continuar</button> <button class="btn" onclick="closeModal()">Cancelar</button></div>`);
  formPreview();
}
function formSet(k, v) { FORM[k] = v; }
function formPreview() {
  const el = document.getElementById('fd-prev'); if (!el) return; const ini = (slug(FORM.abrev) || slug(FORM.nombre).replace(/^(CD|FC|CF|DEPORTIVO|CLUB)/, '')).slice(0, 3) || 'NAM';
  el.innerHTML = `<span class="badge" style="width:54px;height:54px;font-size:15px;background:${FORM.color};color:#fff;border-color:#000">${esc(ini.padEnd(3, 'X'))}</span><div><b>${esc(FORM.nombre || 'C.D. Nuevo Amanecer')}</b><br><small>${esc(FORM.ciudad)} · cancha municipal</small></div>`;
}
function foundNext() {
  openModal(`<div class="modal-title">🎽 Nombre del presidente</div><p class="muted">Así aparecerás en noticias y en el ranking.</p><input id="dt-name-input" maxlength="20" value="Presidente" style="width:100%;margin:10px 0" onkeydown="if(event.key==='Enter')PRES.foundGo()"><div class="center"><button class="btn btn-p" onclick="PRES.foundGo()">▶ Fundar</button> <button class="btn" onclick="PRES.openFoundation()">Atrás</button></div>`);
  setTimeout(() => { const i = $('dt-name-input'); if (i) { i.focus(); i.select(); } }, 60);
}
function foundGo() {
  const i = $('dt-name-input'); const nm = ((i && i.value) || '').trim().replace(/\s+/g, ' ').slice(0, 20) || 'Presidente'; closeModal();
  const base = G_division_static(3).slice(-1)[0]; startGame(base, nm, 'fund');
}
/* ===================== PARTE 6 · interfaz: navegación, vistas, intro ===================== */
let MODE = 'dt', TEC_TAB = 'equipo', STAFF_PICK = 'fisio';
const LASTSUB = {};
const SECT_PRO = [
  { id: 'despacho', ico: '🏛', n: 'Despacho', subs: [['despacho', 'Inicio'], ['palmares', 'Palmarés'], ['legado', 'Legado'], ['probador', 'Probador 3D']] },
  { id: 'club', ico: '⚽', n: 'Club', subs: [['plantilla', 'Plantel'], ['planteles', 'Planteles'], ['tecnico', 'Cuerpo técnico'], ['cantera', 'Cantera']] },
  { id: 'mercado', ico: '💼', n: 'Fichajes', subs: [['mercado', 'Mercado'], ['region', 'Región']] },
  { id: 'liga', ico: '🏆', n: 'Torneos', subs: [['calendario', 'Calendario'], ['clasificacion', 'Tabla'], ['copa', 'Copa'], ['centro', 'Centroamérica'], ['concacaf', 'CONCACAF'], ['stats', 'Estadísticas']] },
  { id: 'finanzas', ico: '💰', n: 'Finanzas', subs: [['finanzas', 'Finanzas'], ['inversiones', 'Inversiones']] },
  { id: 'prensa', ico: '📰', n: 'Prensa', subs: [['noticias', 'Noticias'], ['logros', 'Logros'], ['embajador', 'Embajador'], ['novedades', 'Novedades']] }
];
function sections() {
  if (!isFund()) return SECT_PRO;
  return SECT_PRO.map(s => s.id === 'liga' ? { id: 'liga', ico: '🏆', n: 'Liga', subs: [['ligaam', 'Liga amateur']] } : s);
}
function sectOf(v) { const ss = sections(); return ss.find(s => s.subs.some(x => x[0] === v)); }
function mode() { return MODE === 'dt' ? null : MODE; }
function skinOn() { try { const k = localStorage.getItem('rfm_skin'); if (k === 'palco') return true; if (k === 'retro') return false; } catch (e) { } return isPres(); }
function toggleSkin() { try { localStorage.setItem('rfm_skin', skinOn() ? 'retro' : 'palco'); } catch (e) { } chrome(); toast(skinOn() ? 'Tema Palco activado' : 'Tema retro activado'); try { closeModal(); } catch (e) { } }

/* ---------- estructura del DOM ---------- */
function ensureViews() {
  const main = document.querySelector('main'); if (!main) return;
  ['despacho', 'probador', 'tecnico', 'cantera', 'ligaam'].forEach(id => {
    if (!$('view-' + id)) { const s = document.createElement('section'); s.id = 'view-' + id; s.className = 'view hidden'; s.innerHTML = '<div class="panel pr-panel" id="' + id + '-panel"></div>'; main.appendChild(s); }
  });
  if (root.ECO) ECO.ensureView();
  if (!$('pr-subnav')) { const d = document.createElement('div'); d.id = 'pr-subnav'; d.className = 'pr-subnav hidden'; main.insertBefore(d, main.firstChild); }
}
let ORIGNAV = null;
function chrome() {
  const body = document.body; if (!body) return;
  body.classList.toggle('skin-palco', skinOn()); body.classList.toggle('rol-presidente', isPres());
  try { root.applyTheme && root.applyTheme(); } catch (e) { }
  const nav = $('nav'); if (!nav) return;
  if (isPres()) {
    ensureViews(); if (ORIGNAV == null) ORIGNAV = nav.innerHTML;
    const ss = sections(); const h = [];
    ss.forEach((s, i) => { if (i === 3) h.push(`<button class="pr-fab" onclick="PRES.play()" aria-label="Jugar jornada"><span>▶</span><i>${isFund() ? 'Fecha' : 'Jornada'}</i></button>`); h.push(`<button class="pr-nav" data-sec="${s.id}" onclick="PRES.go('${s.id}')"><span>${s.ico}</span><i>${s.n}</i></button>`); });
    nav.innerHTML = h.join(''); nav.classList.add('pr-navbar'); nav.dataset.pr = '1';
  } else if (nav.dataset.pr === '1' && ORIGNAV != null) { nav.innerHTML = ORIGNAV; nav.classList.remove('pr-navbar'); delete nav.dataset.pr; const sn = $('pr-subnav'); if (sn) sn.classList.add('hidden'); }
}
function go(sec) {
  const s = sections().find(x => x.id === sec); if (!s) return; const v = LASTSUB[sec] && s.subs.some(x => x[0] === LASTSUB[sec]) ? LASTSUB[sec] : s.subs[0][0]; switchView(v);
}
function play() {
  if (isFund()) { if (LIVE) return; amPlay(1); return; }
  if (isPres()) switchView('partido');
}
function redirect(v) {
  if (!isPres()) return v;
  if (v === 'dashboard') return 'despacho';
  if (v === 'carrera') return 'despacho';
  if (isFund() && ['calendario', 'copa', 'centro', 'concacaf', 'clasificacion', 'stats', 'entreno', 'tactica', 'partido'].includes(v)) return v === 'partido' ? 'ligaam' : 'ligaam';
  if (v === 'tactica' || v === 'entreno') return 'tecnico';
  return v;
}
function onSwitch(v) {
  if (!isPres()) { if (v !== 'carrera' && root.AV3D) AV3D.destroy(); return; }
  ensureViews(); const s = sectOf(v);
  if (s) LASTSUB[s.id] = v;
  document.querySelectorAll('#nav .pr-nav').forEach(b => b.classList.toggle('on', !!s && b.dataset.sec === s.id));
  const fab = document.querySelector('#nav .pr-fab'); if (fab) fab.classList.toggle('on', v === 'partido' || v === 'ligaam');
  const sn = $('pr-subnav');
  if (sn) { if (s && s.subs.length > 1) { sn.classList.remove('hidden'); sn.innerHTML = s.subs.map(x => `<button class="${x[0] === v ? 'on' : ''}" onclick="switchView('${x[0]}')">${x[1]}</button>`).join(''); } else { sn.classList.add('hidden'); sn.innerHTML = ''; } }
  document.body.dataset.view = v;
  if (v !== 'despacho' && v !== 'probador' && root.AV3D) AV3D.destroy();
  if (v === 'despacho') renderDespacho(); else if (v === 'probador') renderProbador(); else if (v === 'tecnico') renderTecnico(); else if (v === 'cantera') renderCantera(); else if (v === 'ligaam') renderLigaAm(); else if (v === 'inversiones' && root.ECO) { ECO.ensureView(); ECO.renderInv(); }
  const m = document.querySelector('main'); if (m) m.scrollTop = 0;
}

/* ---------- piezas visuales ---------- */
function faceSVG(seed, kit, size) {
  const L = root.AV3D ? AV3D.dtSeedLook(seed) : { piel: 1, pelo: 'corto', pcolor: 1, barba: 'ninguna' };
  const skin = AV3D.SKIN[L.piel % AV3D.SKIN.length], hair = AV3D.HAIRC[L.pcolor % (AV3D.HAIRC.length - 1)];
  const hs = L.pelo === 'calvo' ? '' : L.pelo === 'rizado' ? `<circle cx="22" cy="19" r="6" fill="${hair}"/><circle cx="32" cy="15" r="7" fill="${hair}"/><circle cx="42" cy="19" r="6" fill="${hair}"/>` : L.pelo === 'largo' ? `<path d="M15 32 Q13 12 32 12 Q51 12 49 32 L49 44 L44 44 L44 26 L20 26 L20 44 L15 44Z" fill="${hair}"/>` : `<path d="M17 28 Q16 12 32 12 Q48 12 47 28 Q40 20 32 21 Q24 20 17 28Z" fill="${hair}"/>`;
  const beard = L.barba === 'barba' ? `<path d="M18 32 Q32 52 46 32 Q44 44 32 46 Q20 44 18 32Z" fill="${hair}" opacity=".9"/>` : L.barba === 'candado' ? `<rect x="28" y="40" width="8" height="5" fill="${hair}"/>` : '';
  const gl = L.gafas ? `<circle cx="26" cy="31" r="4.2" fill="none" stroke="#222" stroke-width="1.4"/><circle cx="38" cy="31" r="4.2" fill="none" stroke="#222" stroke-width="1.4"/><path d="M30 31h4" stroke="#222" stroke-width="1.4"/>` : '';
  return `<svg class="pr-face" viewBox="0 0 64 64" width="${size || 64}" height="${size || 64}" aria-hidden="true"><rect width="64" height="64" rx="12" fill="rgba(255,255,255,.07)"/><path d="M8 64 Q10 46 32 46 Q54 46 56 64Z" fill="${kit || '#555'}"/><rect x="28" y="40" width="8" height="8" fill="${skin}"/><ellipse cx="32" cy="31" rx="15" ry="16" fill="${skin}"/>${hs}${beard}<circle cx="26" cy="31" r="1.7" fill="#14141c"/><circle cx="38" cy="31" r="1.7" fill="#14141c"/>${gl}<path d="M27 40 Q32 44 37 40" stroke="#7a2a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
}
function bar(v, cls) { return `<div class="pr-b ${cls || ''}"><i style="width:${clamp(Math.round(v), 0, 100)}%"></i></div>`; }
function attrRow(n, v) { return `<div class="pr-ar"><span>${n}</span>${bar(v, v >= 70 ? 'g' : v >= 45 ? 'a' : 'r')}<b>${Math.round(v)}</b></div>`; }
function badge(c, sz) { return badgeHTML(c, sz); }
function nextFixture() {
  if (isFund()) { const m = amNext(); if (!m) return ''; const o = amClub(m.h === G.userClubId ? m.a : m.h), home = m.h === G.userClubId; return `<div class="pr-fx">${badge(userClub(), true)}<div class="vs"><small>${home ? 'LOCAL' : 'VISITA'} · F${G.pres.fund.jor}/${AM_TOTAL}</small><b>VS</b></div>${badge(o, true)}</div><div class="center"><b>${esc(o.nombre)}</b><br><small class="muted">${esc(o.ciudad)} · media ${teamRating(o)}</small></div>`; }
  const m = userNextMatch(); if (!m) return '<p class="muted">Sin partido programado.</p>';
  const opp = concacafTeam(m.h === G.userClubId ? m.a : m.h), home = m.h === G.userClubId, u = userClub(); const pr = matchProb(u, opp, home);
  const comp = G.matchMode === 'cup' ? 'COPA PRESIDENTE' : G.matchMode === 'centro' ? 'COPA CENTROAMERICANA' : G.matchMode === 'concacaf' ? 'CONCACAF' : 'FECHA ' + G.jornadaActual;
  return `<div class="pr-fx">${badge(u, true)}<div class="vs"><small>${comp} · ${home ? 'LOCAL' : 'VISITA'}</small><b>VS</b></div>${badge(opp, true)}</div><div class="center"><b>${esc(opp.nombre)}</b><br><small class="muted">${esc(opp.ciudad)} · media ${teamRating(opp)}</small></div><div class="center" style="margin-top:6px"><span class="pill good">G ${pr.win}%</span> <span class="pill">E ${pr.draw}%</span> <span class="pill bad">P ${pr.loss}%</span></div>`;
}
function miniTable() {
  const rows = isFund() ? amTable() : sortedDivision(userClub().nivel);
  const pos = rows.findIndex(c => c.id === G.userClubId);
  const pick5 = rows.slice(0, 5).concat(pos >= 5 ? [rows[pos]] : []);
  return `<div class="pr-mt">${pick5.map(c => `<div class="${c.id === G.userClubId ? 'me' : ''}"><span>${rows.indexOf(c) + 1}</span><em>${esc(c.nombre)}</em><b>${c.tabla.pts}</b></div>`).join('')}</div>`;
}
function alertList() {
  const s = S(), a = [];
  if (!s.dt) a.push(['red', '🧑‍🏫', 'No tienes director técnico. Un interino dirige y el rendimiento cae.', 'tecnico']);
  else { if (s.dt.satisf < 35) a.push(['red', '😤', `${s.dt.nombre.split(' ').slice(-1)[0]} está molesto (${Math.round(s.dt.satisf)}%).`, 'tecnico']); if (s.dt.contrato <= 1) a.push(['amber', '📄', `Contrato del DT: ${s.dt.contrato} campaña(s).`, 'tecnico']); }
  const vac = STAFF_ORDER.filter(r => !s.staff[r]).length; if (vac >= 5) a.push(['amber', '🧩', `${vac} puestos del cuerpo técnico vacíos.`, 'tecnico']);
  STAFF_ORDER.forEach(r => { const p = s.staff[r]; if (p && p.contrato <= 1) a.push(['amber', STAFF_ROLES[r].icon, `${STAFF_ROLES[r].nombre}: contrato por vencer.`, 'tecnico']); });
  if (root.ECO && ECO.pending()) a.push(['amber', '📬', 'La directiva espera tu decisión.', 'inversiones']);
  if (G.budget < 0) a.push(['red', '💸', `Caja en rojo (${money(G.budget)}): los socios se inquietan.`, 'finanzas']);
  if ((G.inboxOffers || []).length) a.push(['green', '📨', `${G.inboxOffers.length} oferta(s) por tus jugadores.`, 'despacho']);
  if (s.cantera && s.cantera.jugadores.some(p => p.edad >= 18)) a.push(['green', '🌱', 'Hay canteranos listos para subir.', 'cantera']);
  (s.promesas || []).filter(p => !p.hecha && !p.fallida && p.limite - (p.edad || 0) <= 1).forEach(p => a.push(['amber', '⏳', 'Promesa por vencer: ' + p.desc, 'despacho']));
  if (!a.length) a.push(['green', '✅', 'Todo en orden. Buen trabajo, presidente.', null]);
  return a;
}
function sig() { try { return JSON.stringify([AV3D.ensure().eq, AV3D.ensure().look, G.pres && G.pres.dt && G.pres.dt.id, G.userClubId]); } catch (e) { return ''; } }

/* ---------- DESPACHO ---------- */
function renderDespacho() {
  const s = S(), u = userClub(), host = $('despacho-panel'); if (!host || !s) return;
  const fund = isFund(), rows = fund ? amTable() : sortedDivision(u.nivel), pos = rows.findIndex(c => c.id === G.userClubId) + 1, sg = financeSignal();
  const dt = s.dt, al = alertList(), edge = Math.round((dtEdgeValue()) * 1000) / 10;
  const camp = G.pres.camp; const lvlName = fund ? 'Liga Amateur' : DIV_NAMES[u.nivel];
  host.innerHTML = `
  <div class="pr-hero">
    <div class="pr-hero-3d" id="pr-stage"><div class="av-canvas"><div class="av-loading">⚽ Cargando tu despacho 3D…</div></div><div class="av-hint">Arrastra para girar · toca para celebrar</div></div>
    <div class="pr-hero-info">
      <div class="pr-club">${badge(u)}<div><div class="pr-eyebrow">${fund ? 'CLUB FUNDADO POR TI' : 'PRESIDENCIA'}</div><h2>${esc(u.nombre)}</h2><small>${esc(G.managerName)} · ${esc(lvlName)} · ${pos}° lugar</small></div></div>
      <div class="pr-kpis">
        <div class="k"><small>Caja</small><b class="${G.budget < 0 ? 'red' : 'green'}">${money(G.budget)}</b></div>
        <div class="k"><small>Próx. 3 fechas</small><b class="${sg.total >= 0 ? 'green' : 'red'}">${sg.total >= 0 ? '+' : ''}${money(sg.total)}</b></div>
        <div class="k"><small>Apoyo socios</small><b>${Math.round(G.confianza)}%</b>${bar(G.confianza, G.confianza >= 50 ? 'g' : G.confianza >= 30 ? 'a' : 'r')}</div>
        <div class="k"><small>Mandato</small><b>${fund ? 'Fundador' : s.cargo.restantes + ' camp.'}</b></div>
      </div>
      <div class="pr-hero-btns"><button class="btn btn-p" onclick="PRES.play()">▶ ${fund ? 'Jugar fecha' : 'Jugar jornada'}</button><button class="btn" onclick="switchView('probador')">👔 Probador</button><button class="btn" onclick="PRES.openMandato()">🏛 Mandato</button></div>
    </div>
  </div>
  <div class="pr-grid">
    <section class="pr-card"><h3>🔔 Alertas</h3>${al.map(a => `<div class="pr-al ${a[0]}" ${a[3] ? `onclick="switchView('${a[3]}')"` : ''}><span>${a[1]}</span>${esc(a[2])}</div>`).join('')}</section>
    <section class="pr-card"><h3>⚽ ${fund ? 'Próxima fecha amateur' : 'Próximo partido'}</h3>${nextFixture()}${fund ? '' : ''}<div class="center" style="margin-top:8px"><button class="btn btn-p btn-sm" onclick="PRES.play()">▶ ${fund ? 'Jugar' : 'Ir al partido'}</button></div></section>
    <section class="pr-card"><h3>🧑‍🏫 Dirección deportiva</h3>${dt ? `<div class="pr-dtmini">${faceSVG(dt.id, u.color, 54)}<div><b>${esc(dt.nombre)}</b><br><small>${esc(dt.estilo)} · ${stars5(ovrStars(dtOvr(dt)))}</small></div></div><div class="pr-edge ${edge >= 0 ? 'g' : 'r'}">Efecto en el campo: <b>${edge >= 0 ? '+' : ''}${edge}%</b></div>` : '<p class="red">Sin DT titular.</p>'}<div class="pr-staffrow">${STAFF_ORDER.map(r => `<span class="${s.staff[r] ? 'on' : ''}" title="${STAFF_ROLES[r].nombre}">${STAFF_ROLES[r].icon}</span>`).join('')}</div><div class="center" style="margin-top:8px"><button class="btn btn-sm" onclick="switchView('tecnico')">Gestionar cuerpo técnico</button></div></section>
    <section class="pr-card"><h3>🏆 ${fund ? 'Liga Amateur' : 'Tu división'}</h3>${miniTable()}</section>
    <section class="pr-card"><h3>💰 Finanzas</h3><div class="finance-strip">${financeProjection(3).map((x, i) => `<div class="finance-card ${x.net >= 0 ? 'good' : x.net >= -15000 ? 'mid' : 'bad'}"><b>F${(fund ? s.fund.jor : G.jornadaActual) + i}</b><br><span class="${x.net >= 0 ? 'green' : 'red'}">${x.net >= 0 ? '+' : ''}${money(x.net)}</span></div>`).join('')}</div><hr class="sep"><div class="panel-title" style="font-size:9px">📨 Ofertas</div>${renderInboxOffers()}</section>
    <section class="pr-card"><h3>🌱 Cantera</h3><div class="pr-cmini"><b>Nivel ${s.cantera.nivel}</b> · ${s.cantera.jugadores.length} juvenil(es)</div>${s.cantera.jugadores.slice().sort((a, b) => b.potencial - a.potencial).slice(0, 3).map(p => `<div class="pr-cp"><span>${esc(p.nombre)}</span><small>${p.posicion} · ${p.edad}a · ${p.scouted ? potStars(p) : '?'}</small></div>`).join('') || '<p class="muted">Aún sin juveniles. La primera camada llega al cierre de temporada.</p>'}<div class="center" style="margin-top:8px"><button class="btn btn-sm" onclick="switchView('cantera')">Abrir academia</button></div></section>
    ${camp ? `<section class="pr-card"><h3>🗳 Campaña electoral</h3><p>Intención de voto: <b>${Math.round(camp.apoyo)}%</b></p><button class="btn btn-sm" onclick="PRES.openCampaign()">Abrir campaña</button></section>` : ''}
    <section class="pr-card wide"><h3>📰 Últimas noticias</h3>${G.noticias.filter(n => n.x).slice(0, 6).map(n => `<div class="news ${n.t}"><span class="tag amber">${esc(n.cat || 'club')}</span> <span class="muted">J${n.j}</span> ${esc(n.x)}</div>`).join('') || '<p class="muted">Sin novedades.</p>'}</section>
  </div>`;
  if (root.AV3D) AV3D.mountStage($('pr-stage'));
}

/* ---------- PROBADOR ---------- */
function renderProbador() { const h = $('probador-panel'); if (!h) return; h.innerHTML = '<div class="panel-title">👔 Tu imagen de presidente</div><div id="av-host"></div>'; if (root.AV3D) AV3D.resetTab(), AV3D.wardrobe($('av-host')); }
function afterCarrera() { const h = $('av-host'); if (h && root.AV3D) { AV3D.resetTab(); AV3D.wardrobe(h); } }
function avatarInCarrera() { return !!(root.AV3D && AV3D.webglOK()); }

/* ---------- CUERPO TÉCNICO ---------- */
function setTecTab(t) { TEC_TAB = t; renderTecnico(); }
function setStaffPick(r) { STAFF_PICK = r; renderTecnico(); }
function willBadge(w) { return w === 'si' ? '<span class="tag green">INTERESADO</span>' : w === 'caro' ? '<span class="tag amber">PIDE +30%</span>' : '<span class="tag red">RECHAZA</span>'; }
function dtCard(d, cand) {
  const u = userClub(), ovr = dtOvr(d), w = cand ? willing(ovr) : 'si', wk = cand ? Math.round(dtWage(d) * (w === 'caro' ? 1.3 : 1) / 10) * 10 : d.sueldoSem;
  return `<article class="pr-person">${faceSVG(d.id, u.color, 72)}<div class="pr-pbody"><h4>${esc(d.nombre)} ${d.apodo ? '<small>“' + esc(d.apodo) + '”</small>' : ''}</h4><small class="muted">${d.edad} años · ${esc(d.nac)} · ${esc(d.estilo)} · pref. ${d.formPref}</small><div class="stars">${stars5(ovrStars(ovr))} <small>(${ovr})</small></div>
  ${attrRow('Táctica', d.tactico)}${attrRow('Motivación', d.motivador)}${attrRow('Disciplina', d.disciplina)}${attrRow('Cantera', d.cantera)}
  <div class="pr-pfoot"><span>${money(wk)}<small>/fecha</small></span>${cand ? willBadge(w) : `<span class="muted">${d.contrato} camp. · 😊 ${Math.round(d.satisf)}%</span>`}</div>
  <div class="pr-pbtn">${cand ? `<button class="btn btn-p btn-sm" ${w === 'no' || S().dt ? 'disabled' : ''} onclick="PRES.hireDT('${d.id}',1)">1 temporada</button><button class="btn btn-sm" ${w === 'no' || S().dt ? 'disabled' : ''} onclick="PRES.hireDT('${d.id}',2)">2 temporadas (−8%)</button>` : `<button class="btn btn-sm" onclick="PRES.renewDT()">✍ Renovar</button><button class="btn btn-d btn-sm" onclick="PRES.confirmFireDT()">🚪 Despedir</button>`}</div></div></article>`;
}
function staffCard(p, rol, cand) {
  const R = STAFF_ROLES[rol], u = userClub(), w = cand ? willing(p.nivel, true) : 'si', wk = cand ? Math.round(staffWage(p) * (w === 'caro' ? 1.3 : 1) / 10) * 10 : p.sueldoSem;
  return `<article class="pr-person sm">${faceSVG(p.id, '#4b5563', 56)}<div class="pr-pbody"><h4>${R.icon} ${esc(p.nombre)}</h4><small class="muted">${p.edad} años · ${esc(p.nac)}</small><div class="stars">${stars5(p.nivel)}</div><small class="pr-fx2">${R.fx(p.nivel)}</small>
  <div class="pr-pfoot"><span>${money(wk)}<small>/fecha</small></span>${cand ? willBadge(w) : `<span class="muted">${p.contrato} camp.</span>`}</div>
  <div class="pr-pbtn">${cand ? `<button class="btn btn-p btn-sm" ${w === 'no' || S().staff[rol] ? 'disabled' : ''} onclick="PRES.hireStaff('${rol}','${p.id}')">Contratar</button>` : `<button class="btn btn-sm" onclick="PRES.renewStaff('${rol}')">✍ Renovar</button><button class="btn btn-d btn-sm" onclick="PRES.confirmFireStaff('${rol}')">Rescindir</button>`}</div></div></article>`;
}
function renderTecnico() {
  const h = $('tecnico-panel'), s = S(); if (!h || !s) return; ensureCandidates();
  const tabs = [['equipo', 'Mi equipo técnico'], ['dt', 'Buscar DT'], ['staff', 'Contratar personal']];
  let body = '';
  const pay = payroll();
  if (TEC_TAB === 'equipo') {
    body = `<div class="pr-sec">Director técnico</div>` + (s.dt ? dtCard(s.dt, false) : `<div class="pr-empty"><b>Sin director técnico</b><p>Juega un interino sin ninguna ventaja táctica.</p><button class="btn btn-p" onclick="PRES.setTecTab('dt')">Buscar DT</button></div>`)
      + `<div class="pr-sec">Personal técnico</div><div class="pr-cards">${STAFF_ORDER.map(r => s.staff[r] ? staffCard(s.staff[r], r, false) : `<article class="pr-person sm empty"><div class="pr-pbody"><h4>${STAFF_ROLES[r].icon} ${STAFF_ROLES[r].nombre}</h4><small class="muted">${STAFF_ROLES[r].desc}</small><div class="pr-pbtn"><button class="btn btn-sm" onclick="PRES.setStaffPick('${r}');PRES.setTecTab('staff')">Contratar</button></div></div></article>`).join('')}</div>`;
  } else if (TEC_TAB === 'dt') {
    body = `<div class="pr-sec">Candidatos a DT <small class="muted">(se renuevan cada campaña)</small></div>${s.dt ? '<p class="amber">Ya tienes DT. Para contratar a otro, despídelo primero (costo de indemnización).</p>' : ''}<div class="pr-cards">${s.cand.dts.slice().sort((a, b) => dtOvr(b) - dtOvr(a)).map(d => dtCard(d, true)).join('')}</div>`;
  } else {
    body = `<div class="pr-chips">${STAFF_ORDER.map(r => `<button class="${STAFF_PICK === r ? 'on' : ''}" onclick="PRES.setStaffPick('${r}')">${STAFF_ROLES[r].icon} ${STAFF_ROLES[r].nombre}</button>`).join('')}</div><p class="muted">${STAFF_ROLES[STAFF_PICK].desc}</p>${s.staff[STAFF_PICK] ? '<p class="amber">Ya tienes a alguien en este puesto.</p>' : ''}<div class="pr-cards">${(s.cand.staff[STAFF_PICK] || []).map(p => staffCard(p, STAFF_PICK, true)).join('') || '<p class="muted">Sin candidatos.</p>'}</div>`;
  }
  h.innerHTML = `<div class="pr-head"><div><div class="panel-title">🧑‍🏫 Cuerpo técnico</div><small class="muted">Tú eliges a quién manda en el campo. Costo semanal total: <b class="amber">${money(pay)}</b>/fecha · Efecto del DT y staff: <b>${dtEdgeValue() >= 0 ? '+' : ''}${Math.round(dtEdgeValue() * 1000) / 10}%</b></small></div></div><div class="pr-tabs">${tabs.map(t => `<button class="${TEC_TAB === t[0] ? 'on' : ''}" onclick="PRES.setTecTab('${t[0]}')">${t[1]}</button>`).join('')}</div>${body}`;
}

/* ---------- CANTERA ---------- */
function prospectCard(p) {
  const u = userClub(), pot = p.scouted ? p.potencial : '?';
  return `<article class="pr-person sm">${faceSVG(p.id, u.color, 56)}<div class="pr-pbody"><h4>${esc(p.nombre)}</h4><small class="muted">${p.posicion} · ${p.edad} años · ${esc(p.personalidad)}</small><div class="pr-pot"><span>Media <b>${p.media}</b></span><span>Potencial <b>${pot}</b> ${p.scouted ? '<small class="gold">' + potStars(p) + '</small>' : ''}</span></div>${bar(p.media / (p.scouted ? p.potencial : 90) * 100, 'g')}<div class="pr-pfoot"><span>${money(p.salario)}<small>/fecha</small></span>${p.edad >= 18 ? '<span class="tag green">LISTO</span>' : '<span class="muted">formándose</span>'}</div>
  <div class="pr-pbtn"><button class="btn btn-p btn-sm" onclick="PRES.promote('${p.id}')">⬆ Subir al primer equipo</button>${p.scouted ? '' : `<button class="btn btn-sm" onclick="PRES.evalProspect('${p.id}')">🔎 Evaluar ($1,200)</button>`}<button class="btn btn-d btn-sm" onclick="PRES.releaseProspect('${p.id}')">Liberar</button></div></div></article>`;
}
function renderCantera() {
  const h = $('cantera-panel'), s = S(); if (!h || !s) return; const c = s.cantera;
  h.innerHTML = `<div class="pr-head"><div><div class="panel-title">🌱 Academia · nivel ${c.nivel}/5</div><small class="muted">Cada cierre de temporada llega una camada. ${lvl('jefeCantera') ? '' : 'Sin director de cantera: pocas promesas. '}Mantenimiento: ${money(Math.round(c.nivel * 260 * LVF[lvlN()] / 10) * 10)}/fecha.</small></div>${c.nivel < 5 ? `<button class="btn btn-p btn-sm" onclick="PRES.upgradeCantera()">⬆ Mejorar academia · ${money(canteraUpgCost())}</button>` : '<span class="tag green">NIVEL MÁXIMO</span>'}</div>
  <div class="pr-kpis" style="margin:8px 0"><div class="k"><small>Juveniles</small><b>${c.jugadores.length}/14</b></div><div class="k"><small>Camadas</small><b>${(c.hist || []).length}</b></div><div class="k"><small>Mejor promesa</small><b>${c.jugadores.length ? Math.max.apply(null, c.jugadores.map(p => p.scouted ? p.potencial : 0)) || '?' : '—'}</b></div><div class="k"><small>Director</small><b>${s.staff.jefeCantera ? stars5(s.staff.jefeCantera.nivel) : 'vacante'}</b></div></div>
  ${c.jugadores.length ? '<div class="pr-cards">' + c.jugadores.slice().sort((a, b) => b.media - a.media).map(prospectCard).join('') + '</div>' : '<div class="pr-empty"><b>La academia está vacía</b><p>La primera camada llega al terminar la temporada. Mejora la academia y contrata un director de cantera para atraer más talento.</p></div>'}
  ${(c.hist || []).length ? '<div class="pr-sec">Historial de camadas</div>' + c.hist.map(x => `<div class="pr-cp"><span>Temporada ${x.t}</span><small>${x.n} ingresos · potencial máx. ${x.mejor}</small></div>`).join('') : ''}`;
}

/* ---------- LIGA AMATEUR ---------- */
function renderLigaAm() {
  const h = $('ligaam-panel'); if (!h || !isFund()) { if (h) h.innerHTML = '<p class="muted">Ya compites en el sistema profesional.</p>'; return; }
  const f = G.pres.fund, t = amTable(), u = userClub();
  h.innerHTML = `<div class="pr-head"><div><div class="panel-title">🏆 Liga Amateur · temporada ${f.temporada}</div><small class="muted">8 equipos · 14 fechas · el campeón asciende a Tercera División.</small></div><div><button class="btn btn-p" onclick="PRES.play()">▶ Jugar fecha ${Math.min(f.jor, AM_TOTAL)}</button> <button class="btn btn-sm" onclick="PRES.amPlay(3)">⏩ 3 fechas</button></div></div>
  <div class="pr-split"><div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Club</th><th class="center">PJ</th><th class="center">G</th><th class="center">E</th><th class="center">P</th><th class="center">DG</th><th class="center">Pts</th></tr></thead><tbody>${t.map((c, i) => `<tr class="${c.id === G.userClubId ? 'me' : ''} ${i === 0 ? 'top' : ''}"><td>${i + 1}</td><td>${esc(c.nombre)}</td><td class="center">${c.tabla.pj}</td><td class="center">${c.tabla.pg}</td><td class="center">${c.tabla.pe}</td><td class="center">${c.tabla.pp}</td><td class="center">${c.tabla.dg}</td><td class="center"><b>${c.tabla.pts}</b></td></tr>`).join('')}</tbody></table></div>
  <div><div class="pr-card"><h3>Próxima fecha</h3>${nextFixture()}${f.last ? `<hr class="sep"><small class="muted">Última: F${f.last.jor} ${f.last.ugf}-${f.last.uga} vs ${esc(f.last.opp)} (${f.last.net >= 0 ? '+' : ''}${money(f.last.net)})</small>` : ''}</div>
  <div class="pr-card"><h3>Reglas del barrio</h3><small class="muted">Ingresos por fecha: subsidio de la alcaldía $7,000 + taquilla de local + patrocinador (firma uno en Finanzas, aquí rinde 45%). Tu media: <b>${teamRating(u)}</b>. Campeones previos: ${(f.hist || []).map(x => esc(x.champ)).join(', ') || '—'}.</small></div></div></div>`;
}

/* ---------- INTRO, BIENVENIDA, MENÚ ---------- */
function introHook() {
  const intro = $('intro'); if (!intro) return; if (!$('pr-modes')) { const box = document.createElement('div'); box.id = 'pr-modes'; box.className = 'pr-modes'; const h1 = intro.querySelector('h1'); if (h1) h1.insertAdjacentElement('afterend', box); }
  renderModes();
}
function renderModes() {
  const box = $('pr-modes'); if (!box) return;
  box.innerHTML = [['dt', '🧑‍🏫', 'Director técnico', 'Dirige a un club: táctica, entrenos y fichajes. Puedes llegar a presidente.'], ['pres', '🏛', 'Presidente', 'Elige un club y contrata DT y cuerpo técnico. Tú mandas; no tocas la pizarra.'], ['fund', '🌱', 'Fundar un club', 'Nace desde cero en la liga amateur y asciende a Tercera.']].map(m => `<button class="pr-mode ${MODE === m[0] ? 'on' : ''}" onclick="PRES.pickMode('${m[0]}')"><span>${m[1]}</span><b>${m[2]}</b><small>${m[3]}</small></button>`).join('');
  const fund = MODE === 'fund'; ['intro-divs', 'club-grid'].forEach(id => { const e = $(id); if (e) e.style.display = fund ? 'none' : ''; });
  const btn = document.querySelector('#intro button[onclick="promptDT()"]'); if (btn) btn.textContent = fund ? '🌱 Fundar mi club' : MODE === 'pres' ? '🏛 Ser presidente de este club' : '▶ Empezar con el club seleccionado';
}
function pickMode(m) { MODE = m; renderModes(); }
function newGameHook(m) {
  if (m === 'fund') { foundHook(); }
  else if (m === 'pres') { newPres('existente'); G.pres.dt = interimDT(); G.salarioDT = dietaValue(); G.reputacion = Math.max(G.reputacion, 55); }
  else { G.rol = 'DT'; }
  try { if (root.AV3D) AV3D.ensure(); } catch (e) { }
}
function welcome() {
  if (!isPres()) return false;
  const fund = isFund(), u = userClub();
  openModal(`<div class="modal-title">${fund ? '🌱 ¡Nace ' + esc(u.nombre) + '!' : '🏛 Bienvenido, presidente'}</div>
  <p>${fund ? `Fundaste un club en <b>${esc(u.ciudad)}</b>. Competirás en la <b>Liga Amateur</b>; si eres campeón, ascenderás a <b>Tercera División</b>.` : `Presides a <b>${esc(u.nombre)}</b> (${DIV_NAMES[u.nivel]}).`}</p>
  <div class="pr-msgs"><div>🧑‍🏫 <b>No dirigirás</b> los partidos: contratas un director técnico y su cuerpo (fisio, preparador, ojeador, analista, psicólogo…).</div><div>💰 Tú cuidas la caja, el estadio, los patrocinadores y el apoyo de los socios.</div><div>🌱 La <b>cantera</b> te da talento joven cada temporada.</div><div>👔 Tu dieta alimenta la billetera con la que vistes a tu personaje en 3D.</div></div>
  <p class="muted">Ya te dejamos un DT interino. Revisa si te conviene cambiarlo.</p>
  <div class="center" style="margin-top:12px"><button class="btn btn-p" onclick="closeModal();switchView('tecnico')">🧑‍🏫 Ver cuerpo técnico</button> <button class="btn" onclick="closeModal();switchView('despacho')">Ir al despacho</button></div>`);
  return true;
}
function electionCard() {
  if (!G || G.rol === 'presidente') return '';
  const el = eligible(), camp = G.pres && G.pres.camp;
  return `<div class="panel-title">🗳 Camino a la presidencia</div><div class="offer">${camp ? `Estás en campaña en <b>${esc(userClub().nombre)}</b>: intención de voto <b>${Math.round(camp.apoyo)}%</b>. <button class="btn btn-p btn-sm" onclick="PRES.openCampaign()">Abrir campaña</button>` : `Con buena reputación y trayectoria podrás postularte a presidente del club. ${el.ok ? '<b class="green">¡Ya cumples los requisitos!</b>' : '<span class="muted">' + (el.checks || []).map(c => (c[0] ? '✓ ' : '✗ ') + c[1]).join(' · ') + (el.why ? el.why : '') + '</span>'} <button class="btn ${el.ok ? 'btn-p' : ''} btn-sm" onclick="PRES.openElections()">Ver elecciones</button>`}</div><hr class="sep">`;
}
/* v2.8: mudanza de país / club nuevo en otro país */
function relocateHook(role, sal) {
  const fresh = () => ({ nivel: 1, jugadores: [], hist: [], ult: null, upg: 0 });
  if (role === 'PRES') {
    newPres('regional'); const s = G.pres; s.cantera = fresh(); s.promesas = []; s.fund = null; s.camp = null; s.lastLoss = null; s.exDT = false;
    G.rol = 'presidente'; s.dt = interimDT(); G.salarioDT = dietaValue(); ensureCandidates(true); G.reputacion = Math.max(G.reputacion || 50, 55);
  } else {
    G.rol = 'DT';
    if (G.pres) { G.pres.dt = null; G.pres.camp = null; G.pres.fund = null; G.pres.cantera = fresh(); G.pres.promesas = []; }
  }
}
function menuItems() { return `<button class="btn" onclick="PRES.toggleSkin()">🎨 Tema: ${skinOn() ? 'Palco → Retro' : 'Retro → Palco'}</button>`; }
function onLoad() { migrate(); ensureViews(); chrome(); }
const API = { payroll, injuryChance, edgeFor, beforePlay, autoPrepare, liveHook, afterMatchday, endSeasonHook, migrate, onLoad, onSwitch, redirect, introHook, pickMode, mode, newGameHook, welcome, electionCard, menuItems, toggleSkin, chrome, go, play, afterCarrera, avatarInCarrera,
  hireDT, fireDT, renewDT, hireStaff, fireStaff, renewStaff, confirmFireDT, confirmFireStaff, setDieta, _do, setTecTab, setStaffPick, upgradeCantera, promote, releaseProspect, evalProspect,
  startCampaign, campAction, promesaToggle, cancelCampaign, openCampaign, openElections, openMandato, afterElection, openFoundation, formSet, formPreview, foundNext, foundGo, amPlay,
  isPres, isFund, S, newPres, interimDT, ensureCandidates, dtEdgeValue, dtOvr, dtDecide, eligible, amTable, voteResult, canteraSeasonEnd, newCamada, dietaValue, fundPromote, renderDespacho, renderTecnico, renderCantera, renderLigaAm, renderProbador, ensureViews, relocateHook };
root.PRES = API;
})(typeof window !== 'undefined' ? window : globalThis);
