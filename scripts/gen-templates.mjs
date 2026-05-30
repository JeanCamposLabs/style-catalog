// Premium template generator.
// Composes self-contained, full-page website templates from a library of
// palettes + premium section blocks, weaving in catalog effects (animated
// gradient background, glassmorphic nav, scroll-reveal, card hover-lift,
// scroll-progress bar, gradient text). Each output is a standalone HTML file
// with valid effect-meta so it joins the catalog.
//
// Usage: node scripts/gen-templates.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "effects", "website-templates");
mkdirSync(OUT, { recursive: true });

/* ----------------------------- palettes ----------------------------- */
const P = {
  midnight: { name: "Midnight", dark: 1, bg: "#0b0d12", surface: "#11141c", surface2: "#161a26", line: "#242a3b", text: "#e8ecf6", muted: "#8b93a7", a: "#7c5cff", b: "#2dd4bf", font: "system-ui,-apple-system,Segoe UI,sans-serif", head: "" , radius: "16px" },
  aurora: { name: "Aurora", dark: 1, bg: "#0a0a14", surface: "#12121f", surface2: "#181828", line: "#262640", text: "#f0eefb", muted: "#9a93b5", a: "#ff5da2", b: "#22d3ee", font: "system-ui,sans-serif", head: "", radius: "18px" },
  glass: { name: "Glass", dark: 1, bg: "#0c1322", surface: "rgba(255,255,255,.06)", surface2: "rgba(255,255,255,.09)", line: "rgba(255,255,255,.14)", text: "#eaf2ff", muted: "#9db4d6", a: "#5b8cff", b: "#37e6e6", font: "system-ui,sans-serif", head: "", radius: "18px", glass: 1 },
  neon: { name: "Neon", dark: 1, bg: "#05060a", surface: "#0c0f17", surface2: "#10141f", line: "#1c2433", text: "#d7ffe9", muted: "#6f8c89", a: "#39ff14", b: "#ff00e5", font: "ui-monospace,Menlo,Consolas,monospace", head: "ui-monospace,monospace", radius: "8px" },
  forest: { name: "Forest", dark: 1, bg: "#0c1410", surface: "#101b15", surface2: "#15241c", line: "#1f3328", text: "#e7f3ea", muted: "#8aa595", a: "#5cd67a", b: "#d9b25c", font: "system-ui,sans-serif", head: "", radius: "14px" },
  ocean: { name: "Ocean", dark: 1, bg: "#071420", surface: "#0c1d2c", surface2: "#102536", line: "#1a3346", text: "#e4f2fb", muted: "#86a6bd", a: "#26c6da", b: "#7c9cff", font: "system-ui,sans-serif", head: "", radius: "16px" },
  paper: { name: "Paper", dark: 0, bg: "#faf9f6", surface: "#ffffff", surface2: "#f3f1ea", line: "#e7e3da", text: "#1a1c22", muted: "#6b7280", a: "#5b3ee0", b: "#0ea5a5", font: "system-ui,sans-serif", head: "Georgia,'Times New Roman',serif", radius: "14px" },
  mono: { name: "Mono", dark: 0, bg: "#ffffff", surface: "#ffffff", surface2: "#f5f5f5", line: "#e5e5e5", text: "#0a0a0a", muted: "#737373", a: "#0a0a0a", b: "#525252", font: "system-ui,sans-serif", head: "", radius: "6px", flat: 1 },
  pastel: { name: "Pastel", dark: 0, bg: "#fbf7ff", surface: "#ffffff", surface2: "#f4ecff", line: "#ecdcff", text: "#2a2340", muted: "#7c7196", a: "#a78bfa", b: "#5eead4", font: "system-ui,sans-serif", head: "", radius: "20px" },
  sunset: { name: "Sunset", dark: 0, bg: "#fff8f1", surface: "#ffffff", surface2: "#ffeede", line: "#ffd9bf", text: "#2b1d16", muted: "#8a6f5e", a: "#f97316", b: "#e11d48", font: "system-ui,sans-serif", head: "", radius: "16px" },
  corporate: { name: "Corporate", dark: 0, bg: "#f6f8fb", surface: "#ffffff", surface2: "#eef3f9", line: "#dde6f0", text: "#0f1d33", muted: "#5a6b85", a: "#2563eb", b: "#0891b2", font: "system-ui,sans-serif", head: "", radius: "12px" },
  brutalist: { name: "Brutalist", dark: 0, bg: "#ffe14d", surface: "#ffffff", surface2: "#fff7cc", line: "#111111", text: "#111111", muted: "#3a3a2a", a: "#ff5da2", b: "#37e6e6", font: "Arial Black,Helvetica,sans-serif", head: "Arial Black,sans-serif", radius: "0px", brut: 1 },
};

const grad = (p) => `linear-gradient(120deg,${p.a},${p.b})`;
const ph = (p, i = 0) => {
  const sets = [[p.a, p.b], [p.b, p.a], ["#a78bfa", "#22d3ee"], ["#fb7185", "#fbbf24"], ["#34d399", "#0ea5e9"], ["#f472b6", "#a78bfa"]];
  const [x, y] = sets[i % sets.length];
  return `linear-gradient(135deg,${x},${y})`;
};

