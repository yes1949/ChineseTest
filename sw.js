// 定义当前缓存版本号，更新代码或数据时修改版本号可强制更新
const CACHE_NAME = 'chouka-v1.0.6';

// 需要离线缓存的文件列表
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './lunyu.txt'
];

// 1. 安装 Service Worker 并预缓存文件
self.addEventListener('install', (event) => {
    // 强制立即激活新的 Service Worker
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. 激活新版本并清理旧版本缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            // 让 Service Worker 立即接管所有已打开的页面
            return self.clients.claim();
        })
    );
});

// 3. 网络优先策略（Network First），保证数据优先从网络更新，网络失败时回退到缓存
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // 如果成功获取最新网络资源，顺便更新本地缓存
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // 网络不通（离线）时使用缓存数据
                return caches.match(event.request);
            })
    );
});
