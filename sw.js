const CACHE_NAME = 'gospel-audio-cache-v2';
const PRECACHE_FILES = [
    '/Audio-Albomy/',
    '/Audio-Albomy/index.html',
    '/Audio-Albomy/manifest.json',
    '/Audio-Albomy/icon.png',
    '/Audio-Albomy/albums.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(PRECACHE_FILES).then(() => {
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => client.postMessage({ message: 'Кэширование завершено. Оффлайн-режим готов.' }));
                });
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = event.request.url;
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.mp3') || url.includes('albums.json')) {
        event.respondWith(
            caches.match(event.request).then(response => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    if (networkResponse.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    return caches.match(event.request);
                });
                return response || fetchPromise;
            })
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
        );
    }
});