/* ----------------------------- shared CSS ----------------------------- */
function baseCSS(p) {
  const shadow = p.brut ? "6px 6px 0 #111" : p.dark ? "0 12px 40px rgba(0,0,0,.45)" : "0 12px 34px rgba(20,20,50,.10)";
  const cardBg = p.glass ? p.surface : p.surface;
  const border = p.brut ? "3px solid #111" : `1px solid ${p.line}`;
  return `
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:${p.bg};color:${p.text};font-family:${p.font};line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%}a{color:inherit;text-decoration:none}
.wrap{max-width:1140px;margin:0 auto;padding:0 1.3rem}
h1,h2,h3{line-height:1.1;${p.head ? `font-family:${p.head};` : ""}margin:0 0 .5rem}
h1{font-size:clamp(2.2rem,6vw,4rem);font-weight:${p.brut ? 900 : 800}${p.brut ? ";text-transform:uppercase" : ""}}
h2{font-size:clamp(1.7rem,3.6vw,2.6rem);font-weight:800${p.brut ? ";text-transform:uppercase" : ""}}
p{margin:0 0 1rem}
.grad{background:${grad(p)};-webkit-background-clip:text;background-clip:text;color:transparent}
.eyebrow{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:${p.dark ? p.b : p.a}}
.muted{color:${p.muted}}
.prog{position:fixed;top:0;left:0;height:3px;width:0;background:${grad(p)};z-index:99}
nav.bar{position:sticky;top:0;z-index:40;border-bottom:${border};background:${p.glass ? "rgba(12,19,34,.6)" : p.brut ? p.bg : (p.dark ? p.bg + "cc" : p.bg + "e6")};backdrop-filter:blur(12px)}
nav.bar .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.brand{font-weight:900;font-size:1.15rem;display:flex;align-items:center;gap:.5rem}
.brand .dot{width:22px;height:22px;border-radius:${p.brut ? "0" : "7px"};background:${grad(p)};${p.brut ? "border:2px solid #111;" : ""}display:inline-block}
.navlinks{display:flex;gap:1.5rem;align-items:center}
.navlinks a{color:${p.muted};font-size:.92rem;font-weight:600}
.navlinks a:hover{color:${p.text}}
.btn{display:inline-block;cursor:pointer;font-weight:700;border-radius:${p.radius};padding:.78rem 1.5rem;border:${p.brut ? "3px solid #111" : "1px solid transparent"};background:${grad(p)};color:#fff;transition:transform .12s,box-shadow .12s,filter .12s;${p.brut ? "box-shadow:4px 4px 0 #111;color:#111" : ""}}
.btn:hover{transform:translateY(-2px);filter:brightness(1.06)${p.brut ? "" : ";box-shadow:0 10px 24px " + (p.dark ? "rgba(0,0,0,.5)" : "rgba(80,60,200,.25)")}}
.btn.ghost{background:${p.brut ? p.surface : "transparent"};color:${p.text};border:${border}${p.brut ? ";box-shadow:4px 4px 0 #111" : ""}}
.btn:focus-visible,.navlinks a:focus-visible{outline:3px solid ${p.b};outline-offset:2px}
.sec{padding:clamp(3rem,7vw,5.5rem) 0}
.sec.tint{background:${p.surface2}}
.center{text-align:center}.lead{max-width:60ch;margin-inline:auto;font-size:1.12rem}
.grid{display:grid;gap:1.2rem}
.card{background:${cardBg};border:${border};border-radius:${p.radius};padding:1.4rem;${p.glass ? "backdrop-filter:blur(10px);" : ""}box-shadow:${p.flat ? "none" : shadow};transition:transform .18s,box-shadow .18s}
.card.lift:hover{transform:translateY(-7px)}
.ph{border-radius:${p.radius};${p.brut ? "border:3px solid #111;" : ""}aspect-ratio:16/10;display:block}
.tag{display:inline-block;font-size:.75rem;padding:.2rem .6rem;border-radius:999px;background:${p.surface2};color:${p.muted};border:${p.brut ? "2px solid #111" : "1px solid " + p.line}}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1)}
.reveal.in{opacity:1;transform:none}
.kpi{font-size:clamp(2rem,5vw,3.2rem);font-weight:900;${p.dark ? "" : ""}}
details{border-top:${border};padding:1rem 0}details summary{cursor:pointer;font-weight:700;list-style:none;display:flex;justify-content:space-between}
details summary::-webkit-details-marker{display:none}details[open] summary{color:${p.dark ? p.b : p.a}}
footer.ft{border-top:${border};background:${p.surface2}}
footer.ft .wrap{padding:2.4rem 1.3rem}
.fcols{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:1.5rem}
.fcols a{display:block;color:${p.muted};padding:.2rem 0;font-size:.9rem}
.hero-bg{position:relative;overflow:hidden}
.hero-bg::before{content:"";position:absolute;inset:-30% -10% auto;height:70vmax;background:radial-gradient(closest-side,${p.a}40,transparent 70%),radial-gradient(closest-side,${p.b}33,transparent 70%);background-position:30% 0,80% 10%;background-repeat:no-repeat;filter:blur(10px);animation:float 16s ease-in-out infinite;pointer-events:none}
@keyframes float{50%{transform:translateY(40px) scale(1.05)}}
@media(max-width:820px){.navlinks{display:none}.fcols{grid-template-columns:1fr 1fr}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto}.reveal{opacity:1;transform:none;transition:none}.hero-bg::before{animation:none}}
`;
}

const sharedJS = `<script>
(function(){
  var bar=document.querySelector('.prog');
  function sp(){if(!bar)return;var h=document.documentElement;var m=h.scrollHeight-h.clientHeight;bar.style.width=(m>0?(h.scrollTop/m*100):0)+'%';}
  document.addEventListener('scroll',sp,{passive:true});sp();
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  var y=document.getElementById('yr');if(y)y.textContent=new Date().getFullYear();
})();
</script>`;

/* ----------------------------- blocks ----------------------------- */
const cols = (n, min = "240px") => `grid-template-columns:repeat(auto-fit,minmax(${min},1fr))`;

