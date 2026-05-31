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
  function loadSource(e) {
    var pre = $("#modal-source");
    if (e.source) { pre.textContent = e.source; return; }
    pre.textContent = "Loading source…";
    var want = e.id;
    fetch("api/effects/" + encodeURIComponent(e.id) + ".json", { cache: "force-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (full) {
        if ($("#modal").getAttribute("data-eid") !== want) return; // modal changed
        pre.textContent = (full && full.source) ? full.source :
          "// Source unavailable here — open the standalone page to view it.";
      })
      .catch(function () {
        if ($("#modal").getAttribute("data-eid") === want)
          pre.textContent = "// Could not load source (offline?). Open the standalone page.";
      });
  }
  function openModal(id) {
    var e = findEffect(id);
    if (!e) return;
    $("#modal").setAttribute("data-eid", e.id);
    lastFocus = document.activeElement;
    $("#modal-theme").textContent = e.themeTitle;
    $("#modal-title").textContent = e.title;
    $("#modal-summary").textContent = e.summary;
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
        L.push(""); L.push("```html"); L.push(e.source || "<!-- source unavailable -->"); L.push("```");
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
