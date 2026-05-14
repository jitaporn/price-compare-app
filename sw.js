// เปลี่ยนเลขเวอร์ชันตรงนี้ทุกครั้งที่มีการแก้โค้ด (เช่น v2, v3, v4)
const CACHE_NAME = 'price-compare-v7'; 
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    // สั่งให้ Service Worker ตัวใหม่ทำงานทันทีโดยไม่ต้องรอ
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// ดักจับ Event 'activate' เพื่อลบ Cache เวอร์ชันเก่าทิ้ง
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('ลบ Cache เก่า:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // สั่งให้ควบคุมหน้าเว็บทันที
    );
});

// ส่วนดึงข้อมูล
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // โหลดจากเน็ตก่อน ถ้าไม่มีเน็ตค่อยดึงจาก Cache (Network First, fallback to Cache)
            return fetch(event.request).catch(() => response);
        })
    );
});