const B = {
  nav: (p, c) => `<nav class="bar"><div class="wrap">
    <a class="brand" href="#"><span class="dot"></span>${c.brand}</a>
    <div class="navlinks">${c.nav.map((l) => `<a href="#">${l}</a>`).join("")}<a class="btn" href="#">${c.ctas[0].t}</a></div>
  </div></nav>`,

  hero: (p, c) => `<header class="sec hero-bg"><div class="wrap center">
    <p class="eyebrow reveal">${c.kicker}</p>
    <h1 class="reveal">${c.h1}</h1>
    <p class="lead muted reveal">${c.sub}</p>
    <div class="reveal" style="display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;margin-top:1.4rem">
      <a class="btn" href="#">${c.ctas[0].t}</a><a class="btn ghost" href="#">${c.ctas[1].t}</a>
    </div>
    <div class="ph reveal" style="max-width:920px;margin:2.6rem auto 0;aspect-ratio:16/8;background:${ph(p, 0)}"></div>
  </div></header>`,

  heroSplit: (p, c) => `<header class="sec hero-bg"><div class="wrap" style="display:grid;grid-template-columns:1.1fr 1fr;gap:2.4rem;align-items:center">
    <div><p class="eyebrow reveal">${c.kicker}</p><h1 class="reveal">${c.h1}</h1>
      <p class="muted reveal" style="font-size:1.12rem;max-width:46ch">${c.sub}</p>
      <div class="reveal" style="display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.2rem"><a class="btn" href="#">${c.ctas[0].t}</a><a class="btn ghost" href="#">${c.ctas[1].t}</a></div>
    </div>
    <div class="ph reveal" style="aspect-ratio:4/5;background:${ph(p, 1)}"></div>
  </div><style>@media(max-width:820px){header.sec .wrap{grid-template-columns:1fr!important}}</style></header>`,

  logos: (p, c) => `<div class="wrap" style="padding:1.5rem 1.3rem"><div class="reveal" style="display:flex;gap:2rem;flex-wrap:wrap;justify-content:center;opacity:.65;font-weight:800;color:${p.muted}">
    ${["NOVA", "Vertex", "Lumen", "Quanta", "Apex", "Drift"].map((x) => `<span>${x}</span>`).join("")}</div></div>`,

  features: (p, c) => `<section class="sec"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">${c.fEyebrow || "Features"}</p><h2>${c.fTitle || "Everything you need"}</h2></div>
    <div class="grid" style="${cols(3, "260px")};margin-top:2rem">
      ${c.features.map((f, i) => `<div class="card lift reveal"><div style="font-size:1.6rem">${f.i}</div><h3>${f.t}</h3><p class="muted">${f.d}</p></div>`).join("")}
    </div></div></section>`,

  bento: (p, c) => `<section class="sec"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">${c.fEyebrow || "Why us"}</p><h2>${c.fTitle || "Built different"}</h2></div>
    <div class="grid reveal" style="grid-template-columns:repeat(4,1fr);grid-auto-rows:130px;margin-top:2rem">
      <div class="card" style="grid-column:span 2;grid-row:span 2;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(160deg,${p.a}26,${p.surface})"><h3>${c.features[0].t}</h3><p class="muted">${c.features[0].d}</p></div>
      ${c.features.slice(1, 5).map((f, i) => `<div class="card${i === 0 ? '" style="grid-column:span 2' : ""}"><h3 style="font-size:1.05rem">${f.t}</h3><p class="muted" style="font-size:.85rem">${f.d}</p></div>`).join("")}
    </div><style>@media(max-width:760px){section .grid{grid-template-columns:repeat(2,1fr)!important}}</style></div></section>`,

  stats: (p, c) => `<section class="sec tint"><div class="wrap grid reveal" style="${cols(4, "160px")};text-align:center">
    ${(c.stats || [["10k+", "Customers"], ["99.9%", "Uptime"], ["4.9/5", "Rating"], ["120+", "Countries"]]).map((s) => `<div><div class="kpi grad">${s[0]}</div><div class="muted">${s[1]}</div></div>`).join("")}
  </div></section>`,

  gallery: (p, c) => `<section class="sec"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">${c.gEyebrow || "Gallery"}</p><h2>${c.gTitle || "Selected work"}</h2></div>
    <div class="grid reveal" style="${cols(3, "220px")};margin-top:2rem">
      ${Array.from({ length: 6 }).map((_, i) => `<div class="ph lift" style="aspect-ratio:1;background:${ph(p, i)}"></div>`).join("")}
    </div></div></section>`,

  menu: (p, c) => `<section class="sec tint"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">Menu</p><h2>${c.menuTitle || "What we serve"}</h2></div>
    <div class="grid reveal" style="${cols(2, "300px")};margin-top:2rem">
      ${(c.menu || [["House Plate", "Seasonal, market-fresh", "$18"], ["Signature Bowl", "Slow-cooked, rich broth", "$15"], ["Garden Salad", "Crisp greens, citrus", "$12"], ["Daily Special", "Ask your server", "$22"], ["Sweet Finish", "Made in-house", "$9"], ["Craft Drink", "Locally sourced", "$7"]]).map((m) => `<div style="display:flex;justify-content:space-between;gap:1rem;border-bottom:1px dashed ${p.line};padding:.7rem 0"><div><strong>${m[0]}</strong><div class="muted" style="font-size:.88rem">${m[1]}</div></div><div class="grad" style="font-weight:800">${m[2]}</div></div>`).join("")}
    </div></div></section>`,

  steps: (p, c) => `<section class="sec"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">How it works</p><h2>${c.stepsTitle || "Three simple steps"}</h2></div>
    <div class="grid reveal" style="${cols(3, "240px")};margin-top:2rem">
      ${(c.steps || [["Sign up", "Create your account in seconds."], ["Customize", "Make it yours with a few clicks."], ["Launch", "Go live and start growing."]]).map((s, i) => `<div class="card"><div class="grad kpi" style="font-size:2rem">0${i + 1}</div><h3>${s[0]}</h3><p class="muted">${s[1]}</p></div>`).join("")}
    </div></div></section>`,

  pricing: (p, c) => `<section class="sec tint"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">Pricing</p><h2>${c.priceTitle || "Simple, fair pricing"}</h2></div>
    <div class="grid reveal" style="${cols(3, "240px")};margin-top:2rem;align-items:start">
      ${[["Starter", "0", ["1 project", "Community support"]], ["Pro", "29", ["Unlimited projects", "Priority support", "Advanced tools"]], ["Scale", "99", ["Everything in Pro", "SSO & SAML", "Dedicated SLA"]]].map((t, i) => `<div class="card${i === 1 ? " lift" : ""}" style="${i === 1 ? `border:2px solid ${p.a};` : ""}"><h3>${t[0]}</h3><div class="kpi">$${t[1]}<span class="muted" style="font-size:1rem;font-weight:400">/mo</span></div><ul style="list-style:none;padding:0;margin:1rem 0">${t[2].map((x) => `<li class="muted" style="padding:.3rem 0">✓ ${x}</li>`).join("")}</ul><a class="btn${i === 1 ? "" : " ghost"}" href="#" style="width:100%;text-align:center">Choose</a></div>`).join("")}
    </div></div></section>`,

  testimonials: (p, c) => `<section class="sec"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">Loved by many</p><h2>${c.tTitle || "What people say"}</h2></div>
    <div class="grid reveal" style="${cols(3, "260px")};margin-top:2rem">
      ${(c.quotes || ["A genuine game-changer for our team.", "Beautiful, fast, and a joy to use.", "We switched and never looked back."]).map((q, i) => `<div class="card"><p>“${q}”</p><div style="display:flex;align-items:center;gap:.7rem;margin-top:.8rem"><span class="ph" style="width:38px;height:38px;border-radius:50%;aspect-ratio:auto;background:${ph(p, i + 2)}"></span><div><strong>Alex ${["Rivera", "Chen", "Okafor"][i % 3]}</strong><div class="muted" style="font-size:.82rem">${["Founder", "Designer", "PM"][i % 3]}</div></div></div></div>`).join("")}
    </div></div></section>`,

  team: (p, c) => `<section class="sec tint"><div class="wrap">
    <div class="center reveal"><p class="eyebrow">Team</p><h2>${c.teamTitle || "Meet the people"}</h2></div>
    <div class="grid reveal" style="${cols(4, "180px")};margin-top:2rem">
      ${["Sam", "Noa", "Mira", "Theo"].map((n, i) => `<div class="center"><div class="ph lift" style="aspect-ratio:1;border-radius:${p.radius};background:${ph(p, i)}"></div><h3 style="margin-top:.7rem;font-size:1.05rem">${n} Lee</h3><div class="muted" style="font-size:.85rem">${["CEO", "Design", "Eng", "Ops"][i]}</div></div>`).join("")}
    </div></div></section>`,

  faq: (p, c) => `<section class="sec"><div class="wrap" style="max-width:760px">
    <div class="center reveal"><p class="eyebrow">FAQ</p><h2>Questions, answered</h2></div>
    <div class="reveal" style="margin-top:1.6rem">
      ${(c.faq || [["Is there a free trial?", "Yes — start free, no card required."], ["Can I cancel anytime?", "Absolutely, in one click."], ["Do you offer support?", "Friendly humans, around the clock."], ["Is my data safe?", "Encrypted in transit and at rest."]]).map((f) => `<details><summary>${f[0]}<span>+</span></summary><p class="muted" style="margin-top:.7rem">${f[1]}</p></details>`).join("")}
    </div></div></section>`,

  cta: (p, c) => `<section class="sec"><div class="wrap"><div class="card reveal center hero-bg" style="padding:3rem 1.5rem;background:linear-gradient(135deg,${p.a}1f,${p.b}1f)">
    <h2>${c.ctaTitle || "Ready to start?"}</h2><p class="lead muted">${c.ctaSub || "Join thousands already on board. It only takes a minute."}</p>
    <a class="btn" href="#" style="margin-top:.6rem">${c.ctas[0].t}</a>
  </div></div></section>`,

  newsletter: (p, c) => `<section class="sec tint"><div class="wrap center" style="max-width:560px">
    <h2 class="reveal">${c.nlTitle || "Stay in the loop"}</h2><p class="muted reveal">${c.nlSub || "One thoughtful email a week. No spam, ever."}</p>
    <form class="reveal" onsubmit="event.preventDefault();this.querySelector('input').value='';this.nextElementSibling.textContent='Thanks — you are subscribed!'" style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:1rem">
      <input type="email" required placeholder="you@example.com" style="flex:1;min-width:200px;padding:.8rem 1rem;border-radius:${p.radius};border:1px solid ${p.line};background:${p.surface};color:${p.text}"><button class="btn" type="submit">Subscribe</button>
    </form><p class="muted" role="status" style="min-height:1.2em;margin-top:.6rem"></p>
  </div></section>`,

  contact: (p, c) => `<section class="sec"><div class="wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:2rem">
    <div class="reveal"><p class="eyebrow">Contact</p><h2>${c.contactTitle || "Let’s talk"}</h2><p class="muted">${c.contactSub || "We usually reply within a day."}</p>
      <p class="muted">✉ hello@example.com<br>☎ +1 (555) 010-2030<br>📍 100 Market St, Suite 200</p></div>
    <form class="card reveal" onsubmit="event.preventDefault();this.querySelector('button').textContent='Sent ✓'" style="display:grid;gap:.7rem">
      <input placeholder="Name" style="padding:.7rem;border-radius:${p.radius};border:1px solid ${p.line};background:${p.surface2};color:${p.text}">
      <input placeholder="Email" style="padding:.7rem;border-radius:${p.radius};border:1px solid ${p.line};background:${p.surface2};color:${p.text}">
      <textarea placeholder="Message" rows="4" style="padding:.7rem;border-radius:${p.radius};border:1px solid ${p.line};background:${p.surface2};color:${p.text}"></textarea>
      <button class="btn" type="submit">Send message</button>
    </form><style>@media(max-width:760px){section .wrap{grid-template-columns:1fr!important}}</style></div></section>`,

  footer: (p, c) => `<footer class="ft"><div class="wrap"><div class="fcols">
    <div><div class="brand"><span class="dot"></span>${c.brand}</div><p class="muted" style="margin-top:.6rem;max-width:30ch">${c.footTag || c.sub}</p></div>
    ${[["Product", ["Features", "Pricing", "Changelog"]], ["Company", ["About", "Blog", "Careers"]], ["Legal", ["Privacy", "Terms", "Status"]]].map((col) => `<div><strong>${col[0]}</strong>${col[1].map((l) => `<a href="#">${l}</a>`).join("")}</div>`).join("")}
  </div><p class="muted" style="margin-top:1.8rem;font-size:.85rem">© <span id="yr"></span> ${c.brand}. All rights reserved.</p></div></footer>`,
};

