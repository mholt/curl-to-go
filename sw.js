var CACHE = "v1:static"

var filesToCache = [
    './',
    'resources/js/jquery.min.js',
    'resources/js/highlight.pack.js',
    'resources/js/common.js',
    'https://mholt.github.io/json-to-go/resources/js/json-to-go.js',
    'resources/js/curl-to-go.js',
    'resources/js/gofmt.js',
    'resources/css/color-brewer.css',
    'resources/css/common.css'
]

self.addEventListener('install', function (evt) {
    console.log('Attempting service worker installation.');

    // Wait until promise resolves
    evt.waitUntil(precache());
});

// On fetch, return from cache
self.addEventListener('fetch', function (evt) {
    evt.respondWith(fromCache(evt.request));
});

// Opens cache and loads filesToCache into cache
// for using them in future
function precache() {
    return caches.open(CACHE).then(function (cache) {
        return cache.addAll(filesToCache);
    });
}

// When a resource is requested respond only from service worker.
// This strategy is cache first.
function fromCache(request) {
    return caches.open(CACHE).then(function (cache) {
        return cache.match(request).then(function (matching) {
            return matching || fetch(request);
        }).catch(console.error);
    });
}