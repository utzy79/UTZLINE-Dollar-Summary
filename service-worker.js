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
// v2 (2026-09-26, same day): real data + layout change. Andrew: "build
// it, but i want to change the layout of that app. all projects still
// needs to show monthly summaries of each project. month by month,
// maybe a par graph or button graph" (bar graph). SAMPLE_PROJECTS is
// gone -- this app now reads the real Projects-root folder directly
// (File System Access API, "read" mode only), the same folder every
// sibling app shares: project-meta.json, joinery-items.json, and the
// shared joinery-status.json/joinery-schedule.json event pipeline
// (folded, with a legacy flat-array fallback for a project that
// predates the event-sourced format). STRICTLY READ-ONLY -- this app
// never writes a byte back to the Projects root and never creates an
// events folder as a migration side effect, unlike UTZLINE Projects' own
// reader. The All Projects screen gained a new "Monthly summary by
// project" section (one small-multiple bar chart per project, per the
// dataviz skill's small-multiples pattern), and the chart form itself
// changed everywhere from a multi-line chart to a grouped bar chart
// (same validated categorical palette, now as fills). See index.html's
// own top-of-file comment for the full write-up.
//
// Does NOT touch source.html, Site Measure, Viewer, Install ITP,
// Manufacture ITP, Delivery ITP, Projects, Scheduler, Machine Schedule,
// or Solid Surface Schedule in any way -- this app is READ-ONLY against
// the shared Projects-root folder and writes to none of them.
//
// v3 (2026-09-27): three additions, all dictated the same day -- see
// index.html's own top-of-file comment for the full write-up.
//   1. Project detail: new this/next-month stat-tile row, and the
//      "Monthly value" chart changed from grouped bars to a genuine
//      stacked bar (Installed/Delivered/Outstanding forecast), where
//      "Outstanding forecast" is a derived, display-only quantity
//      (forecast - delivered - installed) that always sums back to the
//      plain Forecast figure -- no double-counting, the underlying
//      earned-value numbers are untouched.
//   2. All Projects: the company-wide chart replaced with a wide
//      backdrop bar per month (company-wide forecast) plus each active
//      project's own forecast overlaid inside it as a narrower bar, all
//      in this app's single gold accent colour (identity via position/
//      tooltip, not a per-project palette -- a per-project palette
//      would fail this app's own colorblind-safety validator past 3
//      simultaneous projects in one month, and project count here is
//      unbounded).
//   3. Home screen: each project row now shows a "Next 3 months
//      forecast" line (a rolling window from today).
// Bump CACHE_NAME whenever index.html or any vendored asset changes, so
// installed copies pick up the update instead of serving stale files
// forever.
var ICON_VERSION = "v1";
// v4 (2026-09-27): "Schedule Backups" folder hidden from the project list.
// v5 (2026-09-29): RC 1.0 -- the release tag on the logo; now also a Windows desktop app (UTZLINE Dollar Summary Setup RC 1.0.exe).
// v6 (2026-09-30): RC 1.0 -- event layout v2: status / schedule / cut / completion / cutting file / note records are one folder per LEVEL (Project Saves/UTZLINE Events/<branch>/<Level>/); old per-item folders are still read.
// v7 (2026-09-30): RC 1.0 -- change-folder button.
// v8 (2026-09-30): RC 1.0 -- shop drawings = 10% in the month they were sent, day / night mode.
// v9 (2026-10-01): RC 1.0 -- Windows' 260-character path limit: shorter record names in the event store (see README)
// v13 (2026-10-02): RC 1.0 -- builder logo far right of the top bar, logos folder, reversed Machined, dark-mode controls.
var CACHE_NAME = "utzline-dollar-summary-cache-v32";

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./pdf.min.js", // (2026-10-04) the in-app PDF viewer (shared/pdf-view)
  "./pdf.worker.min.js",
  "./manifest.json?v=" + ICON_VERSION,
  "./exceljs.min.js", // Excel export (styled like the register PDFs)
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