/* ----------------------------- categories ----------------------------- */
// recipe is the ordered list of blocks. nav + footer + prog are implicit.
const D = (o) => o; // identity for readability
const defFeat = (a, b, c2, d, e, f) => [a, b, c2, d, e, f];

const CATS = [
  D({ key: "saas", group: "saas", type: "SaaS Landing", brand: "Nimbus", kicker: "New · v2 is here", h1: 'Ship products your <span class="grad">users love</span>.', sub: "The all-in-one platform to build, launch, and scale — without the busywork.", ctas: [{ t: "Start free" }, { t: "Book a demo" }], nav: ["Product", "Features", "Pricing", "Docs"], features: defFeat({ i: "⚡", t: "Lightning fast", d: "Edge-deployed for instant loads everywhere." }, { i: "🔒", t: "Secure by default", d: "SOC2-ready with encryption end to end." }, { i: "📊", t: "Realtime analytics", d: "See what matters the moment it happens." }, { i: "🧩", t: "100+ integrations", d: "Connect the tools you already use." }, { i: "🤝", t: "Built for teams", d: "Collaborate live, comment, and ship." }, { i: "🛠️", t: "Powerful API", d: "Automate anything with a clean API." }), recipe: ["heroSplit", "logos", "bento", "stats", "testimonials", "pricing", "faq", "cta"], styles: ["midnight", "aurora", "glass", "corporate"] }),
  D({ key: "ai-startup", group: "saas", type: "AI Startup", brand: "Cortex", kicker: "Agentic AI", h1: 'Your <span class="grad">AI copilot</span> for everything.', sub: "Automate the repetitive, amplify the creative. Cortex works alongside your team.", ctas: [{ t: "Try Cortex" }, { t: "Watch demo" }], nav: ["Product", "Models", "Pricing", "Research"], features: defFeat({ i: "🧠", t: "Frontier models", d: "State-of-the-art reasoning out of the box." }, { i: "🔌", t: "Plug into your stack", d: "Native connectors for your data." }, { i: "🛡️", t: "Private by design", d: "Your data never trains our models." }, { i: "⚙️", t: "Custom agents", d: "Build workflows in plain language." }, { i: "📈", t: "Measurable ROI", d: "Track time saved across the org." }, { i: "🌐", t: "Deploy anywhere", d: "Cloud, on-prem, or hybrid." }), recipe: ["hero", "logos", "features", "steps", "stats", "testimonials", "cta"], styles: ["midnight", "neon", "aurora", "ocean"] }),
  D({ key: "agency", group: "agency", type: "Creative Agency", brand: "Studio Form", kicker: "Brand · Web · Motion", h1: 'We craft brands that <span class="grad">move people</span>.', sub: "A full-service studio turning bold ideas into unforgettable digital experiences.", ctas: [{ t: "Start a project" }, { t: "See our work" }], nav: ["Work", "Services", "Studio", "Contact"], features: defFeat({ i: "🎨", t: "Brand identity", d: "Names, logos, and systems that last." }, { i: "💻", t: "Web design", d: "Fast, accessible, beautiful sites." }, { i: "🎬", t: "Motion", d: "Animation that tells your story." }, { i: "📦", t: "Packaging", d: "Shelf-stopping physical design." }, { i: "📣", t: "Campaigns", d: "Ideas that travel across channels." }, { i: "🔭", t: "Strategy", d: "Positioning rooted in research." }), recipe: ["hero", "gallery", "stats", "team", "testimonials", "contact"], styles: ["mono", "brutalist", "midnight", "paper"] }),
  D({ key: "design-studio", group: "agency", type: "Design Studio", brand: "Atelier", kicker: "Independent studio", h1: 'Design with <span class="grad">intention</span>.', sub: "We partner with ambitious teams to design products people genuinely love.", ctas: [{ t: "Work with us" }, { t: "Case studies" }], nav: ["Work", "About", "Process", "Contact"], features: defFeat({ i: "🔍", t: "Research", d: "Understand before we design." }, { i: "✏️", t: "Product design", d: "Flows, screens, and systems." }, { i: "🧱", t: "Design systems", d: "Scalable, documented, durable." }, { i: "🧪", t: "Prototyping", d: "Test ideas before you build." }, { i: "🤝", t: "Collaboration", d: "Embedded with your team." }, { i: "🚀", t: "Handoff", d: "Dev-ready, pixel-perfect." }), recipe: ["heroSplit", "steps", "gallery", "testimonials", "cta"], styles: ["paper", "pastel", "mono", "midnight"] }),
  D({ key: "portfolio", group: "portfolio", type: "Developer Portfolio", brand: "Jordan Ng", kicker: "Full-stack engineer", h1: 'I build <span class="grad">fast, thoughtful</span> software.', sub: "Engineer focused on performance, DX, and interfaces that feel effortless.", ctas: [{ t: "Get in touch" }, { t: "View résumé" }], nav: ["Work", "About", "Writing", "Contact"], features: defFeat({ i: "🧩", t: "Frontend", d: "React, TypeScript, design systems." }, { i: "🛠️", t: "Backend", d: "Node, Go, Postgres, queues." }, { i: "☁️", t: "Infra", d: "AWS, Docker, CI/CD pipelines." }, { i: "📱", t: "Mobile", d: "React Native, offline-first." }, { i: "⚡", t: "Performance", d: "Core Web Vitals obsessed." }, { i: "♿", t: "Accessibility", d: "WCAG by default." }), recipe: ["heroSplit", "gallery", "stats", "contact"], styles: ["midnight", "mono", "neon", "ocean"] }),
  D({ key: "photographer", group: "portfolio", type: "Photographer", brand: "Lina Marsh", kicker: "Visual storyteller", h1: 'Moments, <span class="grad">made to last</span>.', sub: "Wedding, portrait, and editorial photography with a warm, candid eye.", ctas: [{ t: "Book a shoot" }, { t: "Portfolio" }], nav: ["Galleries", "About", "Pricing", "Contact"], features: defFeat({ i: "💍", t: "Weddings", d: "Your day, beautifully remembered." }, { i: "👤", t: "Portraits", d: "Natural, flattering, real." }, { i: "📰", t: "Editorial", d: "Story-driven visual features." }, { i: "🏞️", t: "Landscape", d: "Light, place, and mood." }, { i: "🏷️", t: "Brand", d: "Imagery that sells." }, { i: "🎞️", t: "Film", d: "Analog grain on request." }), recipe: ["hero", "gallery", "pricing", "testimonials", "contact"], styles: ["paper", "mono", "midnight", "sunset"] }),
  D({ key: "restaurant", group: "local", type: "Restaurant", brand: "Olive & Ember", kicker: "Wood-fired · Seasonal", h1: 'Honest food, <span class="grad">cooked with fire</span>.', sub: "A neighborhood kitchen celebrating local produce and slow, open-flame cooking.", ctas: [{ t: "Reserve a table" }, { t: "See the menu" }], nav: ["Menu", "About", "Reservations", "Visit"], features: defFeat({ i: "🔥", t: "Wood-fired", d: "Everything kissed by flame." }, { i: "🌿", t: "Local & seasonal", d: "Sourced within 50 miles." }, { i: "🍷", t: "Natural wine", d: "A short, lovely list." }, { i: "👨‍🍳", t: "Open kitchen", d: "Watch the magic happen." }, { i: "🥂", t: "Private events", d: "Host your celebration." }, { i: "🌅", t: "Weekend brunch", d: "Sat & Sun till 2pm." }), recipe: ["hero", "menu", "gallery", "testimonials", "contact"], styles: ["sunset", "forest", "paper", "midnight"] }),
  D({ key: "coffee-shop", group: "local", type: "Coffee Shop", brand: "Slow Pour", kicker: "Specialty coffee", h1: 'Coffee worth <span class="grad">slowing down</span> for.', sub: "Single-origin beans, roasted weekly, poured by people who love the craft.", ctas: [{ t: "Find us" }, { t: "Shop beans" }], nav: ["Menu", "Beans", "Our Story", "Visit"], features: defFeat({ i: "☕", t: "House espresso", d: "Sweet, balanced, dialed in daily." }, { i: "🫘", t: "Fresh roast", d: "Roasted in small batches." }, { i: "🥐", t: "Fresh bakes", d: "Pastries from the corner bakery." }, { i: "🌱", t: "Oat-friendly", d: "Great with every milk." }, { i: "📶", t: "Work-friendly", d: "Fast wifi, quiet corners." }, { i: "♻️", t: "Sustainable", d: "Compostable everything." }), recipe: ["hero", "menu", "gallery", "newsletter", "contact"], styles: ["sunset", "paper", "forest", "pastel"] }),
  D({ key: "bakery", group: "local", type: "Bakery", brand: "Flour & Co", kicker: "Baked fresh daily", h1: 'From our oven, <span class="grad">to your table</span>.', sub: "Sourdough, pastries, and celebration cakes made by hand every morning.", ctas: [{ t: "Order ahead" }, { t: "View menu" }], nav: ["Menu", "Cakes", "About", "Visit"], features: defFeat({ i: "🍞", t: "Sourdough", d: "48-hour slow ferment." }, { i: "🥐", t: "Viennoiserie", d: "Buttery, laminated, flaky." }, { i: "🎂", t: "Custom cakes", d: "For every celebration." }, { i: "🌾", t: "Whole grain", d: "Stone-milled flours." }, { i: "🧁", t: "Daily specials", d: "Something new each day." }, { i: "🎁", t: "Gift boxes", d: "Sweetness, delivered." }), recipe: ["hero", "menu", "gallery", "testimonials", "contact"], styles: ["sunset", "pastel", "paper", "corporate"] }),
  D({ key: "fitness", group: "health", type: "Fitness Gym", brand: "Forge", kicker: "Train with purpose", h1: 'Stronger <span class="grad">every day</span>.', sub: "Coaching, classes, and a community that shows up — for all levels.", ctas: [{ t: "Start free week" }, { t: "View classes" }], nav: ["Classes", "Coaches", "Pricing", "Join"], features: defFeat({ i: "🏋️", t: "Strength", d: "Barbell and functional training." }, { i: "🏃", t: "Conditioning", d: "HIIT and endurance blocks." }, { i: "🧘", t: "Mobility", d: "Move better, recover faster." }, { i: "📋", t: "Programming", d: "Track progress every week." }, { i: "🥗", t: "Nutrition", d: "Simple, sustainable plans." }, { i: "👥", t: "Community", d: "You belong here." }), recipe: ["hero", "stats", "steps", "pricing", "testimonials", "cta"], styles: ["neon", "midnight", "brutalist", "ocean"] }),
  D({ key: "yoga", group: "health", type: "Yoga Studio", brand: "Stillwater", kicker: "Breathe · Move · Rest", h1: 'Find your <span class="grad">center</span>.', sub: "A calm space for all bodies to move, breathe, and reconnect.", ctas: [{ t: "First class free" }, { t: "Schedule" }], nav: ["Classes", "Teachers", "Pricing", "Visit"], features: defFeat({ i: "🧘", t: "Vinyasa", d: "Flow with breath and intention." }, { i: "🌙", t: "Yin & restore", d: "Deep, slow, nourishing." }, { i: "🔥", t: "Hot yoga", d: "Sweat it out, let it go." }, { i: "🌱", t: "Beginners", d: "Gentle, welcoming, judgment-free." }, { i: "🤰", t: "Prenatal", d: "Safe practice for two." }, { i: "🪷", t: "Meditation", d: "Quiet the mind." }), recipe: ["hero", "steps", "pricing", "testimonials", "newsletter"], styles: ["pastel", "paper", "forest", "sunset"] }),
  D({ key: "fashion", group: "ecommerce", type: "Fashion Brand", brand: "Maison Nord", kicker: "FW Collection", h1: 'Quiet luxury, <span class="grad">made to last</span>.', sub: "Timeless essentials in natural fabrics, designed in Copenhagen.", ctas: [{ t: "Shop the collection" }, { t: "Lookbook" }], nav: ["New", "Women", "Men", "Stories"], features: defFeat({ i: "🧵", t: "Natural fibers", d: "Linen, wool, organic cotton." }, { i: "✂️", t: "Considered cuts", d: "Designed to flatter, built to last." }, { i: "🌍", t: "Responsible", d: "Ethically made, fairly paid." }, { i: "📦", t: "Free returns", d: "30 days, no questions." }, { i: "♻️", t: "Repair program", d: "We mend what you love." }, { i: "🎁", t: "Gift ready", d: "Beautifully wrapped." }), recipe: ["hero", "gallery", "stats", "newsletter", "footer"], styles: ["mono", "paper", "midnight", "pastel"] }),
  D({ key: "store", group: "ecommerce", type: "Online Store", brand: "Wares", kicker: "Free shipping over $50", h1: 'Good things, <span class="grad">delivered</span>.', sub: "A curated shop of everyday objects chosen for design and durability.", ctas: [{ t: "Shop now" }, { t: "Best sellers" }], nav: ["Shop", "Collections", "Sale", "About"], features: defFeat({ i: "🚚", t: "Fast shipping", d: "Out the door in 24 hours." }, { i: "↩️", t: "Easy returns", d: "30-day, prepaid label." }, { i: "🔒", t: "Secure checkout", d: "Encrypted and trusted." }, { i: "⭐", t: "5-star service", d: "Real humans, real help." }, { i: "🎁", t: "Gift cards", d: "Always the right size." }, { i: "💬", t: "Reviews", d: "Thousands of happy buyers." }), recipe: ["hero", "gallery", "stats", "testimonials", "newsletter"], styles: ["corporate", "paper", "pastel", "midnight"] }),
  D({ key: "real-estate", group: "business", type: "Real Estate", brand: "Haven", kicker: "Find your place", h1: 'Homes that <span class="grad">fit your life</span>.', sub: "Browse hand-picked listings and work with agents who actually listen.", ctas: [{ t: "Browse listings" }, { t: "Talk to an agent" }], nav: ["Buy", "Rent", "Sell", "Agents"], features: defFeat({ i: "🏡", t: "Curated listings", d: "Quality over quantity." }, { i: "🗺️", t: "Neighborhood data", d: "Schools, transit, and more." }, { i: "📸", t: "Virtual tours", d: "Walk through from home." }, { i: "🤝", t: "Expert agents", d: "Local, honest, responsive." }, { i: "💰", t: "Mortgage help", d: "Get pre-approved fast." }, { i: "📝", t: "Smooth closing", d: "We handle the paperwork." }), recipe: ["heroSplit", "gallery", "stats", "team", "contact"], styles: ["corporate", "ocean", "paper", "midnight"] }),
  D({ key: "interior", group: "business", type: "Interior Design", brand: "Form & Field", kicker: "Interiors studio", h1: 'Spaces that <span class="grad">feel like home</span>.', sub: "Full-service interior design for homes and workplaces that work beautifully.", ctas: [{ t: "Book a consult" }, { t: "Portfolio" }], nav: ["Projects", "Services", "Studio", "Contact"], features: defFeat({ i: "🛋️", t: "Residential", d: "Homes designed around you." }, { i: "🏢", t: "Commercial", d: "Workspaces that inspire." }, { i: "🎨", t: "Styling", d: "The finishing touches." }, { i: "📐", t: "Space planning", d: "Function meets flow." }, { i: "🪑", t: "Sourcing", d: "Furniture and finishes." }, { i: "🔧", t: "Project management", d: "On time, on budget." }), recipe: ["hero", "gallery", "steps", "testimonials", "contact"], styles: ["paper", "mono", "pastel", "midnight"] }),
  D({ key: "architecture", group: "business", type: "Architecture Firm", brand: "Meridian", kicker: "Architecture & urbanism", h1: 'Building the <span class="grad">future, thoughtfully</span>.', sub: "An award-winning practice designing sustainable spaces for people and planet.", ctas: [{ t: "Start a project" }, { t: "Selected works" }], nav: ["Projects", "Practice", "People", "Contact"], features: defFeat({ i: "🏛️", t: "Cultural", d: "Museums, galleries, libraries." }, { i: "🏙️", t: "Mixed-use", d: "Living, working, gathering." }, { i: "🌳", t: "Sustainable", d: "Net-zero by design." }, { i: "🏠", t: "Residential", d: "Homes with soul." }, { i: "📐", t: "Master planning", d: "Cities at human scale." }, { i: "🔬", t: "Research", d: "Materials and methods." }), recipe: ["hero", "gallery", "stats", "team", "contact"], styles: ["mono", "midnight", "paper", "corporate"] }),
  D({ key: "law-firm", group: "business", type: "Law Firm", brand: "Whitlock & Reed", kicker: "Trusted counsel since 1998", h1: 'Experience you can <span class="grad">rely on</span>.', sub: "Pragmatic legal advice across corporate, real estate, and litigation.", ctas: [{ t: "Request a consult" }, { t: "Our practice" }], nav: ["Practice", "Attorneys", "Insights", "Contact"], features: defFeat({ i: "⚖️", t: "Litigation", d: "Prepared, persuasive advocacy." }, { i: "🏢", t: "Corporate", d: "Deals done right." }, { i: "🏡", t: "Real estate", d: "From contract to closing." }, { i: "📜", t: "Estate planning", d: "Protect what matters." }, { i: "🤝", t: "Mediation", d: "Resolve without court." }, { i: "🌐", t: "Cross-border", d: "Global reach, local insight." }), recipe: ["heroSplit", "stats", "team", "testimonials", "contact"], styles: ["corporate", "mono", "ocean", "paper"] }),
  D({ key: "dental", group: "health", type: "Dental Clinic", brand: "Bright Smile", kicker: "Gentle, modern dentistry", h1: 'A reason to <span class="grad">smile</span>.', sub: "Comfortable, anxiety-free care with the latest technology and a warm team.", ctas: [{ t: "Book appointment" }, { t: "Our services" }], nav: ["Services", "Team", "Pricing", "Book"], features: defFeat({ i: "🦷", t: "Checkups", d: "Thorough, gentle exams." }, { i: "✨", t: "Whitening", d: "Brighter in one visit." }, { i: "🪥", t: "Hygiene", d: "Keep gums healthy." }, { i: "🔧", t: "Restorative", d: "Crowns, fillings, implants." }, { i: "😬", t: "Orthodontics", d: "Clear aligners available." }, { i: "🚑", t: "Emergencies", d: "Same-day relief." }), recipe: ["heroSplit", "stats", "steps", "pricing", "contact"], styles: ["corporate", "ocean", "pastel", "paper"] }),
  D({ key: "medical", group: "health", type: "Medical Practice", brand: "Northside Health", kicker: "Whole-person care", h1: 'Care that <span class="grad">treats you</span>, not just symptoms.', sub: "Primary and specialty care from a team that takes the time to listen.", ctas: [{ t: "Book a visit" }, { t: "Find a doctor" }], nav: ["Services", "Doctors", "Patients", "Contact"], features: defFeat({ i: "🩺", t: "Primary care", d: "Your health home base." }, { i: "❤️", t: "Cardiology", d: "Heart health experts." }, { i: "🧠", t: "Mental health", d: "Compassionate support." }, { i: "👶", t: "Pediatrics", d: "Care for little ones." }, { i: "💉", t: "Vaccines", d: "Stay protected." }, { i: "🔬", t: "Lab on-site", d: "Fast results." }), recipe: ["heroSplit", "stats", "team", "faq", "contact"], styles: ["corporate", "ocean", "paper", "forest"] }),
  D({ key: "course", group: "education", type: "Online Course", brand: "Mastery", kicker: "Self-paced · Lifetime access", h1: 'Learn it once, <span class="grad">use it forever</span>.', sub: "A practical, project-based course that takes you from beginner to confident.", ctas: [{ t: "Enroll now" }, { t: "Free preview" }], nav: ["Curriculum", "Instructor", "Reviews", "Enroll"], features: defFeat({ i: "🎥", t: "HD lessons", d: "Bite-sized, no fluff." }, { i: "🛠️", t: "Real projects", d: "Build a portfolio." }, { i: "📜", t: "Certificate", d: "Show your skills." }, { i: "💬", t: "Community", d: "Learn together." }, { i: "♾️", t: "Lifetime access", d: "Including updates." }, { i: "💰", t: "Money-back", d: "30-day guarantee." }), recipe: ["heroSplit", "steps", "stats", "pricing", "testimonials", "faq", "cta"], styles: ["midnight", "aurora", "corporate", "neon"] }),
  D({ key: "university", group: "education", type: "University Program", brand: "Halden College", kicker: "Admissions open", h1: 'Where curiosity <span class="grad">becomes a career</span>.', sub: "Rigorous programs, world-class faculty, and a campus that feels like home.", ctas: [{ t: "Apply now" }, { t: "Explore programs" }], nav: ["Programs", "Admissions", "Campus", "Apply"], features: defFeat({ i: "🎓", t: "Degrees", d: "Undergrad to doctoral." }, { i: "🔬", t: "Research", d: "Hands-on from year one." }, { i: "🌍", t: "Study abroad", d: "50+ partner schools." }, { i: "💼", t: "Career services", d: "94% placement rate." }, { i: "🏆", t: "Scholarships", d: "Merit and need-based." }, { i: "🏛️", t: "Campus life", d: "200+ clubs." }), recipe: ["hero", "stats", "features", "gallery", "faq", "cta"], styles: ["corporate", "ocean", "paper", "forest"] }),
  D({ key: "nonprofit", group: "nonprofit", type: "Nonprofit", brand: "Open Hands", kicker: "Together we can", h1: 'Small acts, <span class="grad">big change</span>.', sub: "We provide food, shelter, and hope to families in need — and you can help.", ctas: [{ t: "Donate" }, { t: "Volunteer" }], nav: ["Mission", "Programs", "Impact", "Donate"], features: defFeat({ i: "🍲", t: "Food security", d: "1M meals served yearly." }, { i: "🏠", t: "Shelter", d: "Safe places to sleep." }, { i: "📚", t: "Education", d: "After-school programs." }, { i: "🩺", t: "Health", d: "Free clinics." }, { i: "💧", t: "Clean water", d: "Wells in 12 regions." }, { i: "🤝", t: "Community", d: "Built by neighbors." }), recipe: ["hero", "stats", "steps", "testimonials", "cta"], styles: ["forest", "ocean", "sunset", "corporate"] }),
  D({ key: "conference", group: "events", type: "Tech Conference", brand: "Shift 2026", kicker: "Sept 14–16 · Lisbon", h1: 'The future, <span class="grad">three days early</span>.', sub: "Two thousand builders, fifty talks, and the conversations that shape what’s next.", ctas: [{ t: "Get tickets" }, { t: "View schedule" }], nav: ["Speakers", "Schedule", "Venue", "Tickets"], features: defFeat({ i: "🎤", t: "50+ talks", d: "From the people building it." }, { i: "🛠️", t: "Workshops", d: "Hands-on, small-group." }, { i: "🤝", t: "Networking", d: "Find your people." }, { i: "🎉", t: "After-parties", d: "Three unforgettable nights." }, { i: "📡", t: "Live stream", d: "Can’t make it? Watch live." }, { i: "🍽️", t: "All meals", d: "Fueled all day." }), recipe: ["hero", "stats", "steps", "team", "pricing", "faq", "cta"], styles: ["neon", "aurora", "midnight", "brutalist"] }),
  D({ key: "festival", group: "events", type: "Music Festival", brand: "Sundown", kicker: "Aug 8–10 · Riverside Park", h1: 'Three days of <span class="grad">sound & sun</span>.', sub: "Forty artists across five stages. Camp out, dance hard, make memories.", ctas: [{ t: "Buy passes" }, { t: "Lineup" }], nav: ["Lineup", "Tickets", "Info", "Travel"], features: defFeat({ i: "🎸", t: "5 stages", d: "Something for everyone." }, { i: "🏕️", t: "Camping", d: "Tent and glamping options." }, { i: "🍔", t: "Food village", d: "30+ local vendors." }, { i: "🎨", t: "Art installs", d: "Immersive and interactive." }, { i: "🚌", t: "Shuttles", d: "Easy in and out." }, { i: "♿", t: "Accessible", d: "For every fan." }), recipe: ["hero", "gallery", "stats", "pricing", "faq", "cta"], styles: ["aurora", "neon", "sunset", "midnight"] }),
  D({ key: "wedding", group: "events", type: "Wedding", brand: "Mia & Sam", kicker: "We’re getting married!", h1: 'Mia <span class="grad">&</span> Sam', sub: "Join us on June 21st, 2026 at Rosewood Gardens for our celebration of love.", ctas: [{ t: "RSVP" }, { t: "Our story" }], nav: ["Story", "Details", "Registry", "RSVP"], features: defFeat({ i: "💍", t: "The ceremony", d: "4:00pm in the rose garden." }, { i: "🥂", t: "Reception", d: "Dinner & dancing to follow." }, { i: "🏨", t: "Stay", d: "Room block at The Grand." }, { i: "🚗", t: "Travel", d: "Shuttles from the hotel." }, { i: "🎁", t: "Registry", d: "Your presence is enough." }, { i: "📸", t: "Photos", d: "Share with #MiaAndSam." }), recipe: ["hero", "steps", "gallery", "faq", "contact"], styles: ["pastel", "sunset", "paper", "mono"] }),
  D({ key: "musician", group: "creator", type: "Musician", brand: "AVERY", kicker: "New album out now", h1: 'Sounds for <span class="grad">late nights</span>.', sub: "Genre-blurring electronic pop from a producer who plays by no rules.", ctas: [{ t: "Listen now" }, { t: "Tour dates" }], nav: ["Music", "Tour", "Videos", "Store"], features: defFeat({ i: "🎧", t: "Stream", d: "On every platform." }, { i: "🎫", t: "Live", d: "20-city world tour." }, { i: "📀", t: "Vinyl", d: "Limited pressings." }, { i: "🎬", t: "Videos", d: "Watch the visuals." }, { i: "👕", t: "Merch", d: "Wear the sound." }, { i: "✉️", t: "Newsletter", d: "First to know." }), recipe: ["hero", "gallery", "stats", "newsletter", "footer"], styles: ["neon", "aurora", "midnight", "brutalist"] }),
  D({ key: "podcast", group: "creator", type: "Podcast", brand: "The Long Game", kicker: "New episodes weekly", h1: 'Conversations <span class="grad">worth your time</span>.', sub: "Deep talks with the people quietly shaping the future, one idea at a time.", ctas: [{ t: "Listen now" }, { t: "All episodes" }], nav: ["Episodes", "About", "Guests", "Subscribe"], features: defFeat({ i: "🎙️", t: "Weekly", d: "A new guest every Tuesday." }, { i: "🎧", t: "Everywhere", d: "Apple, Spotify, RSS." }, { i: "📝", t: "Show notes", d: "Links and transcripts." }, { i: "👥", t: "Guests", d: "Founders to philosophers." }, { i: "💬", t: "Community", d: "Join the discussion." }, { i: "✉️", t: "Newsletter", d: "Episode recaps." }), recipe: ["heroSplit", "steps", "stats", "newsletter", "footer"], styles: ["midnight", "aurora", "paper", "ocean"] }),
  D({ key: "newsletter", group: "creator", type: "Newsletter", brand: "Signal", kicker: "Join 40,000 readers", h1: 'The week’s best ideas, <span class="grad">distilled</span>.', sub: "One sharp email every Friday. Tech, design, and the future — no noise.", ctas: [{ t: "Subscribe free" }, { t: "Read archive" }], nav: ["Archive", "About", "Sponsor", "Subscribe"], features: defFeat({ i: "📨", t: "Every Friday", d: "Right on time." }, { i: "🧠", t: "Curated", d: "Hand-picked, never auto." }, { i: "⏱️", t: "5-min read", d: "Respect for your time." }, { i: "🆓", t: "Always free", d: "Reader-supported." }, { i: "🔒", t: "No spam", d: "Unsubscribe anytime." }, { i: "🌍", t: "Global", d: "Read in 90 countries." }), recipe: ["hero", "stats", "testimonials", "newsletter", "footer"], styles: ["paper", "mono", "midnight", "corporate"] }),
  D({ key: "travel", group: "business", type: "Travel Agency", brand: "Wayfare", kicker: "Trips, handcrafted", h1: 'Go somewhere <span class="grad">unforgettable</span>.', sub: "Tailor-made journeys to the world’s most extraordinary places.", ctas: [{ t: "Plan my trip" }, { t: "Destinations" }], nav: ["Destinations", "Trips", "About", "Contact"], features: defFeat({ i: "🗺️", t: "Tailor-made", d: "Designed around you." }, { i: "🏝️", t: "Hidden gems", d: "Beyond the guidebook." }, { i: "🧭", t: "Local guides", d: "See it like an insider." }, { i: "🛡️", t: "Fully covered", d: "Protected end to end." }, { i: "📞", t: "24/7 support", d: "We’ve got your back." }, { i: "♻️", t: "Responsible", d: "Travel that gives back." }), recipe: ["hero", "gallery", "stats", "testimonials", "cta"], styles: ["ocean", "sunset", "forest", "corporate"] }),
  D({ key: "hotel", group: "business", type: "Boutique Hotel", brand: "The Linden", kicker: "Boutique stays", h1: 'Stay a while, <span class="grad">feel at home</span>.', sub: "A boutique hotel where thoughtful design meets genuine hospitality.", ctas: [{ t: "Book your stay" }, { t: "View rooms" }], nav: ["Rooms", "Dining", "Spa", "Book"], features: defFeat({ i: "🛏️", t: "Designed rooms", d: "Calm, comfortable, considered." }, { i: "🍽️", t: "On-site dining", d: "Farm-to-table kitchen." }, { i: "💆", t: "Spa", d: "Restore and unwind." }, { i: "🏊", t: "Rooftop pool", d: "With a city view." }, { i: "🐾", t: "Pet-friendly", d: "Bring the whole family." }, { i: "🚲", t: "City rides", d: "Bikes on the house." }), recipe: ["hero", "gallery", "stats", "testimonials", "contact"], styles: ["paper", "sunset", "ocean", "midnight"] }),
  D({ key: "crypto", group: "saas", type: "Crypto / Web3", brand: "Ledgerly", kicker: "Self-custody, simplified", h1: 'Own your <span class="grad">money</span>. Truly.', sub: "A non-custodial wallet that makes web3 feel as simple as your banking app.", ctas: [{ t: "Get the app" }, { t: "How it works" }], nav: ["Product", "Security", "Developers", "Docs"], features: defFeat({ i: "🔐", t: "Self-custody", d: "Your keys, your coins." }, { i: "⚡", t: "Instant swaps", d: "Best rates across chains." }, { i: "🌉", t: "Multi-chain", d: "30+ networks supported." }, { i: "🛡️", t: "Audited", d: "Reviewed by the best." }, { i: "💸", t: "Low fees", d: "No hidden spread." }, { i: "📈", t: "Track all assets", d: "One clean dashboard." }), recipe: ["hero", "logos", "bento", "stats", "faq", "cta"], styles: ["midnight", "neon", "aurora", "ocean"] }),
  D({ key: "mobile-app", group: "saas", type: "Mobile App", brand: "Habitly", kicker: "Free on iOS & Android", h1: 'Build better <span class="grad">habits</span>, one day at a time.', sub: "The friendly habit tracker that actually sticks — gentle nudges, real progress.", ctas: [{ t: "Download free" }, { t: "See features" }], nav: ["Features", "Pricing", "Blog", "Support"], features: defFeat({ i: "✅", t: "Simple tracking", d: "Tap and you’re done." }, { i: "🔔", t: "Smart reminders", d: "Nudges that respect you." }, { i: "📊", t: "Insights", d: "See your streaks grow." }, { i: "🎯", t: "Goals", d: "Big or small, your pace." }, { i: "🌙", t: "Dark mode", d: "Easy on the eyes." }, { i: "☁️", t: "Sync", d: "All your devices." }), recipe: ["heroSplit", "features", "stats", "pricing", "testimonials", "cta"], styles: ["pastel", "midnight", "aurora", "corporate"] }),
  D({ key: "game-studio", group: "creator", type: "Game Studio", brand: "Pixel Forge", kicker: "Wishlist on Steam", h1: 'Worlds worth <span class="grad">getting lost in</span>.', sub: "An indie studio crafting atmospheric games with heart, hand-built pixel by pixel.", ctas: [{ t: "Wishlist now" }, { t: "Watch trailer" }], nav: ["Games", "Studio", "News", "Press"], features: defFeat({ i: "🎮", t: "Original worlds", d: "Stories you won’t forget." }, { i: "🎨", t: "Hand-crafted art", d: "Every frame, by hand." }, { i: "🎵", t: "Original score", d: "Music that moves you." }, { i: "🕹️", t: "Tight controls", d: "Feel every input." }, { i: "🌍", t: "Localized", d: "Play in 12 languages." }, { i: "🛠️", t: "Mod support", d: "Make it yours." }), recipe: ["hero", "gallery", "stats", "newsletter", "footer"], styles: ["neon", "midnight", "aurora", "brutalist"] }),
];

