// 轮胎仓库 Service Worker - 离线缓存
// 缓存主文件，二次打开秒开

const CACHE_NAME = 'tire-warehouse-v19';
const ASSETS = [ './', './index.html' ];

// 安装：预缓存主文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// 拦截请求：缓存优先，网络回退
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // 缓存命中：直接返回
        if (cached) return cached;

        // 缓存未命中：从网络获取
        return fetch(event.request)
          .then(response => {
            // 只缓存同源的成功响应
            if (response.ok && response.type === 'basic' && event.request.url.startsWith(self.location.origin)) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // 网络失败：尝试返回缓存的 HTML（离线兜底）
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
