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
    el.innerHTML =
      '<div class="card__frame">' +
        '<iframe loading="lazy" sandbox="allow-scripts allow-same-origin" title="' + esc(e.title) + '" src="' + esc(e.path) + '"></iframe>' +
        '<div class="card__scrim"></div>' +
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
    el.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); } });
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
  function openModal(id) {
    var e = findEffect(id);
    if (!e) return;
    lastFocus = document.activeElement;
    $("#modal-theme").textContent = e.themeTitle;
    $("#modal-title").textContent = e.title;
    $("#modal-summary").textContent = e.summary;
    $("#modal-iframe").src = e.path;
    $("#open-new").href = e.path;
    $("#modal-source").textContent = e.source;
    $("#modal-ai").textContent = e.ai_usage || "No AI notes provided.";
    $("#modal-details").innerHTML = detailsHtml(e);
    switchTab("preview");
    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
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
      if (e.key === "Escape" && !$("#modal").hidden) closeModal();
      if (e.key === "/" && document.activeElement !== $("#search")) { e.preventDefault(); $("#search").focus(); }
    });
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
