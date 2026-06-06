/* Style Catalog museum — vanilla, file://-safe (classic script, no fetch).
   Reads window.__CATALOG__ produced by scripts/build.mjs. */
(function () {
  "use strict";

  var CATALOG = window.__CATALOG__;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  if (!CATALOG) {
    document.body.innerHTML =
      '<div style="padding:3rem;font-family:system-ui;color:#eee">' +
      "<h1>Catalog not built</h1><p>Run <code>npm run build</code> to generate " +
      "<code>assets/catalog.js</code>, then reload.</p></div>";
    return;
  }

  var state = {
    search: "",
    sort: "featured",
    filters: { theme: new Set(), tech: new Set(), difficulty: new Set(), era: new Set(), tags: new Set() },
  };

  var DIFF_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };
  var ERA_ORDER = { "1990s": 0, "2000s": 1, "2010s": 2, "2020s": 3, timeless: 4 };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function debounce(fn, ms) {
    var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  }
  // Keep Tab focus inside an open dialog (modal / cart / filters). Only counts
  // currently-visible controls, so hidden tab panes don't become focus holes.
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function trapFocus(container, e) {
    var nodes = $$(FOCUSABLE, container).filter(function (n) { return n.offsetParent !== null; });
    if (!nodes.length) return;
    var first = nodes[0], last = nodes[nodes.length - 1], a = document.activeElement;
    if (e.shiftKey && (a === first || !container.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !container.contains(a))) { e.preventDefault(); first.focus(); }
  }

  /* ---------- stats ---------- */
  function renderStats() {
    $("#stats").innerHTML =
      "<div><b>" + CATALOG.counts.effects + "</b>effects</div>" +
      "<div><b>" + CATALOG.counts.themes + "</b>themes</div>" +
      "<div><b>" + CATALOG.facets.tags.length + "</b>tags</div>";
  }

  /* ---------- filters sidebar ---------- */
  function facetBlock(key, title, items, limit) {
    var wrap = document.createElement("div");
    wrap.className = "facet";
    var h = document.createElement("p");
    h.className = "facet__title";
    h.textContent = title;
    wrap.appendChild(h);
    var chips = document.createElement("div");
    chips.className = "chips";
    wrap.appendChild(chips);

    var expanded = false;
    function paint() {
      chips.innerHTML = "";
      var shown = expanded ? items : items.slice(0, limit || items.length);
      shown.forEach(function (it) {
        var value = it.value !== undefined ? it.value : it.slug;
        var label = it.title !== undefined ? it.title : value;
        var on = state.filters[key].has(value);
        var cnt = facetCount(key, value);
        var b = document.createElement("button");
        b.className = "chip" + (on ? " is-on" : "") + (cnt === 0 && !on ? " is-empty" : "");
        b.innerHTML = esc(label) + ' <span class="chip__count">' + cnt + "</span>";
        b.addEventListener("click", function () {
          if (state.filters[key].has(value)) state.filters[key].delete(value);
          else state.filters[key].add(value);
          syncHash(); render(); paintFilters();
        });
        chips.appendChild(b);
      });
      if (limit && items.length > limit) {
        var more = document.createElement("button");
        more.className = "facet__more";
        more.textContent = expanded ? "Show less" : "+" + (items.length - limit) + " more";
        more.addEventListener("click", function () { expanded = !expanded; paint(); });
        chips.appendChild(more);
      }
    }
    paint();
    wrap._paint = paint;
    return wrap;
  }

  var facetEls = {};
  function buildFilters() {
    var container = $("#filters");
    container.innerHTML = "";
    facetEls.theme = facetBlock("theme", "Theme", CATALOG.facets.themes);
    facetEls.tech = facetBlock("tech", "Technology", CATALOG.facets.tech);
    facetEls.difficulty = facetBlock("difficulty", "Difficulty", CATALOG.facets.difficulty);
    facetEls.era = facetBlock("era", "Era", CATALOG.facets.era);
    facetEls.tags = facetBlock("tags", "Tags", CATALOG.facets.tags, 16);
    [facetEls.theme, facetEls.tech, facetEls.difficulty, facetEls.era, facetEls.tags]
      .forEach(function (el) { container.appendChild(el); });
  }
  function paintFilters() {
    computeFacetCounts();
    Object.keys(facetEls).forEach(function (k) { if (facetEls[k]._paint) facetEls[k]._paint(); });
    paintQuickChips();
    renderActive();
  }

  /* ---------- quick theme chips (toolbar, one-tap) ---------- */
  var quickChips = [];
  function buildQuickChips() {
    var bar = $("#quickbar"); if (!bar) return;
    var themes = CATALOG.facets.themes.slice()
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 6);
    var lbl = document.createElement("span");
    lbl.className = "quickbar__label"; lbl.textContent = "Quick filter";
    bar.appendChild(lbl);
    themes.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "quickchip"; b.dataset.theme = t.slug;
      b.innerHTML = esc(t.title) + ' <span class="quickchip__count">' + t.count + "</span>";
      b._count = b.querySelector(".quickchip__count");
      b.addEventListener("click", function () {
        var s = state.filters.theme;
        if (s.has(t.slug)) s.delete(t.slug); else s.add(t.slug);
        syncHash(); render(); paintFilters();
      });
      quickChips.push(b); bar.appendChild(b);
    });
    var more = document.createElement("button");
    more.type = "button"; more.className = "quickchip quickchip--more";
    more.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/></svg> All filters';
    more.addEventListener("click", function () { openFilters(); });
    bar.appendChild(more);
  }
  function paintQuickChips() {
    quickChips.forEach(function (b) {
      var on = state.filters.theme.has(b.dataset.theme);
      b.classList.toggle("is-on", on);
      var cnt = facetCount("theme", b.dataset.theme);
      if (b._count) b._count.textContent = cnt;
      b.classList.toggle("is-empty", cnt === 0 && !on);
    });
  }

  /* ---------- matching ---------- */
  // matchesExcept ignores one facet's own selection, so each facet can show how
  // many results its values would yield given the *other* active filters.
  function matchesExcept(e, except) {
    var f = state.filters;
    if (except !== "theme" && f.theme.size && !f.theme.has(e.theme)) return false;
    if (except !== "difficulty" && f.difficulty.size && !f.difficulty.has(e.difficulty)) return false;
    if (except !== "era" && f.era.size && !f.era.has(e.era)) return false;
    if (except !== "tech" && f.tech.size && !e.tech.some(function (t) { return f.tech.has(t); })) return false;
    if (except !== "tags" && f.tags.size && !e.tags.some(function (t) { return f.tags.has(t); })) return false;
    if (state.search && e._hay.indexOf(state.search.toLowerCase()) === -1) return false;
    return true;
  }
  function matches(e) { return matchesExcept(e, null); }

  // Dynamic per-value counts for every facet, honouring the other filters.
  var FACET_KEYS = ["theme", "tech", "difficulty", "era", "tags"];
  var facetCounts = {};
  function computeFacetCounts() {
    FACET_KEYS.forEach(function (k) { facetCounts[k] = {}; });
    FACET_KEYS.forEach(function (k) {
      var bucket = facetCounts[k];
      CATALOG.effects.forEach(function (e) {
        if (!matchesExcept(e, k)) return;
        if (k === "tech") e.tech.forEach(function (t) { bucket[t] = (bucket[t] || 0) + 1; });
        else if (k === "tags") e.tags.forEach(function (t) { bucket[t] = (bucket[t] || 0) + 1; });
        else { var v = e[k]; bucket[v] = (bucket[v] || 0) + 1; }
      });
    });
  }
  function facetCount(key, value) {
    var b = facetCounts[key];
    return b && b[value] != null ? b[value] : 0;
  }

  // "Featured" order leads with the showiest, most kinetic effects to hook a
  // first-time visitor — 3D, parallax, particles, cursor/spotlight, morphs —
  // and sinks static reference material (tokens, type scales, form fields).
  // Score is a weighted sum over tags + categories + tech, memoised per effect.
  var WOW_WEIGHTS = {
    particles: 7, particle: 7, "3d": 6, webgl: 6, cube: 5, coverflow: 5, parallax: 5,
    aurora: 5, glitch: 5, distortion: 5, fluid: 5, orbit: 5, cinematic: 5, morph: 4,
    blob: 4, wave: 4, marquee: 4, ticker: 4, carousel: 4, flip: 4, rotate: 4, rotatey: 4,
    cursor: 4, pointer: 4, spotlight: 4, gallery: 3, glow: 3, ambient: 3, spinner: 3,
    loader: 3, loading: 3, draw: 3, stroke: 3, reveal: 3, stagger: 3, scroll: 3, depth: 3,
    ring: 3, translatez: 3, motion: 3, audio: 3, showcase: 3, "2026-trend": 3, dots: 2,
    hover: 2, interactive: 2, animation: 2, "full-page": 2, hero: 2, landing: 1,
    typography: -3, reference: -4, "design-tokens": -4, tokens: -3, docs: -4, form: -3,
    input: -3, checkbox: -3, slider: -2, label: -3, validation: -3, color: -2, border: -2,
    layout: -2, utility: -3, minimal: -2, "flat-design": -2, comparison: -3, pricing: -2,
    accessible: -1,
  };
  var TECH_WEIGHTS = { webgl: 6, canvas: 4, js: 2 };
  // Hand-picked hero row, pinned to the very front of "Featured" regardless of
  // score — a deliberately varied opening (3D, parallax, particles, cursor,
  // morph, tilt) so the first impression shows range. Edit/reorder freely; ids
  // that don't match the active filter simply don't appear.
  var FEATURED_PINS = [
    "carousel-3d", "spatial-depth", "floating-particles",
    "blob-trail-cursor", "svg-blob-spinner", "tilt-spotlight-card",
  ];
  function wowScore(e) {
    if (e._wow != null) return e._wow;
    var sc = 0;
    (e.tags || []).concat(e.categories || []).forEach(function (t) {
      var w = WOW_WEIGHTS[String(t).toLowerCase()]; if (w) sc += w;
    });
    (e.tech || []).forEach(function (t) { sc += TECH_WEIGHTS[String(t).toLowerCase()] || 0; });
    return (e._wow = sc);
  }
  function sortEffects(list) {
    var s = state.sort;
    return list.slice().sort(function (a, b) {
      if (s === "featured") {
        var pa = FEATURED_PINS.indexOf(a.id), pb = FEATURED_PINS.indexOf(b.id);
        if (pa !== -1 || pb !== -1) return pa === -1 ? 1 : pb === -1 ? -1 : pa - pb;
        return (wowScore(b) - wowScore(a)) || a.title.localeCompare(b.title);
      }
      if (s === "title") return a.title.localeCompare(b.title);
      if (s === "difficulty") return (DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]) || a.title.localeCompare(b.title);
      if (s === "era") return (ERA_ORDER[a.era] - ERA_ORDER[b.era]) || a.title.localeCompare(b.title);
      return a.themeTitle.localeCompare(b.themeTitle) || a.title.localeCompare(b.title);
    });
  }

  /* ---------- grid ---------- */
  function card(e) {
    var el = document.createElement("article");
    el.className = "card";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    var added = inBundle(e.id);
    el.innerHTML =
      '<div class="card__frame">' +
        // iframe first (beneath); the poster sits on top and fades out on hover.
        '<iframe sandbox="allow-scripts allow-same-origin" title="' + esc(e.title) + '" data-src="' + esc(e.path) + '"></iframe>' +
        '<img class="card__poster" loading="lazy" alt="" src="assets/posters/' + esc(e.id) + '.jpg" />' +
        '<div class="card__scrim"></div>' +
        '<button class="card__add' + (added ? " is-in" : "") + '" data-bundle-add data-id="' + esc(e.id) +
          '" type="button" aria-pressed="' + added + '" title="Add to bundle" aria-label="Add ' + esc(e.title) + ' to bundle">' +
          (added ? "✓" : "＋") + "</button>" +
      "</div>" +
      '<div class="card__body">' +
        '<h3 class="card__title">' + esc(e.title) + "</h3>" +
        '<p class="card__summary">' + esc(e.summary) + "</p>" +
        '<div class="card__meta">' +
          '<span class="badge badge--theme">' + esc(e.themeTitle) + "</span>" +
          '<span class="badge badge--' + esc(e.difficulty) + '">' + esc(e.difficulty) + "</span>" +
          (e.era ? '<span class="badge">' + esc(e.era) + "</span>" : "") +
        "</div>" +
      "</div>";
    function open() { openModal(e.id); }
    el.addEventListener("click", open);
    el.addEventListener("keydown", function (ev) {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target === el) { ev.preventDefault(); open(); }
    });
    el.querySelector(".card__add").addEventListener("click", function (ev) {
      ev.stopPropagation(); toggleBundle(e.id);
    });
    // Cards rest on a static poster image (cheap, no compositing). The live
    // iframe is mounted only on hover/focus and animates just that one card —
    // far under the count that overwhelmed Chrome's compositor. If a poster is
    // missing, the frozen iframe is revealed as the resting visual instead.
    var ifr = el.querySelector(".card__frame iframe");
    var poster = el.querySelector(".card__poster");
    if (ifr) {
      ifr.addEventListener("load", function () {
        applyFrame(ifr); freezeFrame(ifr); ifr._loaded = true;
        if (el.classList.contains("is-hover")) goLive();
      });
      poster.addEventListener("error", function () { el.classList.add("no-poster"); mountFrame(el); });
      var goLive = function () { el.classList.add("is-live"); playFrame(ifr); };
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
      if (!(reduce && reduce.matches)) {
        var enter = function () { el.classList.add("is-hover"); if (!ifr.getAttribute("src")) mountFrame(el); if (ifr._loaded) goLive(); };
        var leave = function () { el.classList.remove("is-hover", "is-live"); pauseFrame(ifr); };
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
        el.addEventListener("focusin", enter);
        el.addEventListener("focusout", leave);
      }
    }
    return el;
  }

  /* Build every card once. The live iframe is mounted on demand (hover/focus,
     or as a fallback when a poster is missing) rather than eagerly, so the grid
     rests on lightweight images. Filtering/sorting only toggles visibility +
     CSS `order`, so a mounted iframe is never destroyed and re-fetched. */
  var cardEls = {};
  function mountFrame(el) {
    var ifr = el.querySelector("iframe");
    if (ifr && !ifr.getAttribute("src") && ifr.dataset.src) ifr.setAttribute("src", ifr.dataset.src);
  }
  function buildGrid() {
    var grid = $("#grid"), frag = document.createDocumentFragment();
    CATALOG.effects.forEach(function (e) {
      var el = card(e); cardEls[e.id] = el; frag.appendChild(el);
    });
    grid.appendChild(frag);
  }

  var visibleCards = []; // matched cards in visual order, for arrow-key nav
  function render() {
    var list = sortEffects(CATALOG.effects.filter(matches));
    var shown = {};
    visibleCards = [];
    list.forEach(function (e, i) {
      var el = cardEls[e.id];
      if (el) { el.style.order = i; el.hidden = false; shown[e.id] = 1; visibleCards.push(el); }
    });
    CATALOG.effects.forEach(function (e) {
      if (!shown[e.id]) { var el = cardEls[e.id]; if (el) el.hidden = true; }
    });
    $("#result-count").textContent = list.length + (list.length === 1 ? " effect" : " effects");
    $("#empty").hidden = list.length !== 0;
    renderActive();
  }

  // Arrow-key navigation across the visible grid (cards are focusable).
  function gridColumns() {
    if (!visibleCards.length) return 1;
    var top = visibleCards[0].getBoundingClientRect().top, c = 0;
    for (var i = 0; i < visibleCards.length; i++) {
      if (Math.abs(visibleCards[i].getBoundingClientRect().top - top) < 2) c++; else break;
    }
    return c || 1;
  }
  function gridKeydown(ev) {
    if (ev.key.indexOf("Arrow") !== 0) return;
    var idx = visibleCards.indexOf(document.activeElement);
    if (idx < 0) return;
    var cols = gridColumns(), next = idx;
    if (ev.key === "ArrowRight") next = idx + 1;
    else if (ev.key === "ArrowLeft") next = idx - 1;
    else if (ev.key === "ArrowDown") next = idx + cols;
    else if (ev.key === "ArrowUp") next = idx - cols;
    if (next >= 0 && next < visibleCards.length) { ev.preventDefault(); visibleCards[next].focus(); }
  }

  var lastFilterCount = -1;
  function renderActive() {
    var parts = [], n = 0;
    Object.keys(state.filters).forEach(function (k) {
      state.filters[k].forEach(function (v) { parts.push(v); n++; });
    });
    if (state.search) parts.unshift('“' + state.search + '”');
    $("#active-filters").textContent = parts.length ? "· " + parts.join(", ") : "";
    var fc = $("#filters-count"), fab = $("#filters-fab");
    if (fc) { fc.textContent = n; fc.hidden = n === 0; }
    if (fab) {
      fab.classList.toggle("has-active", n > 0);
      if (n !== lastFilterCount && n > 0) { fab.classList.remove("bump"); void fab.offsetWidth; fab.classList.add("bump"); }
    }
    lastFilterCount = n;
  }

  /* ---------- modal ---------- */
  var lastFocus = null;
  function findEffect(id) {
    for (var i = 0; i < CATALOG.effects.length; i++) if (CATALOG.effects[i].id === id) return CATALOG.effects[i];
    return null;
  }
  // Source is not in the eager catalog (to keep it small); fetch it on demand.
  // Phase 2: tuning — parse :root tokens, expose controls, rewrite :root in place.
  var OKEY = "sc_overrides", BRKEY = "sc_brand";
  var overrides = (function () { try { return JSON.parse(localStorage.getItem(OKEY) || "{}"); } catch (e) { return {}; } })();
  var brand = (function () { try { return JSON.parse(localStorage.getItem(BRKEY) || "{}"); } catch (e) { return {}; } })();
  function saveOverrides() { try { localStorage.setItem(OKEY, JSON.stringify(overrides)); } catch (e) {} }
  function saveBrand() { try { localStorage.setItem(BRKEY, JSON.stringify(brand)); } catch (e) {} }
  var BRAND_ROLES = [
    { key: "accent", label: "Accent", type: "color", def: "#7c5cff", aliases: ["accent", "a", "c1", "primary", "brand", "accent1", "g1", "neon", "led", "sun", "leaf", "gold", "color-primary"] },
    { key: "accent2", label: "Accent 2", type: "color", def: "#2dd4bf", aliases: ["accent-2", "accent2", "b", "c2", "secondary", "g2", "neon2", "accent_2", "color-secondary"] },
    { key: "bg", label: "Background", type: "color", def: "#0b0d12", aliases: ["bg", "background", "paper", "cream", "page", "bg-1"] },
    { key: "surface", label: "Surface", type: "color", def: "#12151f", aliases: ["surface", "panel", "card", "paper2", "surface-1", "elevated", "tile", "bg-2", "c3"] },
    { key: "text", label: "Text", type: "color", def: "#e8ecf6", aliases: ["text", "ink", "fg", "foreground"] },
    { key: "muted", label: "Muted", type: "color", def: "#8b93a7", aliases: ["muted", "sub", "dim", "subtle", "text-2", "muted-1"] },
    { key: "radius", label: "Radius", type: "length", def: "14px", aliases: ["r", "radius", "rad", "radii"] }
  ];
  function parseRootTokens(src) {
    if (!src) return [];
    var m = src.match(/:root\s*\{([\s\S]*?)\}/i); if (!m) return [];
    var re = /(--[\w-]+)\s*:\s*([^;]+);/g, out = [], mm;
    while ((mm = re.exec(m[1]))) out.push({ name: mm[1].trim(), value: mm[2].trim() });
    return out;
  }
  function classify(v) {
    v = String(v).trim();
    if (/^#([0-9a-f]{3,8})$/i.test(v)) return "color";
    if (/^-?[\d.]+(px|rem|em|%|vw|vh|vmin|vmax)$/.test(v)) return "length";
    if (/^-?[\d.]+$/.test(v)) return "number";
    return "text";
  }
  function toHex6(v) { var s = String(v).replace("#", ""); if (s.length === 3) s = s.split("").map(function (c) { return c + c; }).join(""); return "#" + s.slice(0, 6).toLowerCase(); }
  function splitLen(v) { var m = String(v).match(/^(-?[\d.]+)(px|rem|em|%|vw|vh|vmin|vmax)?$/); return m ? { num: parseFloat(m[1]), unit: m[2] || "" } : null; }
  function effectiveTokens(id, tokens) {
    var eff = {};
    if (brand.applied) {
      BRAND_ROLES.forEach(function (role) {
        var val = brand[role.key]; if (!val) return;
        tokens.forEach(function (t) {
          var bare = t.name.replace(/^--/, "").toLowerCase();
          if (role.aliases.indexOf(bare) > -1 && classify(t.value) === role.type) eff[t.name] = val;
        });
      });
    }
    var ov = overrides[id] || {};
    Object.keys(ov).forEach(function (k) { eff[k] = ov[k]; });
    return eff;
  }
  function applyTuned(src, eff) {
    var keys = Object.keys(eff); if (!keys.length || !src) return src;
    return src.replace(/(:root\s*\{)([\s\S]*?)(\})/i, function (_, a, body, c) {
      keys.forEach(function (name) {
        var re = new RegExp("(" + name.replace(/-/g, "\\-") + "\\s*:\\s*)([^;]+)(;)");
        var nv = String(eff[name]).replace(/\$/g, "$$$$");
        if (re.test(body)) body = body.replace(re, "$1" + nv + "$3"); else body = body + "\n  " + name + ": " + eff[name] + ";";
      });
      return a + body + c;
    });
  }

  var T = { id: null, source: "", tokens: [], custom: {} };
  function loadSource(e) {
    $("#modal-source").textContent = "Loading source…";
    var host = $("#modal-tune"); if (host) host.innerHTML = '<p class="tune__empty">Loading…</p>';
    T.id = e.id; T.source = ""; T.tokens = []; T.custom = {};
    (e.customization || []).forEach(function (c) { if (c.name && c.name.indexOf("--") === 0) T.custom[c.name] = c.description; });
    var want = e.id;
    function have(src) {
      if (T.id !== want) return;
      T.source = src || ""; T.tokens = parseRootTokens(src);
      renderSourcePane(); renderTune(); applyAllToPreview();
    }
    if (e.source) { have(e.source); return; }
    fetch("api/effects/" + encodeURIComponent(e.id) + ".json", { cache: "force-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (full) {
        if (T.id !== want) return;
        if (full && full.source) have(full.source);
        else { $("#modal-source").textContent = "// Source unavailable — open the standalone page."; renderTune(); }
      })
      .catch(function () { if (T.id === want) $("#modal-source").textContent = "// Could not load source (offline?)."; });
  }
  function renderSourcePane() {
    $("#modal-source").textContent = applyTuned(T.source, effectiveTokens(T.id, T.tokens));
  }
  function applyAllToPreview() {
    var fr = $("#modal-iframe");
    try {
      var doc = fr.contentDocument; if (!doc || !doc.documentElement) return;
      var eff = effectiveTokens(T.id, T.tokens);
      T.tokens.forEach(function (t) { doc.documentElement.style.setProperty(t.name, eff[t.name] !== undefined ? eff[t.name] : t.value); });
    } catch (e) {}
  }
  function setOverride(id, name, val, orig) {
    overrides[id] = overrides[id] || {};
    if (val === orig) { delete overrides[id][name]; if (!Object.keys(overrides[id]).length) delete overrides[id]; }
    else overrides[id][name] = val;
    saveOverrides(); applyAllToPreview(); renderSourcePane();
  }
  function resetSample(id) { delete overrides[id]; saveOverrides(); renderTune(); applyAllToPreview(); renderSourcePane(); }
  function renderTune() {
    var host = $("#modal-tune"); if (!host) return;
    if (!T.tokens.length) { host.innerHTML = '<p class="tune__empty">This sample has no <code>:root</code> CSS variables to tune — edit the source directly, or use the Palette bar at the top of the page.</p>'; return; }
    var ordered = [], seen = {};
    Object.keys(T.custom).forEach(function (n) { var t = T.tokens.filter(function (x) { return x.name === n; })[0]; if (t) { ordered.push(t); seen[n] = 1; } });
    T.tokens.forEach(function (t) { if (!seen[t.name]) ordered.push(t); });
    var ov = overrides[T.id] || {};
    var html = '<div class="tune__bar"><span>Adjust this sample — the preview updates live, and your values are baked into the copied code.</span><button class="tune__reset" id="tune-reset" type="button">Reset</button></div><div class="tune__grid">';
    ordered.forEach(function (t) {
      var cur = ov[t.name] !== undefined ? ov[t.name] : t.value, kind = classify(t.value), desc = T.custom[t.name] || "";
      html += '<div class="tune__row" data-token="' + esc(t.name) + '" data-orig="' + esc(t.value) + '" data-kind="' + kind + '">';
      html += '<label><code>' + esc(t.name) + "</code>" + (desc ? " <small>" + esc(desc) + "</small>" : "") + "</label>";
      if (kind === "color") {
        html += '<span class="tune__color"><input type="color" value="' + esc(toHex6(cur)) + '" aria-label="' + esc(t.name) + '" /><input type="text" class="tune__hex" value="' + esc(cur) + '" aria-label="' + esc(t.name) + ' hex" /></span>';
      } else if (kind === "length") {
        var sp = splitLen(cur) || { num: 0, unit: "px" }, max = 64, step = 1;
        if (sp.unit === "rem" || sp.unit === "em") { max = Math.max(4, Math.abs(sp.num) * 3); step = 0.05; }
        else if (sp.unit === "%") { max = 100; } else { max = Math.max(64, Math.abs(sp.num) * 3); }
        html += '<span class="tune__len"><input type="range" min="0" max="' + max + '" step="' + step + '" value="' + sp.num + '" aria-label="' + esc(t.name) + '" /><output>' + esc(cur) + "</output></span>";
      } else {
        html += '<input type="text" class="tune__text" value="' + esc(cur) + '" aria-label="' + esc(t.name) + '" />';
      }
      html += "</div>";
    });
    host.innerHTML = html + "</div>";
    $$(".tune__row", host).forEach(function (row) {
      var name = row.getAttribute("data-token"), kind = row.getAttribute("data-kind"), orig = row.getAttribute("data-orig");
      if (kind === "color") {
        var col = row.querySelector("input[type=color]"), hex = row.querySelector(".tune__hex");
        col.addEventListener("input", function () { hex.value = col.value; setOverride(T.id, name, col.value, orig); });
        hex.addEventListener("change", function () { if (/^#([0-9a-f]{3,8})$/i.test(hex.value)) { col.value = toHex6(hex.value); setOverride(T.id, name, hex.value, orig); } });
      } else if (kind === "length") {
        var rng = row.querySelector("input[type=range]"), out = row.querySelector("output"), unit = (splitLen(orig) || { unit: "px" }).unit;
        rng.addEventListener("input", function () { var v = rng.value + unit; out.textContent = v; setOverride(T.id, name, v, orig); });
      } else {
        var tx = row.querySelector(".tune__text");
        tx.addEventListener("change", function () { setOverride(T.id, name, tx.value, orig); });
      }
    });
    $("#tune-reset").addEventListener("click", function () { resetSample(T.id); });
  }
  /* ---------- color helpers (shared by the palette bar) ---------- */
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l), k = function (n) { return (n + h / 30) % 12; };
    var f = function (n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))); };
    var hx = function (x) { return ("0" + x.toString(16)).slice(-2); };
    return "#" + hx(f(0)) + hx(f(8)) + hx(f(4));
  }
  function hexToHsl(hex) {
    var s2 = String(hex).replace("#", ""); if (s2.length === 3) s2 = s2.split("").map(function (c) { return c + c; }).join("");
    var r = parseInt(s2.slice(0, 2), 16) / 255, g = parseInt(s2.slice(2, 4), 16) / 255, b = parseInt(s2.slice(4, 6), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0, l = (mx + mn) / 2, sat = 0;
    if (d) {
      sat = d / (1 - Math.abs(2 * l - 1));
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h: Math.round(h), s: Math.round(sat * 100), l: Math.round(l * 100) };
  }
  var PRESETS = [
    { n: "Nebula", h: 262, s: 85, l: 60, mode: "dark" }, { n: "Ocean", h: 196, s: 82, l: 55, mode: "dark" },
    { n: "Ember", h: 18, s: 88, l: 60, mode: "dark" }, { n: "Forest", h: 150, s: 52, l: 48, mode: "dark" },
    { n: "Slate", h: 220, s: 10, l: 55, mode: "dark" }, { n: "Candy", h: 330, s: 88, l: 64, mode: "light" },
    { n: "Citrus", h: 45, s: 95, l: 56, mode: "light" }, { n: "Royal", h: 250, s: 70, l: 60, mode: "light" }
  ];
  var PAL_ROLES = BRAND_ROLES.filter(function (r) { return r.type === "color"; }); // accent..muted
  // Perceptual palette generation (OKLCH, via Ottosson's OKLab) — far cleaner
  // than random HSL: equal *perceived* lightness across hues (no muddy yellows
  // or blown-out cyans) with automatic in-gamut chroma. Hue stays in degrees for
  // parity with the HSL wheel editor.
  function _oklchLin(L, C, Hdeg) {
    var h = Hdeg * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  }
  function oklchHex(L, C, H) {
    var rgb = _oklchLin(L, C, H), t = 0;
    // shrink chroma until in sRGB gamut → clean colors, never clipped mush
    while (t < 18 && rgb.some(function (c) { return c < -0.0015 || c > 1.0015; })) { C -= 0.012; rgb = _oklchLin(L, C, H); t++; }
    var g = function (c) { c = Math.max(0, Math.min(1, c)); c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return ("0" + Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16)).slice(-2); };
    return "#" + g(rgb[0]) + g(rgb[1]) + g(rgb[2]);
  }
  function harmonyHue(h, harmony) {
    var off = harmony === "analogous" ? 32 : harmony === "triadic" ? 120 : harmony === "monochrome" ? 0 : 180;
    return (h + off + 360) % 360;
  }
  // neutrals + accent-2 derived from a base hue (accent supplied by genFull)
  function genRest(h, harmony, mode) {
    var dark = mode !== "light", h2 = harmonyHue(h, harmony);
    return {
      accent2: harmony === "monochrome" ? oklchHex(0.80, 0.12, h) : oklchHex(0.72, 0.15, h2),
      bg: dark ? oklchHex(0.17, 0.018, h) : oklchHex(0.975, 0.012, h),
      surface: dark ? oklchHex(0.225, 0.025, h) : oklchHex(0.935, 0.02, h),
      text: dark ? oklchHex(0.95, 0.012, h) : oklchHex(0.25, 0.02, h),
      muted: dark ? oklchHex(0.67, 0.02, h) : oklchHex(0.52, 0.022, h)
    };
  }
  function genFull(h, harmony, mode, rand) {
    var aL = rand ? 0.60 + Math.random() * 0.10 : 0.66;
    var aC = rand ? 0.13 + Math.random() * 0.06 : 0.16;
    var rest = genRest(h, harmony, mode);
    rest.accent = oklchHex(aL, aC, h);
    rest._hue = h;
    return rest;
  }
  // ---- working palette (the bar) vs applied palette (`brand`) ----
  // Shuffle / edit / presets only mutate `work` and repaint the small bar — the
  // gallery + this site re-skin ONLY when Apply is pressed, so rapid shuffling
  // never glitches the page.
  var COLORS = ["accent", "accent2", "bg", "surface", "text", "muted"];
  var work = { harmony: "complementary", mode: "dark", locks: {} };
  function cloneColors(src) { var o = {}; COLORS.forEach(function (k) { o[k] = src[k]; }); o.radius = src.radius || "14px"; return o; }
  function isDirty() {
    if ((work.radius || "14px") !== (brand.radius || "14px")) return true;
    return COLORS.some(function (k) { return work[k] !== brand[k]; });
  }

  // Inject one <style> per gallery iframe that blanket-defines every brand-role
  // alias on :root with !important — overrides whatever subset of those names the
  // sample uses (robust across 172 hand-built samples). Samples that use no CSS
  // variables, or hard-coded colors, can't follow without per-sample rework.
  function paletteStyleText() {
    var rules = [];
    BRAND_ROLES.forEach(function (role) {
      var v = brand[role.key]; if (!v) return;
      role.aliases.forEach(function (al) { rules.push("--" + al + ":" + v + " !important;"); });
    });
    return ":root{" + rules.join("") + "}";
  }
  function applyFrame(fr) {
    if (!fr.getAttribute("src")) return; // skip iframes not yet lazy-mounted
    var doc; try { doc = fr.contentDocument; } catch (e) { return; }
    if (!doc || !doc.head) return;
    var st = doc.getElementById("sc-pal");
    if (!brand.applied) { if (st) st.parentNode.removeChild(st); return; }
    if (!st) { st = doc.createElement("style"); st.id = "sc-pal"; doc.head.appendChild(st); }
    st.textContent = paletteStyleText();
  }
  // Freeze a grid preview: pause CSS animations and suspend its rAF loop.
  // Running ~10 animated iframes at once overwhelmed Chrome's compositor and
  // produced a flickering stale-tile band, so previews stay frozen at rest and
  // only the hovered/focused card plays (see playFrame/pauseFrame). The rAF
  // wrapper *holds* pending callbacks rather than dropping them, so the loop can
  // be resumed later — killing rAF outright would be one-way.
  function freezeFrame(fr) {
    if (!fr.getAttribute("src")) return; // skip the initial about:blank load
    try {
      var doc = fr.contentDocument, win = fr.contentWindow;
      if (!win) return;
      if (!fr._sc) {
        var origRAF = (win.requestAnimationFrame || win.webkitRequestAnimationFrame).bind(win);
        var held = [], paused = true;
        win.requestAnimationFrame = function (cb) { if (paused) { held.push(cb); return -1; } return origRAF(cb); };
        var setCss = function (on) {
          if (!doc || !doc.head) return;
          var st = doc.getElementById("sc-freeze");
          if (!st) { st = doc.createElement("style"); st.id = "sc-freeze"; doc.head.appendChild(st); }
          st.textContent = on ? "*,*::before,*::after{animation-play-state:paused!important}" : "";
        };
        fr._sc = {
          play: function () { setCss(false); if (!paused) return; paused = false; var q = held; held = []; q.forEach(function (cb) { origRAF(cb); }); },
          pause: function () { setCss(true); paused = true; }
        };
      }
      fr._sc.pause();
    } catch (e) {}
  }
  function playFrame(fr) { try { if (fr && fr._sc) fr._sc.play(); } catch (e) {} }
  function pauseFrame(fr) { try { if (fr && fr._sc) fr._sc.pause(); } catch (e) {} }
  function _rgb(h) { h = String(h).replace("#", ""); if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join(""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { var x = _rgb(a), y = _rgb(b), h = function (v) { return ("0" + Math.round(v).toString(16)).slice(-2); }; return "#" + h(x[0] + (y[0] - x[0]) * t) + h(x[1] + (y[1] - x[1]) * t) + h(x[2] + (y[2] - x[2]) * t); }
  // Map the applied palette onto the catalog's OWN :root vars → the whole site
  // (masthead, cards, modal, this bar…) adopts the user's palette.
  function applySiteTheme() {
    var r = document.documentElement.style;
    var keys = ["--accent", "--accent-2", "--accent-grad", "--bg", "--bg-2", "--panel", "--panel-2", "--line", "--text", "--muted", "--radius"];
    if (!(brand.applied && brand.site)) { keys.forEach(function (k) { r.removeProperty(k); }); return; }
    r.setProperty("--accent", brand.accent);
    r.setProperty("--accent-2", brand.accent2);
    r.setProperty("--accent-grad", "linear-gradient(120deg," + brand.accent + "," + brand.accent2 + ")");
    r.setProperty("--bg", brand.bg);
    r.setProperty("--bg-2", mix(brand.bg, brand.surface, 0.5));
    r.setProperty("--panel", brand.surface);
    r.setProperty("--panel-2", mix(brand.surface, brand.text, 0.08));
    r.setProperty("--line", mix(brand.surface, brand.text, 0.16));
    r.setProperty("--text", brand.text);
    r.setProperty("--muted", brand.muted);
    r.setProperty("--radius", brand.radius || "14px");
  }
  function applyBrandEverywhere() {
    $$(".card__frame iframe").forEach(applyFrame);
    applyAllToPreview();
    applySiteTheme();
  }
  function paletteCss() {
    return ":root {\n" +
      "  --accent: " + work.accent + ";     /* primary actions, links */\n" +
      "  --accent-2: " + work.accent2 + ";  /* secondary accent */\n" +
      "  --bg: " + work.bg + ";         /* page background */\n" +
      "  --surface: " + work.surface + ";    /* cards & panels */\n" +
      "  --text: " + work.text + ";       /* body text */\n" +
      "  --muted: " + work.muted + ";      /* secondary text */\n" +
      "  --radius: " + (work.radius || "14px") + ";\n}";
  }
  // WCAG contrast of text-on-background (the pair that matters for readability)
  function relLum(hex) { var c = _rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrastRatio(a, b) { var L1 = relLum(a), L2 = relLum(b), hi = Math.max(L1, L2), lo = Math.min(L1, L2); return (hi + 0.05) / (lo + 0.05); }
  function renderContrast() {
    var el = $("#pb-contrast"); if (!el) return;
    var c = contrastRatio(work.text, work.bg);
    var lvl = c >= 7 ? "AAA" : c >= 4.5 ? "AA" : c >= 3 ? "AA large" : "low";
    el.textContent = "Aa " + c.toFixed(1) + ":1 · " + lvl;
    el.className = "pb__contrast " + (c >= 4.5 ? "is-pass" : c >= 3 ? "is-warn" : "is-fail");
    el.title = "WCAG contrast of Text on Background";
  }
  // ---- shareable palette link (#palette=hex-…-mode) ----
  function encodePalette() {
    return COLORS.map(function (k) { return String(work[k] || "").replace("#", ""); }).join("-") + "-" + (work.mode === "light" ? "l" : "d");
  }
  function shareUrl() { return location.origin + location.pathname + "#palette=" + encodePalette(); }
  function decodePalette(str) {
    var parts = String(str).split("-"); if (parts.length < 6) return null;
    var o = {}, ok = 0;
    COLORS.forEach(function (k, i) { if (/^[0-9a-f]{6}$/i.test(parts[i])) { o[k] = "#" + parts[i].toLowerCase(); ok++; } });
    if (ok < 6) return null;
    o.mode = parts[6] === "l" ? "light" : "dark";
    return o;
  }
  function updateApplyState() {
    var changed = isDirty();              // working palette differs from what's applied
    var dirty = changed || !brand.applied; // panel button also nudges before first apply
    var btn = $("#pb-apply");
    if (btn) {
      btn.classList.toggle("pb__btn--primary", dirty);
      btn.classList.toggle("is-applied", !dirty);
      btn.textContent = dirty ? "Apply" : "Applied ✓";
    }
    // header CTA pulses only when there's an actual pending change (not on first load)
    var bar = $("#pb-apply-bar"); if (bar) bar.hidden = !changed;
  }
  function renderPaletteBar() {
    var host = $("#pb-swatches"); if (!host) return;
    host.innerHTML = "";
    PAL_ROLES.forEach(function (role) {
      var val = work[role.key] || role.def, locked = work.locks && work.locks[role.key];
      var sw = document.createElement("div"); sw.className = "pb__sw";
      sw.innerHTML =
        '<button class="pb__chip" data-role="' + role.key + '" style="background:' + esc(val) + '" title="Edit ' + role.label + '" aria-label="Edit ' + role.label + '"></button>' +
        '<div class="pb__info"><span class="pb__role">' + role.label + "</span>" +
        '<button class="pb__hex" data-hex="' + esc(val) + '" title="Copy ' + esc(val) + '">' + esc(val) + "</button></div>" +
        '<button class="pb__lock' + (locked ? " is-on" : "") + '" data-lock="' + role.key + '" aria-pressed="' + (!!locked) + '" title="' + (locked ? "Locked — click to unlock" : "Lock this color") + '">' + (locked ? "🔒" : "🔓") + "</button>";
      host.appendChild(sw);
    });
    $$(".pb__chip", host).forEach(function (b) { b.addEventListener("click", function () { openEditor(b.getAttribute("data-role")); }); });
    $$(".pb__hex", host).forEach(function (b) {
      b.addEventListener("click", function () {
        writeClipboard(b.getAttribute("data-hex")); var o = b.textContent; b.textContent = "copied!";
        setTimeout(function () { b.textContent = o; }, 900);
      });
    });
    $$(".pb__lock", host).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-lock"); work.locks = work.locks || {}; work.locks[k] = !work.locks[k];
        renderPaletteBar();
      });
    });
    var prev = $("#pb-preview");
    if (prev) prev.innerHTML = PAL_ROLES.map(function (r) { return '<i style="background:' + esc(work[r.key] || r.def) + '"></i>'; }).join("");
    updateApplyState(); renderContrast(); renderBundlePalette();
  }
  function renderBundlePalette() {
    var host = $("#bp-swatches"); if (!host) return;
    host.innerHTML = PAL_ROLES.map(function (r) {
      var v = brand[r.key] || r.def; return '<span class="bp__sw" title="' + r.label + " " + esc(v) + '"><i style="background:' + esc(v) + '"></i></span>';
    }).join("") + '<span class="bp__state">' + (brand.applied ? "baked into this bundle’s code ✓" : "not applied — set a palette & hit Apply up top") + "</span>";
  }
  // ---- mutate the WORKING palette (bar only; never re-skins the page) ----
  function commitWork() { renderPaletteBar(); }
  function regenFromAccent() {
    var h = (work._hue != null) ? work._hue : hexToHsl(work.accent || "#7c5cff").h;
    var rest = genRest(h, work.harmony, work.mode);
    COLORS.forEach(function (k) { if (k !== "accent" && !(work.locks && work.locks[k])) work[k] = rest[k]; });
    commitWork();
  }
  function shuffle() {
    var lockAcc = work.locks && work.locks.accent;
    var h = lockAcc ? (work._hue != null ? work._hue : hexToHsl(work.accent || "#7c5cff").h) : Math.floor(Math.random() * 360);
    var gen = genFull(h, work.harmony || "complementary", work.mode || "dark", true);
    COLORS.forEach(function (k) { if (!(work.locks && work.locks[k])) work[k] = gen[k]; });
    work._hue = h;
    commitWork();
  }
  function setMode(m) { work.mode = m; $$("#pb-mode button").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-mode") === m); }); }
  // ---- commit: apply the working palette to the gallery + (optionally) site ----
  function applyPalette() {
    COLORS.forEach(function (k) { brand[k] = work[k]; });
    brand.radius = work.radius || "14px"; brand.harmony = work.harmony; brand.mode = work.mode;
    brand._hue = work._hue; brand.locks = JSON.parse(JSON.stringify(work.locks || {})); brand.applied = true;
    saveBrand(); applyBrandEverywhere(); renderSourcePane(); updateApplyState(); renderBundlePalette();
    var s = $("#pb-status"); if (s) { s.textContent = "✓ Applied" + (brand.site ? " to the gallery + this site." : " to the gallery."); setTimeout(function () { s.textContent = ""; }, 2600); }
  }
  function resetPalette() {
    var g = genFull(262, "complementary", "dark", false);
    brand = { applied: false, site: brand.site !== false, harmony: "complementary", mode: "dark", locks: {}, radius: "14px", _hue: 262 };
    COLORS.forEach(function (k) { brand[k] = g[k]; });
    work = cloneColors(brand); work.harmony = "complementary"; work.mode = "dark"; work.locks = {}; work._hue = 262;
    setMode("dark"); if ($("#pb-harmony")) $("#pb-harmony").value = "complementary";
    saveBrand(); applyBrandEverywhere(); renderSourcePane(); renderPaletteBar();
    $("#pb-editor").hidden = true;
  }
  // ---- per-swatch wheel editor (edits the working palette) ----
  var ed = { role: "accent", h: 262, s: 85, l: 58 };
  function placeEdMark() {
    var w = $("#pb-wheel"), mk = $("#pb-mark"); if (!w || !mk) return;
    var R = w.clientWidth / 2, rr = (ed.s / 100) * R, rad = ed.h * Math.PI / 180;
    mk.style.left = (R + rr * Math.sin(rad)) + "px"; mk.style.top = (R - rr * Math.cos(rad)) + "px";
    mk.style.background = hslToHex(ed.h, ed.s, ed.l);
  }
  function setEditColor() {
    work[ed.role] = hslToHex(ed.h, ed.s, ed.l);
    if (ed.role === "accent") work._hue = ed.h;
    if ($("#pb-hex")) $("#pb-hex").value = work[ed.role];
    placeEdMark(); commitWork();
  }
  function openEditor(role) {
    ed.role = role; var hsl = hexToHsl(work[role] || "#888888"); ed.h = hsl.h; ed.s = hsl.s; ed.l = hsl.l;
    var roleObj = PAL_ROLES.filter(function (r) { return r.key === role; })[0];
    $("#pb-editrole").textContent = roleObj ? roleObj.label : role;
    $("#pb-light").value = hsl.l; $("#pb-hex").value = work[role] || "";
    $("#pb-editor").hidden = false; placeEdMark();
  }
  function edWheelPick(ev) {
    var w = $("#pb-wheel"), r = w.getBoundingClientRect(), R = r.width / 2;
    var dx = ev.clientX - (r.left + R), dy = ev.clientY - (r.top + R), dist = Math.min(Math.hypot(dx, dy), R);
    ed.h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360; ed.s = Math.round(dist / R * 100);
    setEditColor();
  }
  function initPaletteBar() {
    if (!$("#palettebar")) return;
    // seed / migrate the applied palette (defaults mirror the site's own theme)
    if (!brand.accent) { var g = genFull(262, "complementary", "dark", false); COLORS.forEach(function (k) { brand[k] = g[k]; }); brand._hue = 262; }
    COLORS.forEach(function (k) { if (!brand[k]) { var role = PAL_ROLES.filter(function (r) { return r.key === k; })[0]; brand[k] = role ? role.def : "#888888"; } });
    brand.radius = brand.radius || "14px"; brand.harmony = brand.harmony || "complementary";
    brand.mode = brand.mode || "dark"; brand.locks = brand.locks || {};
    if (brand.applied === undefined) brand.applied = !!brand.on; // migrate v0.14 `on`
    if (brand.site === undefined) brand.site = true;
    delete brand.on; saveBrand();
    work = cloneColors(brand); work.harmony = brand.harmony; work.mode = brand.mode; work.locks = JSON.parse(JSON.stringify(brand.locks || {}));
    work._hue = (brand._hue != null) ? brand._hue : hexToHsl(brand.accent).h;
    // a shared #palette=… link wins: load it into the applied palette
    var pm = location.hash.match(/palette=([0-9a-fA-F-]+)/);
    if (pm) { var dp = decodePalette(pm[1]); if (dp) {
      COLORS.forEach(function (k) { work[k] = dp[k]; brand[k] = dp[k]; });
      work.mode = brand.mode = dp.mode; work._hue = hexToHsl(dp.accent).h; brand._hue = work._hue;
      brand.applied = true; saveBrand();
    } }
    if ($("#pb-harmony")) $("#pb-harmony").value = work.harmony;
    setMode(work.mode);
    if ($("#pb-site")) $("#pb-site").checked = !!brand.site;
    renderPaletteBar();
    var ph = $("#pb-presets");
    if (ph) PRESETS.forEach(function (pre) {
      var b = document.createElement("button"); b.className = "pb__preset"; b.type = "button";
      b.title = pre.n + " palette"; b.setAttribute("aria-label", pre.n + " palette");
      b.style.background = oklchHex(0.66, 0.16, pre.h);
      b.addEventListener("click", function () {
        var gen = genFull(pre.h, work.harmony || "complementary", pre.mode, false);
        COLORS.forEach(function (k) { work[k] = gen[k]; });
        work._hue = pre.h; setMode(pre.mode); commitWork();
      });
      ph.appendChild(b);
    });
    $("#pb-shuffle").addEventListener("click", shuffle);
    $("#pb-quick-shuffle").addEventListener("click", shuffle);
    $("#pb-apply-bar").addEventListener("click", applyPalette);
    // panel open/closed — persisted across visits
    var toggle = $("#pb-toggle"), panel = $("#pb-panel");
    function setPanelOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      $("#palettebar").classList.toggle("is-open", open);
      var cta = $("#pb-cta"); if (cta && cta.firstChild) cta.firstChild.nodeValue = open ? "Close" : "Customize";
      try { localStorage.setItem("sc_pal_open", open ? "1" : "0"); } catch (e) {}
    }
    toggle.addEventListener("click", function () { setPanelOpen(panel.hidden); });
    try { if (localStorage.getItem("sc_pal_open") === "1") setPanelOpen(true); } catch (e) {}
    $("#pb-harmony").addEventListener("change", function () { work.harmony = this.value; regenFromAccent(); });
    $$("#pb-mode button").forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); regenFromAccent(); }); });
    $("#pb-apply").addEventListener("click", applyPalette);
    $("#pb-site").addEventListener("change", function () { brand.site = this.checked; saveBrand(); applySiteTheme(); });
    $("#pb-reset").addEventListener("click", resetPalette);
    $("#pb-copy").addEventListener("click", function () {
      var note = "\n\n/* Apply across the UI: accent = primary buttons/links, accent-2 = secondary emphasis, " +
        "bg = page, surface = cards, text/muted = copy. Palette: " + work.harmony + " harmony, " + work.mode + " UI. */";
      writeClipboard(paletteCss() + note).then(function () {
        var s = $("#pb-status"); s.textContent = "✓ Palette tokens copied — paste into your agent.";
        setTimeout(function () { s.textContent = ""; }, 4000);
      });
    });
    $("#pb-editdone").addEventListener("click", function () { $("#pb-editor").hidden = true; });
    var share = $("#pb-share");
    if (share) share.addEventListener("click", function () {
      writeClipboard(shareUrl()).then(function () {
        var s = $("#pb-status"); s.textContent = "🔗 Shareable palette link copied — anyone who opens it gets these exact colors.";
        setTimeout(function () { s.textContent = ""; }, 4000);
      });
    });
    var w = $("#pb-wheel");
    w.addEventListener("pointerdown", function (ev) { w.setPointerCapture(ev.pointerId); edWheelPick(ev); });
    w.addEventListener("pointermove", function (ev) { if (ev.buttons) edWheelPick(ev); });
    w.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowRight") ed.h = (ed.h + 6) % 360; else if (ev.key === "ArrowLeft") ed.h = (ed.h + 354) % 360;
      else if (ev.key === "ArrowUp") ed.s = Math.min(100, ed.s + 5); else if (ev.key === "ArrowDown") ed.s = Math.max(0, ed.s - 5);
      else return; ev.preventDefault(); setEditColor();
    });
    $("#pb-light").addEventListener("input", function () { ed.l = +this.value; setEditColor(); });
    $("#pb-hex").addEventListener("change", function () {
      if (/^#([0-9a-f]{3,8})$/i.test(this.value)) {
        work[ed.role] = toHex6(this.value); var hsl = hexToHsl(work[ed.role]); ed.h = hsl.h; ed.s = hsl.s; ed.l = hsl.l;
        $("#pb-light").value = hsl.l; placeEdMark(); commitWork();
      }
    });
    // Spacebar = shuffle (unless typing or an overlay is open) — bar-only, no glitch
    document.addEventListener("keydown", function (e) {
      if (e.code !== "Space" && e.key !== " ") return;
      var a = document.activeElement, tag = a && a.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable)) return;
      if (!$("#modal").hidden || !$("#cart").hidden) return;
      e.preventDefault(); shuffle();
    });
    // re-skin whatever was applied on a previous visit
    applyBrandEverywhere();
  }
  function openModal(id) {
    var e = findEffect(id);
    if (!e) return;
    $("#modal").setAttribute("data-eid", e.id);
    lastFocus = document.activeElement;
    $("#modal-theme").textContent = e.themeTitle;
    $("#modal-title").textContent = e.title;
    $("#modal-summary").textContent = e.summary;
    $("#modal-iframe").onload = applyAllToPreview;
    $("#modal-iframe").src = e.path;
    $("#open-new").href = e.path;
    loadSource(e);
    $("#modal-ai").textContent = e.ai_usage || "No AI notes provided.";
    $("#modal-details").innerHTML = detailsHtml(e);
    switchTab("preview");
    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
    updateBundleUI();
    setHash({ effect: e.id });
    $(".modal__close").focus();
  }
  function closeModal() {
    $("#modal").hidden = true;
    $("#modal-iframe").src = "about:blank";
    document.body.style.overflow = "";
    setHash({ effect: null });
    if (lastFocus) lastFocus.focus();
  }
  function detailsHtml(e) {
    function row(label, val) { return val ? "<dt>" + esc(label) + "</dt><dd>" + val + "</dd>" : ""; }
    function tags(arr) { return arr.map(function (t) { return '<span class="badge">' + esc(t) + "</span>"; }).join(""); }
    var dl = "<dl>";
    dl += row("Theme", esc(e.themeTitle));
    dl += row("Difficulty", esc(e.difficulty));
    dl += row("Era", esc(e.era));
    dl += row("Tech", '<div class="tag-list">' + tags(e.tech) + "</div>");
    dl += row("Categories", '<div class="tag-list">' + tags(e.categories) + "</div>");
    dl += row("Tags", '<div class="tag-list">' + tags(e.tags) + "</div>");
    dl += row("Dependencies", e.dependencies.length ? tags(e.dependencies) : "None — pure / vanilla");
    dl += row("Browser support", esc(e.browser_support));
    dl += row("Performance", esc(e.performance_notes));
    dl += row("Accessibility", esc(e.accessibility_notes));
    if (e.customization && e.customization.length) {
      dl += "<dt>Customization</dt><dd><ul style='margin:0;padding-left:1.1rem'>" +
        e.customization.map(function (c) {
          return "<li><code>" + esc(c.name) + "</code>" + (c.default ? " <small>(" + esc(c.default) + ")</small>" : "") + " — " + esc(c.description) + "</li>";
        }).join("") + "</ul></dd>";
    }
    if (e.variations && e.variations.length) {
      dl += "<dt>Variations</dt><dd><ul style='margin:0;padding-left:1.1rem'>" +
        e.variations.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul></dd>";
    }
    if (e.description) dl += row("Description", esc(e.description));
    var rel = (e.related || []).map(findEffect).filter(Boolean);
    if (rel.length) {
      dl += "<dt>Related</dt><dd><div class='tag-list'>" +
        rel.map(function (r) {
          return "<button type='button' class='badge badge--link' data-related='" + esc(r.id) + "'>" + esc(r.title) + "</button>";
        }).join("") + "</div></dd>";
    }
    dl += "</dl>";
    return dl;
  }
  function switchTab(name) {
    $$(".tab").forEach(function (t) { t.classList.toggle("is-active", t.dataset.tab === name); });
    $$(".tabpane").forEach(function (p) { p.classList.toggle("is-active", p.dataset.pane === name); });
  }

  /* ---------- hash routing ---------- */
  function setHash(patch) {
    var params = parseHash();
    Object.keys(patch).forEach(function (k) {
      if (patch[k] == null) delete params[k]; else params[k] = patch[k];
    });
    var str = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    history.replaceState(null, "", str ? "#" + str : location.pathname + location.search);
  }
  function parseHash() {
    var out = {};
    (location.hash.replace(/^#/, "")).split("&").forEach(function (p) {
      if (!p) return; var kv = p.split("="); out[kv[0]] = decodeURIComponent(kv[1] || "");
    });
    return out;
  }
  function syncHash() {
    var patch = { q: state.search || null };
    ["theme", "tech", "difficulty", "era", "tags"].forEach(function (k) {
      var vals = Array.from(state.filters[k]);
      patch[k] = vals.length ? vals.join("|") : null;
    });
    setHash(patch);
  }
  function applyHash() {
    var p = parseHash();
    if (p.q) { state.search = p.q; $("#search").value = p.q; $("#clear-search").hidden = false; }
    ["theme", "tech", "difficulty", "era", "tags"].forEach(function (k) {
      if (p[k]) p[k].split("|").forEach(function (v) { state.filters[k].add(v); });
    });
    if (p.effect) setTimeout(function () { openModal(p.effect); }, 0);
  }

  /* ---------- reset ---------- */
  function reset() {
    state.search = "";
    Object.keys(state.filters).forEach(function (k) { state.filters[k].clear(); });
    $("#search").value = "";
    $("#clear-search").hidden = true;
    syncHash(); render(); paintFilters();
  }

  /* ---------- surprise me (random effect, honouring filters) ---------- */
  function surprise() {
    var pool = CATALOG.effects.filter(matches);
    if (!pool.length) pool = CATALOG.effects;
    openModal(pool[Math.floor(Math.random() * pool.length)].id);
  }

  /* ---------- floating filters popover ---------- */
  var filtersLastFocus = null;
  function openFilters() {
    if (!$("#filters-panel").hidden) return;
    filtersLastFocus = document.activeElement;
    $("#filters-panel").hidden = false; $("#filters-scrim").hidden = false;
    var f = $("#filters-fab"); f.setAttribute("aria-expanded", "true"); f.classList.add("is-open");
    var close = $("#filters-panel-close"); if (close) close.focus();
  }
  function closeFilters() {
    if ($("#filters-panel").hidden) return;
    $("#filters-panel").hidden = true; $("#filters-scrim").hidden = true;
    var f = $("#filters-fab"); f.setAttribute("aria-expanded", "false"); f.classList.remove("is-open");
    if (filtersLastFocus && document.contains(filtersLastFocus)) filtersLastFocus.focus(); else f.focus();
  }
  function toggleFilters() { if ($("#filters-panel").hidden) openFilters(); else closeFilters(); }
  function clearFilters() {
    Object.keys(state.filters).forEach(function (k) { state.filters[k].clear(); });
    syncHash(); render(); paintFilters();
  }

  /* ---------- bundle (cart) ---------- */
  var BKEY = "sc_bundle";
  var bundle = (function () {
    try { return new Set(JSON.parse(localStorage.getItem(BKEY) || "[]")); } catch (e) { return new Set(); }
  })();
  function saveBundle() { try { localStorage.setItem(BKEY, JSON.stringify(Array.from(bundle))); } catch (e) {} }
  function inBundle(id) { return bundle.has(id); }
  function toggleBundle(id) {
    if (bundle.has(id)) bundle.delete(id); else bundle.add(id);
    saveBundle(); updateBundleUI(true);
  }
  function updateBundleUI(bump) {
    var n = bundle.size;
    var fab = $("#cart-fab");
    $("#cart-count").textContent = n;
    fab.hidden = n === 0;
    if (bump && n) { fab.classList.remove("bump"); void fab.offsetWidth; fab.classList.add("bump"); }
    $("#cart-n").textContent = n ? "(" + n + ")" : "";
    $$("[data-bundle-add]").forEach(function (b) {
      var on = inBundle(b.getAttribute("data-id"));
      b.classList.toggle("is-in", on); b.setAttribute("aria-pressed", on); b.textContent = on ? "✓" : "＋";
    });
    var mb = $("#modal-bundle"), eid = $("#modal").getAttribute("data-eid");
    if (mb && eid) {
      var on = inBundle(eid);
      mb.classList.toggle("is-in", on); mb.setAttribute("aria-pressed", on);
      mb.textContent = on ? "✓ In bundle" : "＋ Add to bundle";
    }
    if (!$("#cart").hidden) renderCartList();
  }
  function renderCartList() {
    var list = $("#cart-list"); list.innerHTML = "";
    if (!bundle.size) { list.innerHTML = '<p class="cart__empty">Your bundle is empty.<br>Hover any card and hit <b>＋</b> to add components.</p>'; return; }
    Array.from(bundle).forEach(function (id) {
      var e = findEffect(id); if (!e) return;
      var row = document.createElement("div"); row.className = "cart__item";
      row.innerHTML = '<span class="thumb"></span><span class="meta"><b>' + esc(e.title) + "</b><span>" +
        esc(e.themeTitle) + " · " + esc((e.tech || []).join(", ")) + "</span></span>" +
        '<button class="rm" title="Remove" aria-label="Remove ' + esc(e.title) + ' from bundle">✕</button>';
      row.querySelector(".rm").addEventListener("click", function () { toggleBundle(id); });
      list.appendChild(row);
    });
  }
  function openCart() {
    renderCartList();
    renderBundlePalette();
    var c = $("#cart"); c.hidden = false;
    requestAnimationFrame(function () { c.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
    $(".cart__close").focus();
  }
  function closeCart() {
    var c = $("#cart"); c.classList.remove("is-open");
    setTimeout(function () { c.hidden = true; }, 300);
    if ($("#modal").hidden) document.body.style.overflow = "";
  }
  function fetchFull(id) {
    return fetch("api/effects/" + encodeURIComponent(id) + ".json", { cache: "force-cache" })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  // Paste-ready prompt for a single effect, using the source/tokens already
  // loaded into the modal (T) so no extra fetch is needed.
  function buildEffectMarkdown(e) {
    var L = [];
    L.push("# " + e.title + "  —  " + (e.themeTitle || e.theme));
    L.push("");
    L.push("> Drop this self-contained component (HTML + CSS + a little vanilla JS, no build step or dependencies) into your project. Swap placeholder text/colors as noted.");
    L.push("> Everything you need is in the code block below — do **not** open, fetch, or try to verify any URL (the catalog is a browser-only gallery and will only stall an agent).");
    if (e.summary) { L.push(""); L.push(e.summary); }
    if (e.ai_usage) { L.push(""); L.push("**How to apply:** " + e.ai_usage); }
    var deps = (e.dependencies && e.dependencies.length) ? e.dependencies.join(", ") : "none (vanilla)";
    L.push(""); L.push("**Tech:** " + (e.tech || []).join(", ") + " · **Dependencies:** " + deps + (e.browser_support ? " · **Support:** " + e.browser_support : ""));
    if (e.customization && e.customization.length) {
      L.push(""); L.push("**Customize:** " + e.customization.map(function (c) {
        return "`" + c.name + "`" + (c.default ? " (" + c.default + ")" : "") + " — " + c.description;
      }).join("; "));
    }
    var eff = effectiveTokens(T.id, T.tokens);
    if (Object.keys(eff).length) L.push("\n_Customized tokens:_ " + Object.keys(eff).map(function (k) { return "`" + k + ": " + eff[k] + "`"; }).join(", "));
    L.push(""); L.push("```html"); L.push(applyTuned(T.source || "", eff) || "<!-- source unavailable — open the standalone page -->"); L.push("```");
    return L.join("\n");
  }
  function buildBundleMarkdown() {
    return Promise.all(Array.from(bundle).map(fetchFull)).then(function (items) {
      items = items.filter(Boolean);
      var L = [];
      L.push("# Style Catalog — Component Bundle (" + items.length + " item" + (items.length !== 1 ? "s" : "") + ")");
      L.push("");
      L.push("> Paste this whole document into your coding agent. Each component below is self-contained (HTML + CSS + a little vanilla JS, no build step or dependencies) and includes how to apply it. Swap placeholder text/colors as noted per item.");
      L.push("> Everything you need is inline below — do **not** open, fetch, or try to verify any URL (the catalog is a browser-only gallery and will only stall an agent).");
      L.push("> Source (attribution only — do not fetch): " + location.origin + location.pathname.replace(/index\.html$/, ""));
      items.forEach(function (e, i) {
        L.push(""); L.push("---"); L.push("");
        L.push("## " + (i + 1) + ". " + e.title + "  —  " + (e.themeTitle || e.theme));
        L.push("");
        if (e.summary) L.push(e.summary);
        if (e.ai_usage) { L.push(""); L.push("**How to apply:** " + e.ai_usage); }
        var deps = (e.dependencies && e.dependencies.length) ? e.dependencies.join(", ") : "none (vanilla)";
        L.push(""); L.push("**Tech:** " + (e.tech || []).join(", ") + " · **Dependencies:** " + deps + (e.browser_support ? " · **Support:** " + e.browser_support : ""));
        if (e.customization && e.customization.length) {
          L.push(""); L.push("**Customize:** " + e.customization.map(function (c) {
            return "`" + c.name + "`" + (c.default ? " (" + c.default + ")" : "") + " — " + c.description;
          }).join("; "));
        }
        var eff = effectiveTokens(e.id, parseRootTokens(e.source));
        if (Object.keys(eff).length) L.push("\n_Customized tokens:_ " + Object.keys(eff).map(function (k) { return "`" + k + ": " + eff[k] + "`"; }).join(", "));
        L.push(""); L.push("```html"); L.push(applyTuned(e.source || "", eff) || "<!-- source unavailable -->"); L.push("```");
      });
      L.push(""); L.push("---"); L.push("");
      L.push("_" + items.length + " component" + (items.length !== 1 ? "s" : "") + " bundled from the Style Catalog._");
      return L.join("\n");
    });
  }
  function writeClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); res(); } catch (e) { rej(e); } document.body.removeChild(ta);
    });
  }
  function copyBundle() {
    if (!bundle.size) return;
    var btn = $("#cart-copy"), status = $("#cart-status");
    btn.disabled = true;
    status.textContent = "Preparing " + bundle.size + " component" + (bundle.size !== 1 ? "s" : "") + "…";
    buildBundleMarkdown().then(function (md) {
      return writeClipboard(md).then(function () { status.textContent = "✓ Copied! Paste it into your agent."; });
    }).catch(function () { status.textContent = "Couldn't copy — try the .md download."; })
      .then(function () { btn.disabled = false; setTimeout(function () { status.textContent = ""; }, 5000); });
  }
  function downloadBundle() {
    if (!bundle.size) return;
    var status = $("#cart-status"); status.textContent = "Building file…";
    buildBundleMarkdown().then(function (md) {
      var blob = new Blob([md], { type: "text/markdown" }), url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = "style-catalog-bundle.md";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      status.textContent = "✓ Downloaded style-catalog-bundle.md";
      setTimeout(function () { status.textContent = ""; }, 5000);
    });
  }

  /* ---------- wire up ---------- */
  function init() {
    // Precompute a lowercased search haystack per effect (used by matchesExcept).
    CATALOG.effects.forEach(function (e) {
      e._hay = (e.title + " " + e.summary + " " + e.description + " " +
        e.tags.join(" ") + " " + e.categories.join(" ") + " " + e.themeTitle).toLowerCase();
    });
    renderStats();
    buildFilters();
    buildQuickChips();
    buildGrid();
    applyHash();
    render();
    paintFilters();

    $("#grid").addEventListener("keydown", gridKeydown);
    $("#surprise").addEventListener("click", surprise);

    $("#search").addEventListener("input", debounce(function (e) {
      state.search = e.target.value.trim();
      $("#clear-search").hidden = !state.search;
      syncHash(); render(); paintFilters();
    }, 120));
    $("#clear-search").addEventListener("click", function () {
      state.search = ""; $("#search").value = ""; this.hidden = true; syncHash(); render(); paintFilters();
    });
    $("#sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
    $("#reset").addEventListener("click", reset);
    $("#empty-reset").addEventListener("click", reset);

    // Floating filters popover
    $("#filters-fab").addEventListener("click", toggleFilters);
    $("#filters-panel-close").addEventListener("click", closeFilters);
    $("#filters-scrim").addEventListener("click", closeFilters);
    $("#filters-clear").addEventListener("click", clearFilters);

    $$("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
    $("#tabs").addEventListener("click", function (e) {
      var t = e.target.closest(".tab"); if (t) switchTab(t.dataset.tab);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#filters-panel").hidden) { closeFilters(); return; }
      if (e.key === "Escape" && !$("#cart").hidden) { closeCart(); return; }
      if (e.key === "Escape" && !$("#modal").hidden) closeModal();
      if (e.key === "/" && document.activeElement !== $("#search")) { e.preventDefault(); $("#search").focus(); }
      if (e.key === "Tab") {
        var panel = !$("#modal").hidden ? $(".modal__panel")
          : !$("#cart").hidden ? $(".cart__panel")
            : !$("#filters-panel").hidden ? $("#filters-panel") : null;
        if (panel) trapFocus(panel, e);
      }
    });

    // Bundle (cart) wiring
    $("#cart-fab").addEventListener("click", openCart);
    $$("[data-cart-close]").forEach(function (el) { el.addEventListener("click", closeCart); });
    $("#cart-copy").addEventListener("click", copyBundle);
    $("#cart-download").addEventListener("click", downloadBundle);
    $("#cart-clear").addEventListener("click", function () { bundle.clear(); saveBundle(); updateBundleUI(); });
    $("#modal-bundle").addEventListener("click", function () {
      var id = $("#modal").getAttribute("data-eid"); if (id) toggleBundle(id);
    });
    // Standalone palette bar (coolors-style) — re-skins the whole gallery live.
    initPaletteBar();
    updateBundleUI();
    $("#copy-source").addEventListener("click", function () {
      var text = $("#modal-source").textContent;
      var done = function () { var s = $("#copy-status"); s.textContent = "Copied!"; setTimeout(function () { s.textContent = ""; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallbackCopy);
      } else fallbackCopy();
      function fallbackCopy() {
        var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta);
        ta.select(); try { document.execCommand("copy"); done(); } catch (e) {} document.body.removeChild(ta);
      }
    });
    $("#copy-ai").addEventListener("click", function () {
      var e = findEffect($("#modal").getAttribute("data-eid")); if (!e) return;
      var status = $("#copy-ai-status");
      writeClipboard(buildEffectMarkdown(e))
        .then(function () { status.textContent = "✓ Copied! Paste it into your agent."; })
        .catch(function () { status.textContent = "Couldn't copy — use the Source tab."; });
      setTimeout(function () { status.textContent = ""; }, 2400);
    });
    // Related-effect chips inside the Details tab open that effect.
    $("#modal-details").addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-related]"); if (b) openModal(b.getAttribute("data-related"));
    });
    initShipCursor();
  }

  /* ---------- spaceship cursor ----------
     A little ship replaces the pointer on the museum chrome: it glides toward
     the real cursor (a touch of lag for a flying feel), banks its nose toward
     the direction of travel, and leaves a fading thruster trail on a full-screen
     canvas. Fine-pointer + motion only — touch and reduced-motion keep the
     native cursor untouched. The hull is tinted with the live brand accents. */
  function initShipCursor() {
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    var canvas = document.createElement("canvas");
    canvas.id = "ship-fx";
    var ship = document.createElement("div");
    ship.id = "ship-cursor";
    // Nose points up (-Y); the wrapper is rotated to face travel direction.
    ship.innerHTML =
      '<svg viewBox="-26 -28 52 56" width="52" height="56" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="shipHull" x1="0" y1="-18" x2="0" y2="14" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="var(--accent,#7c5cff)"/>' +
            '<stop offset="1" stop-color="var(--accent-2,#2dd4bf)"/>' +
          '</linearGradient>' +
          // Glow baked as a gradient (no CSS filter → no per-frame re-raster).
          '<radialGradient id="shipGlow">' +
            '<stop offset="0" stop-color="var(--accent-2,#2dd4bf)" stop-opacity=".5"/>' +
            '<stop offset="1" stop-color="var(--accent-2,#2dd4bf)" stop-opacity="0"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<circle class="ship__glow" cx="0" cy="0" r="24" fill="url(#shipGlow)"/>' +
        // exhaust flame
        '<polygon class="ship__flame" points="-4,11 0,26 4,11"/>' +
        // hull
        '<path class="ship__hull" d="M0,-17 L9,9 L4,13 L0,9 L-4,13 L-9,9 Z" fill="url(#shipHull)"/>' +
        // cockpit
        '<ellipse class="ship__glass" cx="0" cy="-3" rx="3.1" ry="5"/>' +
      "</svg>";

    // dpr 1 for the trail canvas: soft particles don't need retina density, and
    // clearing/compositing a full-screen 2× layer every frame is what drops FPS.
    var ctx = canvas.getContext("2d"), dpr = 1;
    function resize() {
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize); resize();

    document.body.appendChild(canvas);
    document.body.appendChild(ship);
    document.documentElement.classList.add("has-ship-cursor");

    var tx = innerWidth / 2, ty = innerHeight / 2;   // target (real pointer)
    var sx = tx, sy = ty;                             // ship (eased)
    var angle = -Math.PI / 2;
    var particles = [], seen = false, raf = null, last = 0;

    // Cache the brand accents instead of reading them (getComputedStyle forces a
    // style flush) every frame — refresh occasionally so palette changes apply.
    var colA = "#7c5cff", colB = "#2dd4bf", colFrame = 0;
    function refreshColors() {
      var cs = getComputedStyle(document.documentElement);
      colA = (cs.getPropertyValue("--accent").trim()) || colA;
      colB = (cs.getPropertyValue("--accent-2").trim()) || colB;
    }
    refreshColors();

    function onMove(e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; sx = tx; sy = ty; document.documentElement.classList.add("ship-awake"); }
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    }
    function onLeave() { document.documentElement.classList.remove("ship-awake"); }
    function onEnter() { if (seen) document.documentElement.classList.add("ship-awake"); }
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    // Ships salute interactive targets with a little boost glow.
    window.addEventListener("pointerover", function (e) {
      ship.classList.toggle("ship--boost", !!e.target.closest && !!e.target.closest("a,button,input,select,.card,.chip,[role=button]"));
    }, { passive: true });

    function tick(now) {
      // Frame-rate-independent smoothing: ease a *time* constant, not a fixed
      // per-frame fraction, so it feels identical at 60 / 120 / 144 Hz and never
      // stutters. dt clamped so a long pause (tab blur) can't teleport the ship.
      var dt = last ? Math.min(64, now - last) : 16; last = now;
      var kPos = 1 - Math.exp(-dt / 34);   // ~34 ms follow → snappy, slight glide
      var kRot = 1 - Math.exp(-dt / 60);   // banking a touch lazier than position

      var dx = tx - sx, dy = ty - sy;
      var gap = Math.hypot(dx, dy);
      sx += dx * kPos; sy += dy * kPos;
      // px/frame-equivalent speed (for thrust + trail), independent of dt.
      var speed = gap * kPos * (16.67 / dt);

      // Bank the nose toward travel; when nearly still, hold the last heading.
      if (gap > 1.5) {
        var target = Math.atan2(dy, dx) + Math.PI / 2;
        var da = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        angle += da * kRot;
      }
      ship.style.transform = "translate3d(" + sx.toFixed(2) + "px," + sy.toFixed(2) + "px,0) rotate(" + angle.toFixed(4) + "rad)";
      ship.style.setProperty("--thrust", Math.min(1, speed / 9).toFixed(2));

      // Emit exhaust from the tail, opposite the nose, scaled by speed and dt.
      if (speed > 0.6) {
        var tailA = angle + Math.PI / 2; // nose-up offset → tail direction
        // Anchor is the nose now, so emit from the tail ~33px behind it.
        var ex = sx + Math.cos(tailA) * 33, ey = sy + Math.sin(tailA) * 33;
        var n = Math.min(4, Math.round((1 + speed / 5) * (dt / 16.67)));
        var bvx = -dx * kPos * 0.25, bvy = -dy * kPos * 0.25;
        for (var i = 0; i < n; i++) {
          particles.push({
            x: ex, y: ey,
            vx: bvx + (Math.random() - 0.5) * 1.2,
            vy: bvy + (Math.random() - 0.5) * 1.2,
            life: 1, r: 1.5 + Math.random() * 2.5,
          });
        }
      }
      if (particles.length > 240) particles.splice(0, particles.length - 240);
      if ((colFrame = (colFrame + 1) % 20) === 0) refreshColors();

      // Decay scaled to dt so the trail fades at a consistent wall-clock rate.
      var decay = 0.035 * (dt / 16.67), fric = Math.pow(0.94, dt / 16.67);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = "lighter";
      for (var j = particles.length - 1; j >= 0; j--) {
        var p = particles[j];
        p.x += p.vx; p.y += p.vy; p.vx *= fric; p.vy *= fric; p.life -= decay;
        if (p.life <= 0) { particles.splice(j, 1); continue; }
        ctx.globalAlpha = p.life * 0.7;
        ctx.fillStyle = p.life > 0.6 ? "#fff" : (p.life > 0.3 ? colB : colA);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.4 + p.life), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

      // Keep animating while moving or while exhaust lingers; otherwise idle.
      if (gap > 0.3 || particles.length) raf = requestAnimationFrame(tick);
      else raf = null;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
