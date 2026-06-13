const CACHE = 'wandera-farm-v1'

const PRECACHE = [
  '/',
  '/dashboard',
  '/daily',
  '/calendar',
  '/analytics',
  '/clients',
  '/sales',
  '/registry',
  '/reports',
  '/sop',
  '/help',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // For Supabase API calls — network only (never cache)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request))
    return
  }

  // For everything else: network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE).then(cache => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
