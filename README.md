# UTZLINE $ Summary — installable app

**Current version: v1** (its own independent version line, separate from every other app in the family — bump this line, and add a dated entry below, every time a new build ships.)

**v1 (2026-09-26):** First release. Andrew, verbatim: *"lets build a $ summary app, this can show month by month dollar values per project, forecasts and delivered / installed. with an export to excel button for selected months. this can project 12 months ahead of todays date."*

Followed by four clarifying answers (all captured before building) plus two mid-turn additions:

- Build now with **placeholder/sample data**, rather than waiting for a real `dollarValue` field to land on joinery items in UTZLINE Projects (still queued, unbuilt, as `NEXT_RUN_NOTES.md` item 14).
- **"Delivered" brings an item's dollar value to 75%, "Installed" brings it to 100%** — progress-claims-style earned value. Forecast/Delivered/Installed are always three distinct lenses on the same underlying scheduled value; they are never summed into one combined total anywhere in this app.
- **New standalone PWA** (matches how Scheduler/Machine Schedule/Solid Surface Schedule were each stood up as their own separate codebase), not a screen bolted onto UTZLINE Projects.
- **Both** a single-project drill-down view **and** an "All projects" combined view, each project listed with its own dollar value, Builder and Project Manager.
- *(mid-turn)* "it will also show total dollar values for all projects per month" — a company-wide monthly total row/series on the All Projects screen.
- *(mid-turn)* "it will also have sexy looking charts" — see **Chart** below.

### What's in this build

- **Home screen** — every sample project (Job #, name, Builder, Project Manager, total contract value) plus an "All projects" entry point.
- **All projects screen** — company-wide stat tiles (total contract value / delivered to date / installed to date), a company-wide monthly line chart, a per-project table (contract value, delivered-to-date, installed-to-date, an "Open" button into that project's drill-down), and a 12-month company-wide monthly breakdown table with a month-tickbox picker and an "Export selected months to Excel" button.
- **Project detail screen** — the same stat tiles, chart, monthly breakdown table and month-tickbox export, scoped to one project, plus a read-only list of that project's joinery items (ID, description, required delivery, status, dollar value) so every number on the page is traceable back to real line items.
- **12-month window** — always computed from `new Date()` at the moment the app opens (current month + the next 11), never hardcoded to today's actual date, so the app stays correct as time passes.
- **Export to Excel** — SheetJS (`xlsx.full.min.js` v0.18.5, Apache-2.0), vendored locally at `vendor/xlsx.full.min.js` (same vendor-everything-locally convention as every other library used across this family), entirely client-side. The All Projects export produces one "All projects" summary sheet plus one sheet per project; the per-project export produces a monthly-breakdown sheet plus a joinery-items sheet. Only the ticked months are included.
- **Chart** — built per the `dataviz` skill's own procedure before writing any chart code: form picked first (multi-line, for "trend over time" + "tell 3 distinct series apart"), then color assigned in the skill's fixed categorical slot order (slot 1 blue = Forecast, slot 2 orange = Delivered, slot 3 aqua = Installed — the reference palette's own "first three slots validate all-pairs in both modes" safe zone), then validated: `node scripts/validate_palette.js "#3987e5,#d95926,#199e70" --mode dark --surface "#1a1a19"` → **ALL CHECKS PASS** (worst adjacent CVD ΔE 9.4, worst normal-vision ΔE 26.5, all ≥3:1 contrast against this app's own dark chart surface). Hand-rolled inline SVG (no charting library, matching this family's offline-PWA convention) with 2px lines and round joins, ≥8px surface-ringed markers, hairline recessive gridlines, sparing direct end-labels, a legend with line-key swatches (never boxes, per the skill's mark spec), and a crosshair + one-shared-tooltip hover layer (values bold and leading, series name secondary).

### Known, disclosed limitation — placeholder data

**`SAMPLE_PROJECTS` in `index.html` is entirely deterministic sample data, not read from any real Projects-root folder.** It exists purely so this app has something real-shaped to display and export while `dollarValue` doesn't exist yet anywhere in UTZLINE Projects. The data model it's built against mirrors real, already-existing fields exactly, so a later real-data reader is a drop-in replacement, not a rewrite:

```
project = { no, name, contractor (="Builder" in the UI), projectManager, items: [ item, ... ] }
item    = { joineryId, description, dollarValue (number),
            status ("created"|"measured"|"in_manufacture"|"machined"|
                    "manufactured"|"delivered"|"installed"),
            requiredDeliveryDate ("YYYY-MM-DD") }
```

`{no, name, contractor, projectManager}` is exactly `project-meta.json`'s shape (UTZLINE Projects' own `readProjectMeta`/`writeProjectMeta`); `joineryId`/`description` come straight off `joinery-items.json`; `status` uses the exact same shared `joinery-status.json` pipeline strings every sibling app already uses; `requiredDeliveryDate` is exactly `joinery-schedule.json`'s own field. **Only `dollarValue` has no real source yet** — it's the one field this whole app is waiting on (`NEXT_RUN_NOTES.md` item 14, still queued/unbuilt as of this release). Once it lands, replacing `buildSampleProjects()` with a real Projects-root folder reader (File System Access API, same pattern every sibling app already uses) that produces this exact shape is the entire integration — nothing else in this file needs to change.

Everything else about this build is real, working logic against that data model: the earned-value math, the 12-month window, the chart, the tables, and the Excel export all operate on whatever `PROJECTS` array they're given.

Does not touch `source.html`, Site Measure, Viewer, Install ITP, Manufacture ITP, Delivery ITP, UTZLINE Projects, Scheduler, Machine Schedule, or Solid Surface Schedule in any way.
