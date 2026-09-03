// バーコードスキャナー用 Service Worker
// このページ自体(HTML1ファイルに全て内蔵)をキャッシュし、
// 電波が無い状態でも開けるようにする。

var CACHE_NAME = "barcode-scanner-cache-v1";
var APP_SHELL = [
  "./",
  "./barcode_scanner.html"
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// キャッシュ優先。オンライン時は裏で最新版を取得してキャッシュを更新しておく。
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var networkFetch = fetch(event.request)
        .then(function (response) {
          if (response && response.ok && response.type === "basic") {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return cached; // オフライン時はキャッシュにフォールバック
        });

      return cached || networkFetch;
    })
  );
});
