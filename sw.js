/* Retro Football Manager SV — service worker v17 (ícono/manifest siempre frescos; limpia caché de imágenes vieja) */
const CACHE_VERSION = 'rfm-sv-pwabuilder-safe-v21';
const RUNTIME_CACHE = 'rfm-runtime-v2';
const MUSIC_CACHE = 'rfm-music-offline-v4';
const INTRO_CACHE = 'rfm-intro-offline-v1';
const AVATAR_CACHE = 'rfm-avatar-3d-v1';
const SCOPE_PATH = '/Retro-Football-Manager-SV/';

// Solo lo mínimo para arrancar offline. Video, avatar 3D e imágenes pesadas se guardan
// la primera vez que se usan (antes se descargaban ~15 MB de golpe al instalar).
const APP_SHELL = [
  SCOPE_PATH,
  SCOPE_PATH + 'index.html',
  SCOPE_PATH + 'manifest.json',
  SCOPE_PATH + 'icon-v3-512.png'
];
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'ajax.googleapis.com', 'www.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => Promise.all(APP_SHELL.map(url => fetch(url).then(r => r.ok ? cache.put(url, r.clone()) : null).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k !== CACHE_VERSION && k !== MUSIC_CACHE && k !== INTRO_CACHE && k !== AVATAR_CACHE && k !== RUNTIME_CACHE)
      .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isCdnRequest(request) {
  try { return CDN_HOSTS.includes(new URL(request.url).hostname); } catch (e) { return false; }
}

function isImageRequest(request) {
  try {
    const url = new URL(request.url);
    return url.origin === self.location.origin && /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
  } catch (e) { return false; }
}

// Cache-first para recursos que casi no cambian (fuentes, librerías versionadas, imágenes).
async function cacheFirstRuntime(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Recurso no disponible offline' });
  }
}

function isAudioRequest(request) {
  const url = new URL(request.url);
  return /\.(mp3|ogg|m4a|wav|aac)$/i.test(url.pathname);
}

function isVideoRequest(request) {
  const url = new URL(request.url);
  return /\.(mp4|webm|m4v|mov)$/i.test(url.pathname);
}

function isIntroVideoRequest(request) {
  try {
    const url = new URL(request.url);
    return /\/intro\.(mp4|webm|m4v|mov)$/i.test(url.pathname);
  } catch (e) {
    return false;
  }
}

function isAvatarGlbRequest(request) {
  try {
    const url = new URL(request.url);
    return /\/dt-avatar\.glb$/i.test(url.pathname) || /\.glb$/i.test(url.pathname);
  } catch (e) {
    return false;
  }
}

