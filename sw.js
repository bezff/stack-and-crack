/**
 * Stack & Crack - Service Worker
 * Обеспечивает работу приложения оффлайн с автоматическим обновлением
 */

// ====================================
// Версионирование
// ====================================
const APP_VERSION = '1.5.0';
const CACHE_NAME = `stack-crack-v${APP_VERSION}`;

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './effects.js',
    './version.js',
    './manifest.json',
    './assets/icon.svg'
];

// ====================================
// Установка Service Worker
// ====================================
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing version ${APP_VERSION}...`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] All assets cached');
                // Принудительно активируем новый SW
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache failed:', error);
            })
    );
});

// ====================================
// Активация Service Worker
// ====================================
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating version ${APP_VERSION}...`);
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Удаляем все кэши кроме текущей версии
                            return name.startsWith('stack-crack-') && name !== CACHE_NAME;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activated successfully');
                // Берём контроль над всеми страницами
                return self.clients.claim();
            })
            .then(() => {
                // Уведомляем все окна об обновлении
                return self.clients.matchAll({ type: 'window' });
            })
            .then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: APP_VERSION
                    });
                });
            })
    );
});

// ====================================
// Перехват запросов (Network First с Fallback)
// ====================================
self.addEventListener('fetch', (event) => {
    // Игнорируем не-GET запросы
    if (event.request.method !== 'GET') return;
    
    // Игнорируем Chrome extensions и другие схемы
    if (!event.request.url.startsWith('http')) return;
    
    // Для навигационных запросов (HTML) — Network First
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Кэшируем свежую версию
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Оффлайн — берём из кэша
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            return cachedResponse || caches.match('./index.html');
                        });
                })
        );
        return;
    }
    
    // Для остальных ресурсов — Stale While Revalidate
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Запускаем фоновое обновление
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => null);
                
                // Возвращаем кэш сразу, а в фоне обновляем
                return cachedResponse || fetchPromise;
            })
    );
});

// ====================================
// Обработка сообщений от клиента
// ====================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Skip waiting requested');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: APP_VERSION });
    }
    
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        // Принудительная проверка обновлений
        self.registration.update();
    }
    
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        // Показываем уведомление через 2 часа
        const highScore = event.data.highScore || 0;
        setTimeout(() => {
            self.registration.showNotification('Вернись побить рекорд! 🎮', {
                body: `Твой текущий рекорд: ${highScore} очков. Попробуй побить его!`,
                icon: './assets/icon-192.png',
                badge: './assets/icon-72.png',
                vibrate: [200, 100, 200],
                tag: 'stack-crack-reminder',
                renotify: true,
                requireInteraction: false
            });
        }, 2 * 60 * 60 * 1000); // 2 часа
    }
});

// ====================================
// Периодическая синхронизация (если поддерживается)
// ====================================
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-updates') {
        event.waitUntil(
            self.registration.update()
        );
    }
});

// ====================================
// Push-уведомления (на будущее)
// ====================================
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Stack & Crack', {
            body: data.body || 'Время взламывать!',
            icon: './assets/icon-192.png',
            badge: './assets/icon-72.png',
            vibrate: [100, 50, 100],
            tag: 'stack-crack-notification'
        })
    );
});

// Клик по уведомлению
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./')
    );
});
