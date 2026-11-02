/* Retro Football Manager SV — PWABuilder-safe Service Worker with audio + video range support */
const CACHE_VERSION = 'rfm-sv-pwabuilder-safe-v6-fmsv';
const MUSIC_CACHE = 'rfm-music-offline-v4';
const INTRO_CACHE = 'rfm-intro-offline-v1';
const AVATAR_CACHE = 'rfm-avatar-3d-v1';
const SCOPE_PATH = '/fm-sv/';

const APP_SHELL = [
  SCOPE_PATH,
  SCOPE_PATH + 'index.html',
  SCOPE_PATH + 'manifest.json',
  SCOPE_PATH + 'icon-512.png',
  SCOPE_PATH + 'intro.mp4',
  SCOPE_PATH + 'dt-avatar.glb',
  SCOPE_PATH + 'flyer-cibernetica.png',
  SCOPE_PATH + 'flyer-wallet.png',
  SCOPE_PATH + 'flyer-fmsv.png'
];

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
      .filter(k => k !== CACHE_VERSION && k !== MUSIC_CACHE && k !== INTRO_CACHE && k !== AVATAR_CACHE)
      .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

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
    if (cached) return cached;
    const fallback = await cache.match(SCOPE_PATH + 'index.html') || await cache.match(SCOPE_PATH);
    if (fallback) return fallback;
    return new Response('Retro Football Manager SV no está disponible sin conexión todavía.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // CRÍTICO: no interceptar requests de redes de ads (Monetag/PropellerAds/Adsterra/etc).
  // Si los bloqueamos, los anuncios no se muestran y no se generan ingresos.
  try {
    const url = new URL(request.url);
    const AD_HOSTS = ['3nbf4.com','propellerads.com','hilltopads.com','exoclick.com','adsterra.com','googleadservices.com','doubleclick.net'];
    if (AD_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
      return; // dejar que la red.handle normal lo sirva
    }
  } catch (e) {}

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

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).catch(() => new Response('', { status: 204 })))
  );
});
