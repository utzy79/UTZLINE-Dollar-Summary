// UTZLINE $ Summary offline service worker.
//
// This is a NEW, SEPARATE, standalone app in the UTZLINE family --
// requested directly by Andrew (2026-09-26): "lets build a $ summary
// app, this can show month by month dollar values per project, forecasts
// and delivered / installed. with an export to excel button for selected
// months. this can project 12 months ahead of todays date." It sits
// alongside every other sibling app (Site Measure, Viewer, Install/
// Manufacture/Delivery ITP, Projects, Scheduler, Machine Schedule, Solid
// Surface Schedule) -- its own manifest, own icon (gold/money, the one
// accent hue not already used by a sibling), own cache namespace
// ("utzline-dollar-summary-cache-*").
//
// v1 (2026-09-26): first release, built entirely against PLACEHOLDER
// SAMPLE DATA (see index.html's own top-of-file comment for the full
// design note) -- Andrew explicitly chose to build now rather than wait
// for a real `dollarValue` field to land on joinery items in UTZLINE
// Projects (still queued, unbuilt, as NEXT_RUN_NOTES.md item 14). Home
// screen lists every sample project with its total contract value,
// Builder and Project Manager; "All projects" gives a combined view with
// a company-wide monthly total and a per-project breakdown table; each
// project has its own drill-down with a 12-month (computed dynamically
// from today, never hardcoded) Forecast / Delivered (75%) / Installed
// (100%) monthly table and chart; both the combined and per-project
// screens have a month-tickbox picker and an "Export selected months to
// Excel" button (SheetJS, vendored locally at vendor/xlsx.full.min.js,
// entirely client-side).
//
// Chart is a hand-rolled inline SVG multi-line chart (no charting
// library, consistent with this family's vendor-everything-locally
// convention), built per the dataviz skill's procedure: 3 categorical
// series in the skill's own fixed slot order (blue=Forecast, orange=
// Delivered, aqua=Installed), palette validated with
// scripts/validate_palette.js against this app's own dark chart surface
// before use, 2px lines with round joins, >=8px ringed markers, hairline
// recessive gridlines, a legend with line-key swatches (never boxes), and
// a crosshair + one-tooltip-for-all-3-series hover layer.
//
// Same cache-first app shell strategy as every sibling app: a small,
// fixed set of local files (including the vendored SheetJS library), no
// CDN calls once installed. Bump CACHE_NAME whenever index.html or any
// vendored asset changes, so installed copies pick up the update instead
// of serving stale files forever.
//
// Does NOT touch source.html, Site Measure, Viewer, Install ITP,
// Manufacture ITP, Delivery ITP, Projects, Scheduler, Machine Schedule,
// or Solid Surface Schedule in any way -- this app only ever reads
// nothing from them yet (placeholder data), and will only ever be
// READ-ONLY against the shared Projects-root folder once real-data
// integration is built.
var ICON_VERSION = "v1";
var CACHE_NAME = "utzline-dollar-summary-cache-v1";

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json?v=" + ICON_VERSION,
  "./vendor/xlsx.full.min.js",
  "./icons/icon-192.png?v=" + ICON_VERSION,
  "./icons/icon-512.png?v=" + ICON_VERSION,
  "./icons/icon-192-maskable.png?v=" + ICON_VERSION,
  "./icons/icon-512-maskable.png?v=" + ICON_VERSION
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_URLS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if (response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){
        return cached;
      });
      // Cache-first for instant offline loads; refresh the cache in the
      // background whenever the network is available.
      return cached || networkFetch;
    })
  );
});