/* ----------------------------- assemble ----------------------------- */
function renderBlock(name, p, c) {
  const fn = B[name];
  return fn ? fn(p, c) : "";
}

function page(c, pk) {
  const p = P[pk];
  const blocks = c.recipe.map((b) => renderBlock(b, p, c)).join("\n");
  const id = `${c.key}-${pk}`;
  const title = `${c.type} — ${P[pk].name}`;
  const plain = c.h1.replace(/<[^>]+>/g, "");
  const meta = {
    id,
    title,
    summary: `A premium, self-contained ${c.type.toLowerCase()} landing page in the ${P[pk].name} style, with catalog effects (animated gradient, glass nav, scroll-reveal, card-lift, scroll-progress, gradient text) baked in.`,
    description: `Full-page ${c.type} template — “${plain}”. Sticky glass nav, animated hero, ${c.recipe.length} sections, and a footer, all in one file. Recolor via the :root tokens; replace the marked content. Part of a generated family spanning ${Object.keys(P).length} palettes.`,
    theme: "website-templates",
    categories: ["template", c.group],
    tags: ["template", "full-page", c.key, c.group, pk, "responsive", "effects"],
    tech: ["html", "css", "js"],
    era: "2020s",
    difficulty: "intermediate",
    dependencies: [],
    browser_support: "All modern browsers.",
    performance_notes: "Pure HTML/CSS + a few lines of vanilla JS (scroll-progress, IntersectionObserver reveals). No images or libraries.",
    accessibility_notes: "Semantic landmarks, real headings/links/forms, focus-visible rings, and a prefers-reduced-motion guard that disables animation and reveals.",
    customization: [
      { name: ":root tokens", description: "Palette colors, radius, fonts", default: P[pk].name + " palette" },
      { name: "content regions", description: "Brand, headline, features, prices, copy", default: "edit markup" },
    ],
    variations: [`Same template in other palettes (${Object.keys(P).join(", ")})`, "Reorder or drop sections", "Swap gradient placeholders for real images"],
    related: ["animated-gradient", "glass-navbar", "card-lift", "reveal-on-scroll", "scroll-progress-bar", "gradient-text"],
    ai_usage: `Use as a ready-to-ship ${c.type} page. Copy the whole file; reskin by editing the :root custom properties (colors/radius/font) and replacing the content in each <section>. Sections are independent — reorder or delete freely. It composes catalog effects inline (animated gradient hero, glassmorphic sticky nav, scroll-triggered reveals, card hover-lift, a scroll-progress bar, and gradient text) so you get a premium feel with zero dependencies. Replace the gradient placeholder blocks with real <img> (add alt text). Responsive and reduced-motion safe out of the box.`,
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<script type="application/json" id="effect-meta">
${JSON.stringify(meta, null, 2)}
</script>
<style>${baseCSS(p)}</style>
</head>
<body>
<div class="prog"></div>
${B.nav(p, c)}
${blocks}
${B.footer(p, c)}
${sharedJS}
</body>
</html>
`;
}

/* ----------------------------- write ----------------------------- */
let n = 0;
const seen = new Set();
for (const c of CATS) {
  for (const pk of c.styles) {
    if (!P[pk]) continue;
    const id = `${c.key}-${pk}`;
    if (seen.has(id)) continue;
    seen.add(id);
    writeFileSync(join(OUT, `${id}.html`), page(c, pk), "utf8");
    n++;
  }
}
console.log(`✓ Generated ${n} premium templates across ${CATS.length} categories × up to ${Object.keys(P).length} palettes.`);
