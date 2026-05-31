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
    sort: "theme",
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
        var b = document.createElement("button");
        b.className = "chip" + (state.filters[key].has(value) ? " is-on" : "");
        b.innerHTML = esc(label) + ' <span class="chip__count">' + it.count + "</span>";
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
    Object.keys(facetEls).forEach(function (k) { if (facetEls[k]._paint) facetEls[k]._paint(); });
    renderActive();
  }

  /* ---------- matching ---------- */
  function matches(e) {
    var f = state.filters;
    if (f.theme.size && !f.theme.has(e.theme)) return false;
    if (f.difficulty.size && !f.difficulty.has(e.difficulty)) return false;
    if (f.era.size && !f.era.has(e.era)) return false;
    if (f.tech.size && !e.tech.some(function (t) { return f.tech.has(t); })) return false;
    if (f.tags.size && !e.tags.some(function (t) { return f.tags.has(t); })) return false;
    if (state.search) {
      var q = state.search.toLowerCase();
      var hay = (e.title + " " + e.summary + " " + e.description + " " +
        e.tags.join(" ") + " " + e.categories.join(" ") + " " + e.themeTitle).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sortEffects(list) {
    var s = state.sort;
    return list.slice().sort(function (a, b) {
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
        '<iframe loading="lazy" sandbox="allow-scripts allow-same-origin" title="' + esc(e.title) + '" src="' + esc(e.path) + '"></iframe>' +
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
    var ifr = el.querySelector(".card__frame iframe");
    if (ifr) ifr.addEventListener("load", function () { applyFrame(ifr); });
    return el;
  }

  function render() {
    var list = sortEffects(CATALOG.effects.filter(matches));
    var grid = $("#grid");
    grid.innerHTML = "";
    list.forEach(function (e) { grid.appendChild(card(e)); });
    $("#result-count").textContent = list.length + (list.length === 1 ? " effect" : " effects");
    $("#empty").hidden = list.length !== 0;
    renderActive();
  }

  function renderActive() {
    var parts = [];
    Object.keys(state.filters).forEach(function (k) {
      state.filters[k].forEach(function (v) { parts.push(v); });
    });
    if (state.search) parts.unshift('“' + state.search + '”');
    $("#active-filters").textContent = parts.length ? "· " + parts.join(", ") : "";
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
    if (brand.on) {
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
  function genPalette(h, s, l, harmony, mode) {
    var dark = mode !== "light";
    var h2 = harmony === "complementary" ? h + 180 : harmony === "analogous" ? h + 30 : harmony === "triadic" ? h + 120 : h;
    h2 = (h2 % 360 + 360) % 360;
    var l2 = harmony === "monochrome" ? Math.min(86, l + 16) : l;
    return {
      accent: hslToHex(h, s, l), accent2: hslToHex(h2, Math.max(40, s - 5), l2),
      bg: dark ? hslToHex(h, 18, 8) : hslToHex(h, 40, 97),
      surface: dark ? hslToHex(h, 16, 13) : hslToHex(h, 30, 93),
      text: dark ? hslToHex(h, 12, 93) : hslToHex(h, 25, 12),
      muted: dark ? hslToHex(h, 10, 62) : hslToHex(h, 15, 42)
    };
  }
  // ---- apply the palette onto every gallery iframe (and the modal preview) ----
  // Rather than detect each sample's token names, we inject one <style> that
  // blanket-defines every brand-role alias on :root with !important. It overrides
  // whatever subset of those names the sample actually uses (and harmlessly
  // defines the rest) — far more robust across 172 hand-built samples than
  // sniffing computed values (which also misses rgb()/hsl()/gradient tokens).
  function paletteStyleText() {
    var rules = [];
    BRAND_ROLES.forEach(function (role) {
      var v = brand[role.key]; if (!v) return;
      role.aliases.forEach(function (al) { rules.push("--" + al + ":" + v + " !important;"); });
    });
    return ":root{" + rules.join("") + "}";
  }
  function applyFrame(fr) {
    var doc; try { doc = fr.contentDocument; } catch (e) { return; }
    if (!doc || !doc.head) return;
    var st = doc.getElementById("sc-pal");
    if (!brand.on) { if (st) st.parentNode.removeChild(st); return; }
    if (!st) { st = doc.createElement("style"); st.id = "sc-pal"; doc.head.appendChild(st); }
    st.textContent = paletteStyleText();
  }
  function applyBrandEverywhere() {
    $$(".card__frame iframe").forEach(applyFrame);
    applyAllToPreview();
  }
  var _palRaf = null;
  function scheduleApply() { if (_palRaf) return; _palRaf = requestAnimationFrame(function () { _palRaf = null; applyBrandEverywhere(); }); }
  function paletteCss() {
    return ":root {\n" +
      "  --accent: " + brand.accent + ";     /* primary actions, links */\n" +
      "  --accent-2: " + brand.accent2 + ";  /* secondary accent */\n" +
      "  --bg: " + brand.bg + ";         /* page background */\n" +
      "  --surface: " + brand.surface + ";    /* cards & panels */\n" +
      "  --text: " + brand.text + ";       /* body text */\n" +
      "  --muted: " + brand.muted + ";      /* secondary text */\n" +
      "  --radius: " + (brand.radius || "14px") + ";\n}";
  }
  function renderPaletteBar() {
    var host = $("#pb-swatches"); if (!host) return;
    host.innerHTML = "";
    PAL_ROLES.forEach(function (role) {
      var val = brand[role.key] || role.def, locked = brand.locks && brand.locks[role.key];
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
        var k = b.getAttribute("data-lock"); brand.locks = brand.locks || {}; brand.locks[k] = !brand.locks[k];
        saveBrand(); renderPaletteBar();
      });
    });
    var prev = $("#pb-preview");
    if (prev) prev.innerHTML = PAL_ROLES.map(function (r) { return '<i style="background:' + esc(brand[r.key] || r.def) + '"></i>'; }).join("");
    var ad = $("#pb-adapt"); if (ad) ad.checked = !!brand.on;
    renderBundlePalette();
  }
  function renderBundlePalette() {
    var host = $("#bp-swatches"); if (!host) return;
    host.innerHTML = PAL_ROLES.map(function (r) {
      var v = brand[r.key] || r.def; return '<span class="bp__sw" title="' + r.label + " " + esc(v) + '"><i style="background:' + esc(v) + '"></i></span>';
    }).join("") + '<span class="bp__state">' + (brand.on ? "baked into this bundle’s code ✓" : "not applied — turn on “Adapt gallery” up top") + "</span>";
  }
  function persistPalette() { saveBrand(); renderPaletteBar(); scheduleApply(); renderSourcePane(); }
  function regenFromAccent() {
    var hsl = hexToHsl(brand.accent || "#7c5cff"), gen = genPalette(hsl.h, hsl.s, hsl.l, brand.harmony, brand.mode);
    PAL_ROLES.forEach(function (role) { if (role.key !== "accent" && !(brand.locks && brand.locks[role.key])) brand[role.key] = gen[role.key]; });
    brand.on = true; persistPalette();
  }
  function shuffle() {
    var h = (brand.locks && brand.locks.accent && brand.accent) ? hexToHsl(brand.accent).h : Math.floor(Math.random() * 360);
    var s = 62 + Math.floor(Math.random() * 28), l = 52 + Math.floor(Math.random() * 12);
    var gen = genPalette(h, s, l, brand.harmony || "complementary", brand.mode || "dark");
    PAL_ROLES.forEach(function (role) { if (!(brand.locks && brand.locks[role.key])) brand[role.key] = gen[role.key]; });
    brand.on = true; persistPalette();
  }
  function setMode(m) { brand.mode = m; $$("#pb-mode button").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-mode") === m); }); }
  function resetPalette() {
    var g = genPalette(262, 85, 58, "complementary", "dark");
    brand = { on: false, harmony: "complementary", mode: "dark", locks: {}, radius: "14px" };
    PAL_ROLES.forEach(function (r) { brand[r.key] = g[r.key]; });
    setMode("dark"); if ($("#pb-harmony")) $("#pb-harmony").value = "complementary";
    saveBrand(); renderPaletteBar(); applyBrandEverywhere(); renderSourcePane();
    $("#pb-editor").hidden = true;
  }
  // ---- per-swatch wheel editor ----
  var ed = { role: "accent", h: 262, s: 85, l: 58 };
  function placeEdMark() {
    var w = $("#pb-wheel"), mk = $("#pb-mark"); if (!w || !mk) return;
    var R = w.clientWidth / 2, rr = (ed.s / 100) * R, rad = ed.h * Math.PI / 180;
    mk.style.left = (R + rr * Math.sin(rad)) + "px"; mk.style.top = (R - rr * Math.cos(rad)) + "px";
    mk.style.background = hslToHex(ed.h, ed.s, ed.l);
  }
  function setEditColor() {
    brand[ed.role] = hslToHex(ed.h, ed.s, ed.l); brand.on = true;
    if ($("#pb-hex")) $("#pb-hex").value = brand[ed.role];
    placeEdMark(); persistPalette();
  }
  function openEditor(role) {
    ed.role = role; var hsl = hexToHsl(brand[role] || "#888888"); ed.h = hsl.h; ed.s = hsl.s; ed.l = hsl.l;
    var roleObj = PAL_ROLES.filter(function (r) { return r.key === role; })[0];
    $("#pb-editrole").textContent = roleObj ? roleObj.label : role;
    $("#pb-light").value = hsl.l; $("#pb-hex").value = brand[role] || "";
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
    if (!brand.accent) { var g = genPalette(262, 85, 58, "complementary", "dark"); PAL_ROLES.forEach(function (r) { brand[r.key] = g[r.key]; }); brand.on = false; }
    PAL_ROLES.forEach(function (r) { if (!brand[r.key]) brand[r.key] = r.def; });
    brand.radius = brand.radius || "14px"; brand.harmony = brand.harmony || "complementary";
    brand.mode = brand.mode || "dark"; brand.locks = brand.locks || {};
    saveBrand();
    if ($("#pb-harmony")) $("#pb-harmony").value = brand.harmony;
    setMode(brand.mode);
    renderPaletteBar();
    var ph = $("#pb-presets");
    if (ph) PRESETS.forEach(function (pre) {
      var b = document.createElement("button"); b.className = "pb__preset"; b.type = "button";
      b.title = pre.n + " palette"; b.setAttribute("aria-label", pre.n + " palette");
      b.style.background = hslToHex(pre.h, pre.s, pre.l);
      b.addEventListener("click", function () {
        var gen = genPalette(pre.h, pre.s, pre.l, brand.harmony || "complementary", pre.mode);
        PAL_ROLES.forEach(function (r) { brand[r.key] = gen[r.key]; });
        setMode(pre.mode); brand.on = true; persistPalette();
      });
      ph.appendChild(b);
    });
    $("#pb-shuffle").addEventListener("click", shuffle);
    $("#pb-quick-shuffle").addEventListener("click", shuffle);
    // collapsed by default — expand the panel on click
    var toggle = $("#pb-toggle"), panel = $("#pb-panel");
    toggle.addEventListener("click", function () {
      var open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      $("#palettebar").classList.toggle("is-open", open);
      var cta = $("#pb-cta"); if (cta && cta.firstChild) cta.firstChild.nodeValue = open ? "Close" : "Customize";
    });
    $("#pb-harmony").addEventListener("change", function () { brand.harmony = this.value; regenFromAccent(); });
    $$("#pb-mode button").forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); regenFromAccent(); }); });
    $("#pb-adapt").addEventListener("change", function () { brand.on = this.checked; saveBrand(); applyBrandEverywhere(); renderSourcePane(); renderBundlePalette(); });
    $("#pb-reset").addEventListener("click", resetPalette);
    $("#pb-copy").addEventListener("click", function () {
      var note = "\n\n/* Apply across the UI: accent = primary buttons/links, accent-2 = secondary emphasis, " +
        "bg = page, surface = cards, text/muted = copy. Palette: " + brand.harmony + " harmony, " + brand.mode + " UI. */";
      writeClipboard(paletteCss() + note).then(function () {
        var s = $("#pb-status"); s.textContent = "✓ Palette tokens copied — paste into your agent.";
        setTimeout(function () { s.textContent = ""; }, 4000);
      });
    });
    $("#pb-editdone").addEventListener("click", function () { $("#pb-editor").hidden = true; });
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
        brand[ed.role] = toHex6(this.value); var hsl = hexToHsl(brand[ed.role]); ed.h = hsl.h; ed.s = hsl.s; ed.l = hsl.l;
        $("#pb-light").value = hsl.l; placeEdMark(); brand.on = true; persistPalette();
      }
    });
    // Spacebar = shuffle (unless typing or an overlay is open)
    document.addEventListener("keydown", function (e) {
      if (e.code !== "Space" && e.key !== " ") return;
      var a = document.activeElement, tag = a && a.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable)) return;
      if (!$("#modal").hidden || !$("#cart").hidden) return;
      e.preventDefault(); shuffle();
    });
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
  function buildBundleMarkdown() {
    return Promise.all(Array.from(bundle).map(fetchFull)).then(function (items) {
      items = items.filter(Boolean);
      var L = [];
      L.push("# Style Catalog — Component Bundle (" + items.length + " item" + (items.length !== 1 ? "s" : "") + ")");
      L.push("");
      L.push("> Paste this whole document into your coding agent. Each component below is self-contained (HTML + CSS + a little vanilla JS, no build step or dependencies) and includes how to apply it. Swap placeholder text/colors as noted per item.");
      L.push("> Source: " + location.origin + location.pathname.replace(/index\.html$/, ""));
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
    renderStats();
    buildFilters();
    applyHash();
    render();
    paintFilters();

    $("#search").addEventListener("input", debounce(function (e) {
      state.search = e.target.value.trim();
      $("#clear-search").hidden = !state.search;
      syncHash(); render();
    }, 120));
    $("#clear-search").addEventListener("click", function () {
      state.search = ""; $("#search").value = ""; this.hidden = true; syncHash(); render();
    });
    $("#sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
    $("#reset").addEventListener("click", reset);
    $("#empty-reset").addEventListener("click", reset);

    $$("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
    $("#tabs").addEventListener("click", function (e) {
      var t = e.target.closest(".tab"); if (t) switchTab(t.dataset.tab);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#cart").hidden) { closeCart(); return; }
      if (e.key === "Escape" && !$("#modal").hidden) closeModal();
      if (e.key === "/" && document.activeElement !== $("#search")) { e.preventDefault(); $("#search").focus(); }
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
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