async function makeRangeResponse(request, response) {
  const range = request.headers.get('range');
  if (!range) return response;

  const blob = await response.blob();
  const size = blob.size;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  if (!match) return response;

  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : size - 1;

  if (Number.isNaN(start) || start < 0) start = 0;
  if (Number.isNaN(end) || end >= size) end = size - 1;
  if (start > end) {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${size}`,
        'Accept-Ranges': 'bytes'
      }
    });
  }

  const sliced = blob.slice(start, end + 1);
  return new Response(sliced, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Length': String(sliced.size),
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}

async function handleAudio(request) {
  const cache = await caches.open(MUSIC_CACHE);
  const cached = await caches.match(request, { ignoreSearch: true });
  const range = request.headers.get('range');

  // If we have the complete song cached, serve proper 206 range responses offline/online.
  if (cached && range) return makeRangeResponse(request, cached.clone());
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    // Cache only complete audio responses. Do not cache 206 partial responses.
    if (fresh && fresh.ok && fresh.status === 200) {
      cache.put(new URL(request.url).origin + new URL(request.url).pathname, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    if (cached) {
      if (range) return makeRangeResponse(request, cached.clone());
      return cached;
    }
    return new Response('', { status: 503, statusText: 'Audio unavailable offline' });
  }
}

async function handleVideo(request) {
  const cache = await caches.open(INTRO_CACHE);
  // Buscamos sólo dentro de INTRO_CACHE (no en todas las cachés) para evitar
  // confundirnos con respuestas precargadas que no son del video.
  const cleanUrl = new URL(request.url).origin + new URL(request.url).pathname;
  let cached = await cache.match(cleanUrl);
  if (!cached) cached = await cache.match(request.url);
  const range = request.headers.get('range');

  // Si ya está cacheado, lo servimos. Si piden un Range, armamos respuesta 206.
  if (cached && range) return makeRangeResponse(request, cached.clone());
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    // Solo cacheamos respuestas 200 completas (los 206 parciales no se pueden reusar como fuente).
    if (fresh && fresh.ok && fresh.status === 200) {
      cache.put(cleanUrl, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    if (cached) {
      if (range) return makeRangeResponse(request, cached.clone());
      return cached;
    }
    // No hay video disponible offline: 404 para que el <video> dispare 'error' y el JS muestre el fallback.
    return new Response('', { status: 404, statusText: 'Intro video unavailable offline' });
  }
}

async function handleAvatar(request) {
  const cache = await caches.open(AVATAR_CACHE);
  const cleanUrl = new URL(request.url).origin + new URL(request.url).pathname;
  let cached = await cache.match(cleanUrl);
  if (!cached) cached = await cache.match(request.url);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && fresh.status === 200) {
      const type = (fresh.headers.get('content-type') || '').toLowerCase();
      // Solo cacheamos si es un .glb/model (no HTML 404)
      if (type.includes('model') || type.includes('octet-stream') || type === '') {
        cache.put(cleanUrl, fresh.clone()).catch(() => {});
      }
    }
    return fresh;
  } catch (err) {
    if (cached) return cached;
    return new Response('', { status: 503, statusText: 'Avatar 3D unavailable offline' });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    // Nunca servir como "app" un documento cacheado que no sea el juego
    // (p. ej. una página de redirección o error que haya quedado en caché).
    if (cached && (request.mode !== 'navigate' || await isGameDoc(cached))) return cached;
    const fallback = await cache.match(SCOPE_PATH + 'index.html') || await cache.match(SCOPE_PATH);
    if (fallback && await isGameDoc(fallback)) return fallback;
    return new Response('Retro Football Manager SV no está disponible sin conexión todavía.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function isGameDoc(res) {
  try {
    const t = await res.clone().text();
    return t.includes('Retro Football Manager') && t.includes('id="app"');
  } catch (e) { return false; }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (isAudioRequest(request)) {
    event.respondWith(handleAudio(request));
    return;
  }

  if (isVideoRequest(request)) {
    event.respondWith(handleVideo(request));
    return;
  }

  if (isAvatarGlbRequest(request)) {
    event.respondWith(handleAvatar(request));
    return;
  }

  // v15: ícono y manifest van red-primero (antes el PNG quedaba pegado en caché para siempre)
  try {
    const iu = new URL(request.url);
    if (iu.origin === self.location.origin && /\/(icon-[^/]*\.png|manifest\.json|favicon[^/]*)$/i.test(iu.pathname)) {
      event.respondWith(networkFirst(request));
      return;
    }
  } catch (e) {}

  if (isCdnRequest(request) || isImageRequest(request)) {
    event.respondWith(cacheFirstRuntime(request));
    return;
  }

  // v1.9: three-lite.js (593 KB, versionado con ?v=) se guarda la primera vez que se usa.
  try {
    const u = new URL(request.url);
    if (u.origin === self.location.origin) {
      if (/\/three-lite\.js$/i.test(u.pathname)) { event.respondWith(cacheFirstRuntime(request)); return; }
      if (/\/(avatar3d|modo-presidente|seleccion|retos|economia|embajador|finanzas|logros80|liga-(gt|hn|cr|pa|ni)|planteles|regional|legado)\.js$/i.test(u.pathname) || /\/palco\.css$/i.test(u.pathname)) { event.respondWith(networkFirst(request)); return; }
    }
  } catch (e) {}

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).catch(() => new Response('', { status: 204 })))
  );
});
