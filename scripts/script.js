/* ═══════════════════════════════════════════════════════
       CARD DATA
       Add/remove cards here. rotation = tilt in degrees.
    ═══════════════════════════════════════════════════════ */
const CARDS = [
     {
          quote: "i like him enough to spend literally hours making ts for him. 🙄<br><br>this guy is one of my best friends and i would trust him with <em>almost</em> anything. he's the type to leave me on delivered, force me to double text him, only for him to then leave me on read. but he's also the guy who'd drop everything to come to us during a time of need. he's the guy who makes sure we're safe, taken care of, and comfortable. he's a teddy bear tryna be nonchalant but his heart is too big to let him be. he <strong>will</strong> take care of you; just as he has done for us. he loves - sometimes silently, but always hard. 😉",
          attr: "— Sherwin",
          rotation: 0.9,
     },
     {
          quote: "Benny has always been the best brother from another mother to me. He’ll always be there for you and he works way too hard for someone who doesn’t need to. He has a lot of love to give - he’s just waiting for the right woman to give it to!<br><br>P.S. Thanks for sponsoring my husband and I’s China trip.",
          attr: "— Cassy",
          rotation: -1.5,
     },
     {
          quote: "I’ve known this guy for 20 years, so I can confidently say he’s one of the most thoughtful and considerate people out there. He always goes above and beyond for his friends, always shows up when it matters, and somehow still has time to be ridiculously talented too. This man can sing, cook, AND hold a 3-hour yap session about literally any topic you’re interested in like he’s hosting a podcast nobody asked for. Honestly feels unfair that one person got allocated this many stats. If he’s serenading you while making dinner and passionately explaining random facts at 1am, it’s probably already over for you.",
          attr: "— Bryan",
          rotation: 2.5,
     },
     {
          quote: "",
          attr: "— Caylia",
          rotation: -3.5,
     },
     {
          quote: "",
          attr: "— Bryan",
          rotation: 1.5,
     },
     {
          quote: "",
          attr: "— Anyone else who wants to join!",
          rotation: 1.5,
     },
];

/* ═══════════════════════════════════════════════════════
       EMOJI CONFIG
       Add/remove emojis and tune their orbits here.
       x: 0 = left edge, 1 = right edge of viewport
       y: 0 = top,       1 = bottom of viewport
       drift: how far they wander (px), speed: orbit speed
    ═══════════════════════════════════════════════════════ */
const EMOJIS = [
     { char: "👍", x: 0.12, y: 0.22, drift: 18, speed: 2.8, size: "1.6rem", delay: 0 },
     { char: "✨", x: 0.82, y: 0.18, drift: 14, speed: 3.4, size: "1.3rem", delay: 0.3 },
     { char: "💛", x: 0.08, y: 0.65, drift: 20, speed: 2.2, size: "1.5rem", delay: 0.7 },
     { char: "🥺", x: 0.88, y: 0.55, drift: 16, speed: 3.1, size: "1.4rem", delay: 0.2 },
     { char: "👍", x: 0.75, y: 0.78, drift: 12, speed: 2.6, size: "1.2rem", delay: 0.5 },
     { char: "✨", x: 0.2, y: 0.82, drift: 15, speed: 3.7, size: "1.1rem", delay: 0.9 },
     { char: "💛", x: 0.9, y: 0.35, drift: 10, speed: 3, size: "1.5rem", delay: 0.4 },
     { char: "🌟", x: 0.15, y: 0.45, drift: 22, speed: 2.9, size: "1.2rem", delay: 0.6 },
];

/* ═══════════════════════════════════════════════════════
       SCROLL TIMING  (px of scroll per phase)
    ═══════════════════════════════════════════════════════ */
const DEAL_SCROLL = 350; // px per card deal
const HOLD_SCROLL = 60; // hold fully stacked
const EXIT_SCROLL = 380; // each card's individual exit duration
const EXIT_STAGGER = 80; // px scroll between each card starting to exit
const PEEK = 10; // px each buried card peeks above next
const START_SCALE = 0.82; // scale when card starts rising
const START_OFFSET = 110; // px below viewport where each card begins

/* ═══════════════════════════════════════════════════════
       BUILD DOM
    ═══════════════════════════════════════════════════════ */
const driver = document.getElementById("cards-driver");
const stage = document.getElementById("cards-stage");
const glowEl = document.getElementById("cards-glow");
const ribbon = document.getElementById("cards-ribbon");
const N = CARDS.length;

// Driver height: totalScroll + partial buffer (glow is sticky so no rip risk)
const totalScroll = N * DEAL_SCROLL + HOLD_SCROLL + (N - 1) * EXIT_STAGGER + EXIT_SCROLL;
driver.style.height = totalScroll + window.innerHeight * 0.35 + "px";

// Inject cards
const cardEls = CARDS.map((data, i) => {
     const el = document.createElement("div");
     el.className = "quote-card";
     el.style.zIndex = i + 20;
     el.innerHTML = `
        <div class="quote-mark">&ldquo;</div>
        <p class="quote-text">${data.quote}</p>
        <p class="quote-attr">${data.attr}</p>
      `;
     stage.appendChild(el);
     return el;
});

// Inject emojis
const emojiEls = EMOJIS.map((cfg) => {
     const el = document.createElement("div");
     el.className = "float-emoji";
     el.textContent = cfg.char;
     el.style.fontSize = cfg.size;
     el.style.zIndex = 25;
     stage.appendChild(el);
     return { el, cfg };
});

/* ═══════════════════════════════════════════════════════
       HELPERS
    ═══════════════════════════════════════════════════════ */
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

function getTargetY(i, cardH) {
     const T = window.innerHeight / 2 - cardH / 2 + ((N - 1) * PEEK) / 2;
     return T - (N - 1 - i) * PEEK;
}

// Ribbon sits above the top card by ~60px
function getRibbonY(cardH) {
     const topCardY = getTargetY(N - 1, cardH);
     return topCardY - 52;
}

/* ═══════════════════════════════════════════════════════
       ANIMATION LOOP
    ═══════════════════════════════════════════════════════ */
let time = 0;
let lastTs = null;

function update(ts) {
     if (lastTs !== null) time += (ts - lastTs) / 1000;
     lastTs = ts;

     const scrollProgress = -driver.getBoundingClientRect().top;

     // ── GLOW BACKGROUND ──────────────────
     // Fades in immediately as sequence starts, out during exit
     const glowIn = clamp(scrollProgress / (DEAL_SCROLL * 0.4), 0, 1);
     const glowOut = clamp((scrollProgress - (N * DEAL_SCROLL + HOLD_SCROLL + EXIT_SCROLL * 1.2)) / (EXIT_SCROLL * 2.0), 0, 1);
     const glowVal = easeInOutSine(glowIn) * (1 - easeInOutSine(glowOut));
     glowEl.style.opacity = glowVal;

     // ── CARDS ────────────────────────────
     const exitStart = N * DEAL_SCROLL + HOLD_SCROLL;

     // Shared exitT for ribbon/glow (driven by first card — top card, i=N-1)
     const sharedExitT = easeOutCubic(clamp((scrollProgress - exitStart) / EXIT_SCROLL, 0, 1));

     let cardH = cardEls[0] ? cardEls[0].offsetHeight : 300;

     cardEls.forEach((el, i) => {
          const dealT = easeOutCubic(clamp((scrollProgress - i * DEAL_SCROLL) / DEAL_SCROLL, 0, 1));
          const targetY = getTargetY(i, cardH);
          const startY = window.innerHeight + START_OFFSET;

          // Top card (i = N-1) exits first, bottom card exits last
          const cardExitStart = exitStart + (N - 1 - i) * EXIT_STAGGER;
          const exitT = easeOutCubic(clamp((scrollProgress - cardExitStart) / EXIT_SCROLL, 0, 1));

          let y, scale;

          if (exitT > 0) {
               const exitDist = targetY + cardH + 120;
               y = targetY - exitT * exitDist;
               scale = 1;
          } else {
               y = lerp(startY, targetY, dealT);
               scale = lerp(START_SCALE, 1, dealT);
          }

          const rotation = CARDS[i].rotation;
          el.style.transform = `translateX(-50%) translateY(${y}px) rotate(${rotation}deg) scale(${scale})`;
     });

     // ── RIBBON ──────────────────────────
     // Starts materializing early, arrives just before first card lands
     const ribbonIn = clamp((scrollProgress - DEAL_SCROLL * 0.3) / 180, 0, 1);
     const ribbonOut = sharedExitT;
     const ribbonOpacity = easeInOutSine(ribbonIn) * (1 - easeInOutSine(ribbonOut));

     const ribbonY = getRibbonY(cardH);
     ribbon.style.opacity = ribbonOpacity;
     ribbon.style.top = ribbonY + "px";

     if (sharedExitT > 0) {
          const exitDist = ribbonY + 60;
          ribbon.style.transform = `translateX(-50%) translateY(${-sharedExitT * exitDist}px)`;
     } else {
          ribbon.style.transform = `translateX(-50%) translateY(0)`;
     }

     // ── FLOATING EMOJIS ──────────────────
     // Appear in sync with ribbon, fade out with exit
     const emojiIn = clamp((scrollProgress - DEAL_SCROLL * 0.3) / 200, 0, 1);
     emojiEls.forEach(({ el, cfg }) => {
          const emojiOut = clamp((scrollProgress - (N * DEAL_SCROLL + HOLD_SCROLL * 0.5)) / (EXIT_SCROLL * 0.6), 0, 1);
          const emojiOpacity = easeInOutSine(emojiIn) * (1 - easeInOutSine(emojiOut));

          // Gentle floating orbit using sin/cos with per-emoji offsets
          const t = time * cfg.speed + cfg.delay * 4;
          const floatX = Math.sin(t) * cfg.drift;
          const floatY = Math.cos(t * 0.7) * cfg.drift * 0.6;

          const baseX = cfg.x * window.innerWidth;
          const baseY = cfg.y * window.innerHeight;

          el.style.opacity = emojiOpacity;
          el.style.left = baseX + floatX + "px";
          el.style.top = baseY + floatY + "px";
     });

     requestAnimationFrame(update);
}

requestAnimationFrame(update);

// Recalculate driver height on resize
window.addEventListener("resize", () => {
     driver.style.height = N * DEAL_SCROLL + HOLD_SCROLL + (N - 1) * EXIT_STAGGER + EXIT_SCROLL + window.innerHeight * 0.35 + "px";
});

/* ═══════════════════════════════════════════════════════
       SCROLL REVEAL
    ═══════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(
     (entries) => {
          entries.forEach((entry) => {
               if (!entry.isIntersecting) return;
               entry.target.classList.add("visible");
               revealObserver.unobserve(entry.target);
          });
     },
     { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

document.getElementById("scroll-cta").addEventListener("click", () => {
     const targetSection = document.getElementById("photo-1");

     // 1. Get the current distance from the top of the page to the section
     const elementPosition = targetSection.getBoundingClientRect().top + window.scrollY;

     // 2. Subtract some px to create that "under the UI" buffer
     const offsetPosition = elementPosition - 10;

     // 3. Perform the smooth scroll
     window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
     });
});

/* ═══════════════════════════════════════════════════════
       HERO ENHANCEMENT 1 — PARTICLE STAR FIELD
    ═══════════════════════════════════════════════════════ */
(function () {
     const canvas = document.getElementById("hero-particles");
     const ctx = canvas.getContext("2d");
     let particles = [];

     function buildParticles() {
          particles = [];
          const density = 5500; // px² per particle
          const count = Math.max(80, Math.floor((canvas.width * canvas.height) / density));
          for (let i = 0; i < count; i++) {
               particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 1.6 + 0.5,
                    baseOpacity: Math.random() * 0.45 + 0.18,
                    twinkleSpeed: Math.random() * 0.9 + 0.25,
                    twinkleOffset: Math.random() * Math.PI * 2,
                    vx: (Math.random() - 0.5) * 0.07,
                    vy: (Math.random() - 0.5) * 0.05,
                    isGold: Math.random() > 0.52,
               });
          }
     }

     function resizeCanvas() {
          const rect = canvas.getBoundingClientRect();
          const w = rect.width || window.innerWidth;
          const h = rect.height || window.innerHeight;
          canvas.width = w;
          canvas.height = h;
          buildParticles();
     }

     let ptStart = null;
     function drawFrame(ts) {
          // If canvas still has no real size (rare edge case), keep waiting
          if (canvas.width < 10 || canvas.height < 10) {
               resizeCanvas();
          }
          if (!ptStart) ptStart = ts;
          const t = (ts - ptStart) / 1000;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          particles.forEach((p) => {
               p.x += p.vx;
               p.y += p.vy;
               if (p.x < 0) p.x = canvas.width;
               if (p.x > canvas.width) p.x = 0;
               if (p.y < 0) p.y = canvas.height;
               if (p.y > canvas.height) p.y = 0;

               const twinkle = 0.5 + 0.5 * Math.sin(t * p.twinkleSpeed + p.twinkleOffset);
               const alpha = p.baseOpacity * (0.35 + 0.65 * twinkle);

               ctx.beginPath();
               ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
               ctx.fillStyle = p.isGold ? `rgba(201,169,106,${alpha})` : `rgba(242,237,230,${alpha})`;
               ctx.fill();
          });

          requestAnimationFrame(drawFrame);
     }

     window.addEventListener("resize", resizeCanvas);
     // Defer first sizing until after first paint so hero has real pixel dimensions
     requestAnimationFrame(() => {
          resizeCanvas();
          requestAnimationFrame(drawFrame);
     });
})();

/* ═══════════════════════════════════════════════════════
       HERO ENHANCEMENT 2 — ORB FLOAT + MOUSE PARALLAX
    ═══════════════════════════════════════════════════════ */
(function () {
     const hero = document.getElementById("hero");
     const orb1 = document.querySelector(".hero-orb-1");
     const orb2 = document.querySelector(".hero-orb-2");
     let mouseNX = 0,
          mouseNY = 0; // normalised -1..1
     let o1x = 0,
          o1y = 0,
          o2x = 0,
          o2y = 0;
     const orbStart = performance.now();

     window.addEventListener("mousemove", (e) => {
          const rect = hero.getBoundingClientRect();
          if (e.clientY < rect.top || e.clientY > rect.bottom) return;
          mouseNX = (e.clientX / window.innerWidth - 0.5) * 2;
          mouseNY = (e.clientY / window.innerHeight - 0.5) * 2;
     });

     function tickOrbs() {
          const t = (performance.now() - orbStart) / 1000;

          // Gentle sine-wave float (replaces CSS orbFloat)
          const f1x = Math.sin(t * 0.62) * 28;
          const f1y = Math.cos(t * 0.47) * 18;
          const f2x = Math.sin(t * 0.51 + 1.3) * 22;
          const f2y = Math.cos(t * 0.58 + 0.9) * 16;

          // Smooth parallax
          o1x += (mouseNX * -38 - o1x) * 0.04;
          o1y += (mouseNY * -26 - o1y) * 0.04;
          o2x += (mouseNX * 30 - o2x) * 0.04;
          o2y += (mouseNY * 20 - o2y) * 0.04;

          orb1.style.transform = `translate(${f1x + o1x}px, ${f1y + o1y}px)`;
          orb2.style.transform = `translate(${f2x + o2x}px, ${f2y + o2y}px)`;

          requestAnimationFrame(tickOrbs);
     }

     requestAnimationFrame(tickOrbs);
})();

/* ═══════════════════════════════════════════════════════
       HERO ENHANCEMENT 3 — CHARACTER-BY-CHARACTER NAME
    ═══════════════════════════════════════════════════════ */
(function () {
     const nameEl = document.querySelector(".hero-name");
     const FIRST = "Benny";
     const LAST = "Jung";
     const BASE_DELAY = 0.335; // first char (seconds)
     const CHAR_STEP = 0.037; // between each char
     const LINE_PAUSE = 0.08; // extra gap between lines

     let d = BASE_DELAY;
     let html = "";

     FIRST.split("").forEach((ch) => {
          html += `<span class="hero-char" style="animation-delay:${d.toFixed(3)}s">${ch}</span>`;
          d += CHAR_STEP;
     });

     html += "<br>";
     d += LINE_PAUSE;

     LAST.split("").forEach((ch) => {
          html += `<span class="hero-char" style="animation-delay:${d.toFixed(3)}s;color:var(--gold)">${ch}</span>`;
          d += CHAR_STEP;
     });

     nameEl.innerHTML = html;
})();
/* ═══════════════════════════════════════════════════════
       PARALLAX — HERO PHOTO  + KEN BURNS
    ═══════════════════════════════════════════════════════ */
(function () {
     const container = document.querySelector(".photo-feature");
     const img = container ? container.querySelector("img") : null;
     const KB_START = performance.now();

     function tickParallax() {
          const vh = window.innerHeight;
          const t = (performance.now() - KB_START) / 1000;

          if (img) {
               const rect = container.getBoundingClientRect();
               const progress = 1 - rect.bottom / (vh + rect.height);
               const clampedP = Math.min(Math.max(progress, 0), 1);
               const scrollOffset = (clampedP - 0.5) * 10; // existing parallax (%)

               // Ken Burns — slow breathe zoom + gentle camera drift
               const kbZoom = 1.055 + 0.035 * Math.sin(t * 0.08);
               const kbDriftX = Math.sin(t * 0.042) * 1.1; // %
               const kbDriftY = Math.cos(t * 0.055) * 0.85; // %

               img.style.transform = `scale(${kbZoom}) ` + `translateY(${scrollOffset / kbZoom + kbDriftY}%) ` + `translateX(${kbDriftX}%)`;
          }

          requestAnimationFrame(tickParallax);
     }

     requestAnimationFrame(tickParallax);
})();
/* ═══════════════════════════════════════════════════════
       LIVING PICTURE — bokeh dust canvas
    ═══════════════════════════════════════════════════════ */
(function () {
     const container = document.querySelector(".photo-feature");
     const canvas = container ? container.querySelector(".photo-living-canvas") : null;
     if (!canvas) return;
     const ctx = canvas.getContext("2d");

     function resize() {
          canvas.width = container.offsetWidth;
          canvas.height = container.offsetHeight;
     }
     window.addEventListener("resize", resize);
     resize();

     // Build bokeh particles
     const COUNT = 55;
     const particles = Array.from({ length: COUNT }, () => {
          const isGold = Math.random() > 0.55;
          return {
               x: Math.random(),
               y: Math.random(),
               r: 2 + Math.random() * 10,
               vy: -(0.00028 + Math.random() * 0.00045), // drift upward slowly
               vx: (Math.random() - 0.5) * 0.00014,
               baseOpacity: 0.12 + Math.random() * 0.25,
               twinkleSpeed: 0.25 + Math.random() * 0.7,
               twinkleOffset: Math.random() * Math.PI * 2,
               isGold,
          };
     });

     let bokehStart = null;
     function draw(ts) {
          if (!bokehStart) bokehStart = ts;
          const t = (ts - bokehStart) / 1000;
          const w = canvas.width,
               h = canvas.height;
          if (!w || !h) {
               requestAnimationFrame(draw);
               return;
          }

          ctx.clearRect(0, 0, w, h);

          particles.forEach((p) => {
               // Move
               p.y += p.vy;
               p.x += p.vx;
               // Wrap vertically; randomise x on re-entry
               if (p.y < -0.04) {
                    p.y = 1.04;
                    p.x = Math.random();
               }
               if (p.x < -0.04 || p.x > 1.04) p.x = Math.random();

               // Twinkle
               const twinkle = 0.5 + 0.5 * Math.sin(t * p.twinkleSpeed + p.twinkleOffset);
               const alpha = p.baseOpacity * (0.35 + 0.65 * twinkle);

               const px = p.x * w;
               const py = p.y * h;

               // Soft radial bokeh
               const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
               const rgb = p.isGold ? "201,169,106" : "232,223,210";
               grad.addColorStop(0, `rgba(${rgb},${alpha})`);
               grad.addColorStop(0.5, `rgba(${rgb},${alpha * 0.4})`);
               grad.addColorStop(1, `rgba(${rgb},0)`);

               ctx.beginPath();
               ctx.arc(px, py, p.r, 0, Math.PI * 2);
               ctx.fillStyle = grad;
               ctx.fill();
          });

          requestAnimationFrame(draw);
     }

     requestAnimationFrame(draw);
})();
/* ═══════════════════════════════════════════════════════
       ANIMATED GLOW CANVAS — fireplace warmth behind cards
    ═══════════════════════════════════════════════════════ */
(function () {
     const canvas = document.getElementById("glow-canvas");
     const ctx = canvas.getContext("2d");

     function resize() {
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
     }
     window.addEventListener("resize", resize);
     requestAnimationFrame(resize);

     // Each "ember" is a radial glow source with its own flicker rhythm
     const embers = [
          // cx%, cy%, radius%, r, g, b, baseAlpha, flickerSpeed, flickerAmp, flickerOffset
          { cx: 0.5, cy: 0.45, rr: 0.82, r: 210, g: 100, b: 20, a: 0.58, fs: 1.1, fa: 0.14, fo: 0.0 },
          { cx: 0.5, cy: 0.42, rr: 0.52, r: 240, g: 130, b: 30, a: 0.48, fs: 1.7, fa: 0.16, fo: 1.1 },
          { cx: 0.5, cy: 0.48, rr: 0.32, r: 255, g: 160, b: 50, a: 0.4, fs: 2.3, fa: 0.12, fo: 2.4 },
          { cx: 0.48, cy: 0.44, rr: 0.68, r: 180, g: 60, b: 10, a: 0.34, fs: 0.9, fa: 0.12, fo: 0.7 },
          { cx: 0.52, cy: 0.43, rr: 0.6, r: 200, g: 80, b: 15, a: 0.32, fs: 1.4, fa: 0.14, fo: 1.9 },
          // cool hints — tiny blue at the very centre for realism
          { cx: 0.5, cy: 0.56, rr: 0.08, r: 120, g: 140, b: 200, a: 0.06, fs: 3.1, fa: 0.04, fo: 3.3 },
     ];

     function draw(ts) {
          const t = ts / 1000;
          const w = canvas.width,
               h = canvas.height;
          if (!w || !h) {
               requestAnimationFrame(draw);
               return;
          }

          ctx.clearRect(0, 0, w, h);

          embers.forEach((e) => {
               const flicker = e.a + Math.sin(t * e.fs + e.fo) * e.fa + Math.sin(t * e.fs * 1.618 + e.fo + 1) * e.fa * 0.4;
               const alpha = Math.max(0, Math.min(1, flicker));

               const cx = w * e.cx;
               const cy = h * e.cy;
               const radius = Math.min(w, h) * e.rr;

               const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
               grad.addColorStop(0, `rgba(${e.r},${e.g},${e.b},${alpha})`);
               grad.addColorStop(0.5, `rgba(${e.r},${e.g},${e.b},${alpha * 0.4})`);
               grad.addColorStop(1, `rgba(${e.r},${e.g},${e.b},0)`);

               ctx.beginPath();
               ctx.fillStyle = grad;
               ctx.fillRect(0, 0, w, h);
          });

          requestAnimationFrame(draw);
     }

     requestAnimationFrame(draw);
})();
/* PROS / CONS FLIP CARDS */
document.querySelectorAll(".flip-card").forEach((card) => {
     card.addEventListener("click", () => {
          card.classList.toggle("flipped");
          card.classList.add("has-flipped");
     });
});

/* ═══════════════════════════════════════════════════════
       GALLERY LIGHTBOX
    ═══════════════════════════════════════════════════════ */
(function () {
     const lightbox = document.getElementById("gallery-lightbox");
     const lbImg = document.getElementById("lightbox-img");
     const lbCaption = document.getElementById("lightbox-caption");
     const lbCloseHint = document.getElementById("lightbox-close-hint");
     const thumbHint = document.getElementById("thumb-hint");
     let anyOpened = false;
     let closeHintShown = false;

     // Enable thumbnail hint only after the gallery item's reveal transition completes
     const firstItem = document.querySelector('.gallery-item[data-index="0"]');
     const hintObserver = new IntersectionObserver(
          (entries) => {
               entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                         setTimeout(() => thumbHint.classList.add("active"), 750);
                         hintObserver.disconnect();
                    }
               });
          },
          { threshold: 0.5 },
     );
     hintObserver.observe(firstItem);

     function openLightbox(item) {
          lbImg.src = item.querySelector("img").src;
          lbCaption.textContent = item.dataset.caption || "";
          lbCloseHint.classList.remove("show");
          lightbox.classList.add("open");
          document.body.style.overflow = "hidden";

          if (!anyOpened) {
               anyOpened = true;
               thumbHint.classList.add("gone");
          }

          if (!closeHintShown) {
               closeHintShown = true;
               setTimeout(() => lbCloseHint.classList.add("show"), 200);
               // At 1.5s: stop the pulse animation first (prevents scale snap),
               // then the opacity transition fades it out smoothly over 0.5s
               setTimeout(() => {
                    lbCloseHint.style.animation = "none";
                    lbCloseHint.style.opacity = "0";
                    setTimeout(() => {
                         lbCloseHint.classList.remove("show");
                         lbCloseHint.style.animation = "";
                         lbCloseHint.style.opacity = "";
                    }, 500);
               }, 1500);
          }
     }

     function closeLightbox() {
          lightbox.classList.remove("open");
          document.body.style.overflow = "";
          setTimeout(() => {
               lbImg.src = "";
          }, 300);
     }

     document.querySelectorAll(".gallery-item").forEach((item) => {
          item.addEventListener("click", () => openLightbox(item));
     });

     lightbox.addEventListener("click", closeLightbox);
})();

/* ═══════════════════════════════════════════════════════
       HEART CONFETTI
    ═══════════════════════════════════════════════════════ */
(function () {
     const canvas = document.createElement("canvas");
     canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:999";
     document.body.appendChild(canvas);
     const ctx = canvas.getContext("2d");

     function resize() {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
     }
     window.addEventListener("resize", resize);
     resize();

     const COLORS = ["#c9a96a", "#e8cfa0", "#e8a0b0", "#d4747a", "#f0b0bc"];
     const COUNT = 38;
     let hearts = [];
     let animId = null;

     function spawnHearts() {
          hearts = Array.from({ length: COUNT }, () => ({
               x: Math.random() * canvas.width,
               y: -Math.random() * 60,
               vx: (Math.random() - 0.5) * 1.8,
               vy: Math.random() * 2 + 1.5,
               size: Math.random() * 12 + 8,
               rotation: Math.random() * Math.PI * 2,
               rotationSpeed: (Math.random() - 0.5) * 0.06,
               color: COLORS[Math.floor(Math.random() * COLORS.length)],
               opacity: Math.random() * 0.35 + 0.65,
               swayAmp: Math.random() * 25 + 10,
               swaySpeed: Math.random() * 0.025 + 0.01,
               swayOffset: Math.random() * Math.PI * 2,
               t: 0,
          }));

          if (animId) cancelAnimationFrame(animId);
          animate();
     }

     function drawHeart(x, y, size, rotation, color, opacity) {
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = color;
          ctx.translate(x, y);
          ctx.rotate(rotation);
          ctx.scale(size, size);
          ctx.beginPath();
          ctx.moveTo(0, -0.3);
          ctx.bezierCurveTo(0.5, -0.8, 1, -0.2, 0, 0.5);
          ctx.bezierCurveTo(-1, -0.2, -0.5, -0.8, 0, -0.3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
     }

     function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          hearts.forEach((h) => {
               h.t += 1;
               h.x += h.vx + Math.sin(h.t * h.swaySpeed + h.swayOffset) * h.swayAmp * 0.04;
               h.y += h.vy;
               h.rotation += h.rotationSpeed;
               drawHeart(h.x, h.y, h.size, h.rotation, h.color, h.opacity);
          });

          hearts = hearts.filter((h) => h.y - h.size < canvas.height);

          if (hearts.length > 0) {
               animId = requestAnimationFrame(animate);
          } else {
               ctx.clearRect(0, 0, canvas.width, canvas.height);
               animId = null;
          }
     }

     const creditEl = document.querySelector(".closing-credit");
     if (creditEl) {
          new IntersectionObserver(
               (entries) => {
                    entries.forEach((entry) => {
                         if (entry.isIntersecting) {
                              spawnHearts();
                              setTimeout(spawnPlease, 2750);
                         }
                    });
               },
               { threshold: 0.1 },
          ).observe(creditEl);
     }
})();

/* ═══════════════════════════════════════════════════════
       PLEASE 🥺 — comedic letter drop
       ── To change the text, edit TEXT below. Handles any
          string, including emoji. ──
    ═══════════════════════════════════════════════════════ */
(function () {
     const TEXT = "please 🥺"; // ← edit freely
     const FONT_SIZE = 2.0; // rem
     const FONT_WEIGHT = "500"; // thinner

     window.spawnPlease = function () {
          // Array.from splits emoji-safely into individual tokens
          const tokens = Array.from(TEXT);
          const n = tokens.length;

          // Measure character widths in px from live root font-size
          const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
          const charW = FONT_SIZE * rem * 0.66; // approx width per glyph
          const spaceW = FONT_SIZE * rem * 0.38; // width of a space gap

          // Build x-offsets so the whole word is centered on screen
          const offsets = [];
          let totalW = 0;
          tokens.forEach((tok) => {
               offsets.push(totalW);
               totalW += tok === " " ? spaceW : charW;
          });
          totalW -= charW * 0.25; // trim trailing advance
          const startX = window.innerWidth / 2 - totalW / 2;

          // Land just below the "made with love" credit text
          const creditEl = document.querySelector(".closing-credit");
          const landY = creditEl ? creditEl.getBoundingClientRect().bottom + 32 : window.innerHeight * 0.78;

          tokens.forEach((char, i) => {
               if (char === " ") return; // gap only, no element

               const isLast = i === n - 1;
               const baseX = startX + offsets[i] + charW / 2;

               const cfg = {
                    char,
                    baseX,
                    landY,
                    wobbleAmp: 20 + Math.random() * 24,
                    wobbleFreq: 2.4 + Math.random() * 2.8,
                    wobblePhase: Math.random() * Math.PI * 2,
                    delay: i * 0.12, // consistent stagger for any string
                    isLast,
               };

               spawnToken(cfg);
          });
     };

     function spawnToken(cfg) {
          const el = document.createElement("div");
          el.textContent = cfg.char;

          Object.assign(el.style, {
               position: "fixed",
               top: "0px",
               left: cfg.baseX + "px",
               fontSize: FONT_SIZE + "rem",
               fontFamily: "'Outfit', sans-serif",
               fontWeight: FONT_WEIGHT,
               color: "#e8cfa0",
               textShadow: "0 3px 12px rgba(0,0,0,0.7), 0 0 24px rgba(201,169,106,0.35)",
               pointerEvents: "none",
               zIndex: "1000",
               opacity: "0",
               willChange: "transform, opacity",
               userSelect: "none",
               lineHeight: "1",
          });

          document.body.appendChild(el);

          const startY = -80;
          let y = startY;
          let vy = 0;
          const gravity = 3000;
          let phase = "falling";
          let t = 0;
          let landedAt = null;
          let currentRotation = (Math.random() - 0.5) * 22; // chaotic during fall
          let lastTs = null;
          let opacity = 0;

          function tick(ts) {
               if (lastTs === null) {
                    lastTs = ts;
                    requestAnimationFrame(tick);
                    return;
               }
               const dt = Math.min((ts - lastTs) / 1000, 0.05);
               lastTs = ts;
               t += dt;

               if (phase === "falling") {
                    opacity = Math.min(1, t * 4);
                    vy += gravity * dt;
                    y += vy * dt;

                    // Horizontal flail + rotation panic during fall
                    const wx = Math.sin(t * cfg.wobbleFreq * Math.PI * 2 + cfg.wobblePhase) * cfg.wobbleAmp;
                    currentRotation += (Math.random() - 0.5) * 170 * dt;

                    const fallProgress = Math.min((y - startY) / (cfg.landY - startY), 1);
                    const sc = 0.85 + fallProgress * 0.15;

                    if (y >= cfg.landY) {
                         y = cfg.landY;
                         if (cfg.isLast) {
                              vy = -vy * 0.2; // last token bounces
                              phase = "bouncing";
                         } else {
                              phase = "resting";
                              landedAt = ts;
                         }
                    }

                    el.style.opacity = opacity;
                    el.style.transform = `translate(-50%, 0) translateX(${wx}px) translateY(${y}px) rotate(${currentRotation}deg) scale(${sc})`;
               } else if (phase === "bouncing") {
                    vy += gravity * dt;
                    y += vy * dt;

                    if (y >= cfg.landY) {
                         y = cfg.landY;
                         phase = "resting";
                         landedAt = ts;
                    }

                    // Straighten out during bounce
                    currentRotation *= 0.82;
                    el.style.transform = `translate(-50%, 0) translateY(${y}px) rotate(${currentRotation}deg)`;
               } else if (phase === "resting") {
                    const restAge = (ts - landedAt) / 1000;

                    // Smoothly snap rotation to 0° on landing
                    currentRotation *= 0.78;

                    // Squash-stretch impact
                    if (restAge < 0.14) {
                         const sq = 1 - Math.sin((restAge / 0.14) * Math.PI) * 0.25;
                         el.style.transform = `translate(-50%, 0) translateY(${y}px) rotate(${currentRotation}deg) scaleX(${1 + (1 - sq) * 0.45}) scaleY(${sq})`;
                    } else {
                         el.style.transform = `translate(-50%, 0) translateY(${y}px) rotate(${currentRotation}deg)`;
                    }

                    if (restAge > 2.4) phase = "fadingOut";
               } else if (phase === "fadingOut") {
                    opacity -= dt * 0.5;
                    if (opacity <= 0) {
                         el.remove();
                         return;
                    }
                    el.style.opacity = opacity;
                    el.style.transform = `translate(-50%, 0) translateY(${y + (1 - opacity) * 28}px) rotate(${currentRotation}deg)`;
               }

               requestAnimationFrame(tick);
          }

          setTimeout(() => requestAnimationFrame(tick), cfg.delay * 1000);
     }
})();

/* ═══════════════════════════════════════════════════════
       HERO MUSIC PLAYER
    ═══════════════════════════════════════════════════════ */
(function () {
     const audio = new Audio();
     audio.loop = true;
     let activeBtn = null;

     document.querySelectorAll(".music-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
               if (activeBtn === btn) {
                    audio.pause();
                    btn.classList.remove("playing");
                    activeBtn = null;
                    return;
               }

               if (activeBtn) activeBtn.classList.remove("playing");

               audio.src = btn.dataset.src;
               audio.currentTime = 0;
               audio.load(); // Safari handshake

               audio.play()
                    .then(() => {
                         btn.classList.add("playing");
                         activeBtn = btn;
                    })
                    .catch((err) => {
                         console.warn("Playback blocked:", err);
                    });
          });
     });
})();

/* ═══════════════════════════════════════════════════════
       DATING RESUME — SKILL LEVELS
       ── Edit the level values below (range: 1–5, increments of 0.25) ──
    ═══════════════════════════════════════════════════════ */
const SKILLS = [
     { name: "Communication", level: 4 },
     { name: "Reliability", level: 5 },
     { name: "Listening", level: 3.5 },
     { name: "Affection", level: 4.5 },
     { name: "Humor", level: 2 },
     { name: "Energy", level: 3.5 },
     { name: "Spontaneity", level: 3.5 },
     { name: "Financial Stability", level: 5 },
];

function buildDot(skillIdx, dotIdx, level) {
     const dotNumber = dotIdx + 1;
     const whole = Math.floor(level);
     const frac = Math.round((level - whole) * 4) / 4; // snap to nearest 0.25
     const filled = dotNumber <= whole;
     const isPartial = !filled && dotNumber === whole + 1 && frac > 0;
     const cx = 10,
          cy = 10,
          r = 8;
     const id = `clip-${skillIdx}-${dotIdx}`;

     const outline = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity="0.25"/>`;

     if (filled) {
          return `<svg width="22" height="22" viewBox="0 0 20 20">${outline}<circle class="dot-fill-el" style="transition-delay:${650 + dotIdx * 80}ms" cx="${cx}" cy="${cy}" r="${r}" fill="var(--gold)"/></svg>`;
     }

     if (isPartial) {
          let clip;
          if (frac === 0.25) {
               // Top-left quadrant only
               clip = `<rect x="${cx - r}" y="${cy - r}" width="${r}" height="${r}"/>`;
          } else if (frac === 0.5) {
               // Left half
               clip = `<rect x="${cx - r}" y="${cy - r}" width="${r}" height="${2 * r}"/>`;
          } else if (frac === 0.75) {
               // Three quarters — missing bottom-right (left half + top-right)
               clip =
                    `<rect x="${cx - r}" y="${cy - r}" width="${r}" height="${2 * r}"/>` +
                    `<rect x="${cx}" y="${cy - r}" width="${r}" height="${r}"/>`;
          }
          return `<svg width="22" height="22" viewBox="0 0 20 20"><defs><clipPath id="${id}">${clip}</clipPath></defs>${outline}<circle class="dot-fill-el" style="transition-delay:${650 + dotIdx * 80}ms" cx="${cx}" cy="${cy}" r="${r}" fill="var(--gold)" clip-path="url(#${id})"/></svg>`;
     }

     return `<svg width="22" height="22" viewBox="0 0 20 20">${outline}</svg>`;
}

const skillContainer = document.getElementById("skill-rows");
SKILLS.forEach((skill, si) => {
     const dots = Array.from({ length: 5 }, (_, di) => buildDot(si, di, skill.level)).join("");
     const row = document.createElement("div");
     row.className = "skill-row reveal";
     row.style.transitionDelay = `${si * 0.05}s`;
     row.innerHTML = `<span class="skill-name">${skill.name}</span><div class="skill-dots">${dots}</div>`;
     skillContainer.appendChild(row);
     revealObserver.observe(row);
});

/* ═══════════════════════════════════════════════════════
   ABOUT SECTION — CUPID FLUTTER  (fixed to viewport)

   Zone condition (no latch, fully symmetric):
     inZone = heading.top ≤ vh/2  AND  proscons.top > vh/2

   Scroll DOWN → heading crosses vh/2 → enter zone → flyIn
                  pros-cons crosses vh/2 → leave zone → flyOut
   Scroll UP   → pros-cons crosses vh/2 back up → enter zone → flyIn
                  heading crosses vh/2 back up → leave zone → flyOut
═══════════════════════════════════════════════════════ */
(function () {
     const about = document.getElementById("about");
     const prosCons = document.getElementById("pros-cons");
     if (!about || !prosCons) return;

     /* ── PNG factory ─────────────────────────────── */
     function makeCupidImg() {
          const img = document.createElement("img");
          img.src = "images/cupid.png";
          img.alt = "";
          img.draggable = false;
          return img;
     }

     /* ── Config ──────────────────────────────────────
        yAnchor : fraction of viewport height (0=top, 1=bottom)
        driftR  : wobble radius px
        speed   : orbit speed multiplier
        phase   : phase offset so they don't move in sync
     ─────────────────────────────────────────────── */
     const CUPID_CFG = [
          { side: "left", yAnchor: 0.3, driftR: 22, speed: 0.55, phase: 0 },
          { side: "right", yAnchor: 0.58, driftR: 18, speed: 0.48, phase: Math.PI },
          { side: "left", yAnchor: 0.72, driftR: 14, speed: 0.62, phase: Math.PI * 0.7, desktopOnly: true },
     ];

     /* ── Build DOM elements ──────────────────────── */
     const cupidEls = [];
     CUPID_CFG.forEach((cfg) => {
          const el = document.createElement("div");
          el.className = "cupid" + (cfg.side === "left" ? " flip" : "");
          el.appendChild(makeCupidImg());
          el.style.opacity = "0";
          document.body.appendChild(el);
          cupidEls.push({ el, cfg });
     });

     /* ── Animation state ─────────────────────────── */
     const FLY_MS = 650;
     let flyDir = 0; // +1 in, -1 out
     let flyProgress = 0; // 0..1
     let flyStartT = null;
     let orbitStartT = null;
     let animId = null;

     const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

     /* ── Render tick ─────────────────────────────── */
     function tick(ts) {
          if (!orbitStartT) orbitStartT = ts;
          if (!flyStartT) flyStartT = ts;

          const tNorm = Math.min((ts - flyStartT) / FLY_MS, 1);
          flyProgress = flyDir === 1 ? easeSine(tNorm) : 1 - easeSine(tNorm);

          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const orbitT = (ts - orbitStartT) / 1000;
          const isDesk = vw >= 768;

          cupidEls.forEach(({ el, cfg }) => {
               if (cfg.desktopOnly && !isDesk) {
                    el.style.opacity = "0";
                    return;
               }

               /* Size matches CSS breakpoints */
               const sz = vw >= 1024 ? 112 : vw >= 640 ? 96 : 78;

               /* Rest X: outside 680 px content column on desktop, edge on mobile */
               const CONTENT_W = 680;
               const pad = 6;
               let restX;
               if (isDesk && vw > CONTENT_W) {
                    const colEdge = (vw - CONTENT_W) / 2;
                    restX = cfg.side === "left" ? Math.max(pad, colEdge - sz - 8) : Math.min(vw - sz - pad, vw - colEdge + 8);
               } else {
                    restX = cfg.side === "left" ? pad : vw - sz - pad;
               }

               const offX = cfg.side === "left" ? -(sz + 20) : vw + 20;
               const wobbleX = Math.sin(orbitT * cfg.speed + cfg.phase) * cfg.driftR * flyProgress;
               const wobbleY = Math.cos(orbitT * cfg.speed * 0.7 + cfg.phase) * cfg.driftR * 0.5 * flyProgress;
               const slideX = offX + (restX - offX) * flyProgress;
               const x = slideX + (cfg.side === "left" ? wobbleX : -wobbleX);
               const y = cfg.yAnchor * vh - sz / 2 + wobbleY;
               const tilt = cfg.side === "left" ? -18 * (1 - flyProgress) : 18 * (1 - flyProgress);

               el.style.transform = `translate(${x}px,${y}px) rotate(${tilt}deg)`;
               el.style.opacity = String(flyProgress);
          });

          const done = tNorm >= 1 && flyDir === -1 && flyProgress <= 0.001;
          if (!done) {
               animId = requestAnimationFrame(tick);
          } else {
               cancelAnimationFrame(animId);
               animId = null;
          }
     }

     const startLoop = () => {
          if (!animId) animId = requestAnimationFrame(tick);
     };

     function flyIn() {
          if (flyDir === 1 && flyProgress > 0.99) return;
          flyDir = 1;
          flyStartT = null;
          startLoop();
     }
     function flyOut() {
          if (flyDir === -1 && flyProgress < 0.01) return;
          flyDir = -1;
          flyStartT = null;
          startLoop();
     }

     /* ── Scroll trigger ──────────────────────────────
        inZone = heading.top ≤ vh/2  AND  prosCons.top > vh/2

        Both boundaries are single crossing-points that reverse
        cleanly on scroll-up — no latch or state ambiguity needed.
     ─────────────────────────────────────────────────── */
     const heading = about.querySelector(".about-heading") || about;
     let cupidsVisible = false;

     function checkCupidTrigger() {
          const vh = window.innerHeight;
          const headingTop = heading.getBoundingClientRect().top;
          const prosTop = prosCons.getBoundingClientRect().top;
          const inZone = headingTop <= vh / 2 && prosTop > vh / 2;

          if (inZone && !cupidsVisible) {
               cupidsVisible = true;
               flyIn();
          }
          if (!inZone && cupidsVisible) {
               cupidsVisible = false;
               flyOut();
          }
     }

     window.addEventListener("scroll", checkCupidTrigger, { passive: true });
     checkCupidTrigger();
})();

/* ═══════════════════════════════════════════════════════
       REPEATING CUPID HEARTS - BUG FIX VERSION
    ═══════════════════════════════════════════════════════ */
(function () {
     const aboutSection = document.querySelector("#about");
     const cupids = document.querySelectorAll(".cupid");
     const HEART_SRC = "images/heart.png";
     let heartInterval = null;

     function launchHearts() {
          // Don't launch if cupids haven't flown in yet
          const anyCupidVisible = Array.from(cupids).some((c) => parseFloat(c.style.opacity || 0) >= 0.5);
          if (!anyCupidVisible) return;

          cupids.forEach((cupid, index) => {
               const rect = cupid.getBoundingClientRect();

               // Skip if the cupid has no size or is still off-screen
               if (rect.width === 0 || rect.right < 0 || rect.left > window.innerWidth) {
                    return;
               }

               for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                         const heart = document.createElement("div");

                         // Assign Random Color
                         const colors = ["red", "blue", "pink"];
                         const randomColor = colors[Math.floor(Math.random() * colors.length)];
                         heart.className = `heart ${randomColor}`;

                         const img = document.createElement("img");
                         img.src = HEART_SRC;
                         heart.appendChild(img);

                         // Calculation for absolute positioning on the page
                         const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                         const scrollY = window.pageYOffset || document.documentElement.scrollTop;

                         // Spawn 60px below cupid center
                         const startX = rect.left + rect.width / 2 + scrollX;
                         const startY = rect.top + rect.height / 2 + scrollY + 60;

                         Object.assign(heart.style, {
                              position: "absolute",
                              left: `${startX}px`,
                              top: `${startY}px`,
                              width: "30px",
                              height: "30px",
                              pointerEvents: "none",
                              zIndex: "9999", // Extreme z-index to ensure visibility
                         });

                         document.body.appendChild(heart);

                         // Float Upward Animation
                         heart.animate(
                              [
                                   { transform: "translate(-50%, 0) scale(0.5)", opacity: 1 },
                                   { transform: `translate(${(Math.random() - 0.5) * 100}px, -250px) scale(1.3)`, opacity: 0 },
                              ],
                              {
                                   duration: 2500 + Math.random() * 1000,
                                   easing: "ease-out",
                                   fill: "forwards",
                              },
                         ).onfinish = () => heart.remove();
                    }, i * 300);
               }
          });
     }

     if (aboutSection && cupids.length > 0) {
          let pollId = null;

          function cupidsReady() {
               return Array.from(cupids).some((c) => parseFloat(c.style.opacity || 0) >= 0.5);
          }

          function startHearts() {
               if (heartInterval || pollId) return;
               // Poll every 100ms until cupids are on-screen, then fire immediately
               pollId = setInterval(() => {
                    if (cupidsReady()) {
                         clearInterval(pollId);
                         pollId = null;
                         launchHearts();
                         heartInterval = setInterval(launchHearts, 5000);
                    }
               }, 100);
          }

          function stopHearts() {
               clearInterval(pollId);
               pollId = null;
               clearInterval(heartInterval);
               heartInterval = null;
          }

          const observer = new IntersectionObserver(
               (entries) => {
                    entries.forEach((entry) => {
                         if (entry.isIntersecting) {
                              startHearts();
                         } else {
                              stopHearts();
                         }
                    });
               },
               { threshold: 0.1 },
          );

          observer.observe(aboutSection);
     }
})();

/* ═══════════════════════════════════════════════════════
   MOODBOARD
═══════════════════════════════════════════════════════ */
(function () {
     /* ── Clothespin SVG ── */
     function makePinSVG() {
          return (
               '<svg viewBox="0 0 30 36" width="30" height="36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
               /* outer spring ring */
               '<ellipse cx="15" cy="9" rx="7" ry="5.8" fill="none" stroke="#8a8a8a" stroke-width="2.4"/>' +
               /* inner hub */
               '<ellipse cx="15" cy="9" rx="4" ry="3.2" fill="#686868"/>' +
               /* wire hole */
               '<ellipse cx="15" cy="3.5" rx="3.2" ry="3" fill="#505050"/>' +
               /* left arm */
               '<path d="M8,12 Q7,17 5.5,29 Q5,33.5 8,34.5 Q11,34.5 12.5,29 L14,12Z"' +
               ' fill="#C9A040" stroke="#9a7820" stroke-width="0.6" stroke-linejoin="round"/>' +
               /* right arm */
               '<path d="M22,12 Q23,17 24.5,29 Q25,33.5 22,34.5 Q19,34.5 17.5,29 L16,12Z"' +
               ' fill="#B08828" stroke="#886010" stroke-width="0.6" stroke-linejoin="round"/>' +
               /* grain lines left */
               '<line x1="9" y1="16" x2="13.5" y2="16" stroke="rgba(100,60,0,.18)" stroke-width="0.8"/>' +
               '<line x1="8.5" y1="21" x2="13" y2="21" stroke="rgba(100,60,0,.18)" stroke-width="0.8"/>' +
               '<line x1="8" y1="26" x2="13" y2="26" stroke="rgba(100,60,0,.18)" stroke-width="0.8"/>' +
               /* grain lines right */
               '<line x1="16.5" y1="16" x2="21" y2="16" stroke="rgba(80,40,0,.16)" stroke-width="0.8"/>' +
               '<line x1="16.5" y1="21" x2="21.5" y2="21" stroke="rgba(80,40,0,.16)" stroke-width="0.8"/>' +
               '<line x1="16.5" y1="26" x2="22" y2="26" stroke="rgba(80,40,0,.16)" stroke-width="0.8"/>' +
               /* center gap */
               '<line x1="15" y1="12" x2="15" y2="34.5" stroke="rgba(0,0,0,.20)" stroke-width="1.6"/>' +
               "</svg>"
          );
     }

     /* ── Inject clothespins ── */
     function injectPins() {
          document.querySelectorAll("#moodboard .mb-pin").forEach(function (el) {
               el.innerHTML = makePinSVG();
          });
     }

     /* ── Build wire SVG that threads through each pin's center ──
     We collect the real DOM y-position of every pin after layout,
     then draw the bezier path through those exact points.
  ── */
     function buildWire() {
          var wrap = document.getElementById("mb-wire-wrap");
          var body = document.getElementById("mb-body");
          if (!wrap || !body) return;

          var W = body.offsetWidth;
          var H = body.offsetHeight;
          var cx = W / 2;

          /* Gather each pin's center coords relative to mb-body */
          var pins = Array.prototype.slice.call(body.querySelectorAll(".mb-pin"));

          var pts = pins.map(function (pin) {
               var node = pin.parentElement;
               return {
                    x: cx /* all centered on wire */,
                    y: node.offsetTop + pin.offsetHeight / 2 /* vertical center of pin */,
               };
          });

          /* S-curve aesthetic: control-point horizontal deviation alternates sides */
          var dev = Math.min(W * 0.06, 26);
          var NS = "http://www.w3.org/2000/svg";

          /* ── Wire path: M from above first pin, C through each pin ── */
          var d = ["M", cx, 0];
          var dir = 1;

          for (var i = 0; i < pts.length; i++) {
               var prevY = i === 0 ? 0 : pts[i - 1].y;
               var curr = pts[i];
               var span = curr.y - prevY;

               d.push(
                    "C",
                    cx + dev * dir,
                    prevY + span * 0.3 /* CP1 deviates */,
                    cx + dev * dir,
                    curr.y - span * 0.3 /* CP2 deviates same side */,
                    curr.x,
                    curr.y /* anchor = exact pin center */,
               );
               dir *= -1; /* alternate for S-curve */
          }

          /* Continue to bottom of section */
          var lastY = pts[pts.length - 1].y;
          var span2 = H - lastY;
          d.push("C", cx + dev * dir, lastY + span2 * 0.3, cx, H - 4, cx, H);

          var wirePath = d.join(" ");

          /* ── Top hook ── */
          var hookTop = ["M", cx, 0, "C", cx, -12, cx + 13, -18, cx + 18, -10, "C", cx + 23, -2, cx + 15, 10, cx + 6, 12].join(" ");

          /* ── Bottom hook (mirrors top, flipped) ── */
          var hookBot = ["M", cx, H, "C", cx, H + 12, cx - 13, H + 18, cx - 18, H + 10, "C", cx - 23, H + 2, cx - 15, H - 10, cx - 6, H - 12].join(
               " ",
          );

          /* ── Build SVG ── */
          var svg = document.createElementNS(NS, "svg");
          svg.setAttribute("viewBox", "0 -22 " + W + " " + (H + 44));
          svg.style.cssText = "position:absolute;top:-22px;left:0;width:100%;height:" + (H + 44) + "px;" + "overflow:visible;pointer-events:none;";

          function mkPath(d, stroke, sw) {
               var p = document.createElementNS(NS, "path");
               p.setAttribute("d", d);
               p.setAttribute("fill", "none");
               p.setAttribute("stroke", stroke);
               p.setAttribute("stroke-width", sw);
               p.setAttribute("stroke-linecap", "round");
               return p;
          }

          svg.appendChild(mkPath(wirePath, "rgba(195,180,148,.48)", "1.6"));
          svg.appendChild(mkPath(hookTop, "rgba(190,165,110,.72)", "2.2"));
          svg.appendChild(mkPath(hookBot, "rgba(190,165,110,.72)", "2.2"));

          wrap.innerHTML = "";
          wrap.appendChild(svg);
          wrap.style.height = H + 44 + "px";
     }

     /* ── Intersection Observer: swing each polaroid in ── */
     function initObserver() {
          var nodes = Array.prototype.slice.call(document.querySelectorAll("#moodboard .mb-node"));
          if (!nodes.length) return;

          var obs = new IntersectionObserver(
               function (entries) {
                    entries.forEach(function (entry) {
                         if (!entry.isIntersecting) return;
                         var node = entry.target;
                         var idx = nodes.indexOf(node);
                         var delay = idx * 0.04;

                         var hang = node.querySelector(".mb-hang");
                         var annot = node.querySelector(".mb-annot");
                         if (hang) hang.style.transitionDelay = delay + "s, " + delay + "s";
                         if (annot) annot.style.transitionDelay = delay + 0.5 + "s";

                         node.classList.add("mb-in");
                         obs.unobserve(node);
                    });
               },
               { threshold: 0.15 },
          );

          nodes.forEach(function (n) {
               obs.observe(n);
          });
     }

     /* ── Init ── */
     function init() {
          injectPins();

          /* Wire needs layout to be complete — use rAF + small delay */
          requestAnimationFrame(function () {
               setTimeout(function () {
                    buildWire();
                    initObserver();
               }, 60);
          });

          /* Rebuild on resize */
          var resizeTimer;
          window.addEventListener("resize", function () {
               clearTimeout(resizeTimer);
               resizeTimer = setTimeout(buildWire, 120);
          });
     }

     if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", init);
     } else {
          init();
     }
})();

/* ═══════════════════════════════════════════════════════
   PAPER AIRPLANES — canvas animation
═══════════════════════════════════════════════════════ */
(function initPlanes() {
     var section = document.getElementById("moodboard");
     var canvas = document.getElementById("mb-planes-canvas");
     if (!section || !canvas) return;

     var ctx = canvas.getContext("2d");

     var COLORS = ["#c9a96a", "#8ab4dc", "#ede8da", "#c38a8c"];
     var PLANE_COUNT = 5;
     var TRAIL_MAX = 280; // cap trail length to avoid memory bloat

     var canvasW = 0,
          canvasH = 0;
     var planes = [];
     var animId = null;

     /* ── Preload PNG + cache its aspect ratio ── */
     var planeImg = new Image();
     var imgAspect = 0.58; // fallback until image loads (approx for this PNG)
     planeImg.onload = function () {
          imgAspect = planeImg.naturalHeight / planeImg.naturalWidth;
     };
     planeImg.src = "images/paper-airplane.png";

     /* ── Responsive base size ──
       Mobile  : 1.5× original (original was ~31px avg)  → range 33–60
       Desktop : 2× mobile                               → range 66–120  */
     function planeSize() {
          var isDesktop = window.innerWidth >= 768;
          if (isDesktop) return 66 + Math.random() * 54;
          return 33 + Math.random() * 27;
     }

     function resize() {
          canvasW = section.offsetWidth;
          canvasH = section.offsetHeight;
          canvas.width = canvasW;
          canvas.height = canvasH;
     }

     function makePlane() {
          var right = Math.random() < 0.5;
          var baseAngle = right ? 0 : Math.PI;
          return {
               x: right ? -50 : canvasW + 50,
               y: canvasH * (0.08 + Math.random() * 0.84),
               angle: baseAngle, // current travel direction (radians)
               baseAngle: baseAngle, // home direction for wave oscillation
               right: right,
               speed: 0.67 + Math.random() * 0.6,
               color: COLORS[Math.floor(Math.random() * COLORS.length)],
               size: planeSize(),
               // Gentle sine-wave oscillation of heading
               waveAmp: 0.18 + Math.random() * 0.14, // radians of heading swing
               waveFreq: 0.007 + Math.random() * 0.007,
               wavePhase: Math.random() * Math.PI * 2,
               waveT: 0,
               // Loop state
               loopCountdown: 180 + Math.floor(Math.random() * 380),
               looping: false,
               loopProgress: 0,
               loopAngularSpeed: 0.026 + Math.random() * 0.018,
               loopDir: 1,
               trail: [],
          };
     }

     /* ── Step a plane's physics one tick ── */
     function stepPlane(p) {
          if (p.looping) {
               p.angle += p.loopDir * p.loopAngularSpeed;
               p.loopProgress += p.loopAngularSpeed;
               if (p.loopProgress >= Math.PI * 2) {
                    p.looping = false;
                    p.loopProgress = 0;
                    p.angle = p.baseAngle; // snap back to cruising heading
                    p.loopCountdown = 200 + Math.floor(Math.random() * 360);
               }
          } else {
               p.waveT++;
               p.angle = p.baseAngle + Math.sin(p.waveT * p.waveFreq + p.wavePhase) * p.waveAmp;
               if (--p.loopCountdown <= 0) {
                    p.looping = true;
                    p.loopProgress = 0;
                    p.loopDir = Math.random() < 0.5 ? 1 : -1;
               }
          }
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed;

          // ── Trail attachment: map the circled bottom-rear corner of the PNG
          // to world space using the exact canvas transform applied in drawPlane.
          //
          // The corner sits at roughly (-0.27w, +0.34h) in image-local space
          // (left of centre = behind nose, below centre = bottom of body).
          //
          // Right-going transform: translate → rotate(a)
          //   wx = px + lx·cos(a) − ly·sin(a)
          //   wy = py + lx·sin(a) + ly·cos(a)
          //
          // Left-going transform: translate → scale(−1,1) → rotate(π+a)
          //   wx = px + lx·cos(a) − ly·sin(a)   (same x)
          //   wy = py − lx·sin(a) − ly·cos(a)   (y signs flipped)
          var lx = -0.27 * p.size;
          var ly = 0.34 * p.size * imgAspect;
          var ca = Math.cos(p.angle),
               sa = Math.sin(p.angle);
          var tailX = p.x + lx * ca - ly * sa;
          var tailY = p.right ? p.y + lx * sa + ly * ca : p.y - lx * sa - ly * ca;

          p.trail.push({ x: tailX, y: tailY });
          if (p.trail.length > TRAIL_MAX) p.trail.shift();
     }

     /* ── Draw the dashed flight-path trail ── */
     function drawTrail(p) {
          var t = p.trail;
          if (t.length < 2) return;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(t[0].x, t[0].y);
          for (var i = 1; i < t.length; i++) ctx.lineTo(t[i].x, t[i].y);
          ctx.setLineDash([5, 8]);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.36;
          ctx.lineWidth = 1.3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
     }

     /* ── Draw the PNG airplane rotated to face its travel direction ── */
     function drawPlane(p) {
          if (!planeImg.complete || !planeImg.naturalWidth) return;

          var s = p.size;
          var aspect = planeImg.naturalHeight / planeImg.naturalWidth;
          var w = s,
               h = s * aspect;

          ctx.save();
          ctx.globalAlpha = 0.88;
          ctx.translate(p.x, p.y);

          // The PNG faces RIGHT.
          // For right-going planes: rotate by current angle (≈0 at cruise).
          // For left-going planes:  mirror with scale(-1,1) then rotate(π + angle)
          //   — this maps the nose correctly regardless of loop phase.
          if (p.right) {
               ctx.rotate(p.angle);
          } else {
               ctx.scale(-1, 1);
               ctx.rotate(Math.PI + p.angle);
          }

          ctx.drawImage(planeImg, -w * 0.5, -h * 0.5, w, h);
          ctx.restore();
     }

     function loop() {
          ctx.clearRect(0, 0, canvasW, canvasH);

          for (var i = planes.length - 1; i >= 0; i--) {
               var p = planes[i];
               stepPlane(p);

               // Remove if well off-canvas in any direction
               if (p.x < -220 || p.x > canvasW + 220 || p.y < -220 || p.y > canvasH + 220) {
                    planes.splice(i, 1);
                    planes.push(makePlane());
                    continue;
               }

               drawTrail(p);
               drawPlane(p);
          }

          animId = requestAnimationFrame(loop);
     }

     var visObs = new IntersectionObserver(
          function (entries) {
               if (entries[0].isIntersecting) {
                    if (!animId) animId = requestAnimationFrame(loop);
               } else {
                    if (animId) {
                         cancelAnimationFrame(animId);
                         animId = null;
                    }
               }
          },
          { threshold: 0.01 },
     );

     function init() {
          resize();
          // Stagger planes across the canvas so they don't all enter at once
          for (var i = 0; i < PLANE_COUNT; i++) {
               var p = makePlane();
               var steps = Math.floor((i / PLANE_COUNT) * (canvasW / p.speed));
               for (var s = 0; s < steps; s++) stepPlane(p);
               planes.push(p);
          }
          visObs.observe(section);
     }

     var rsTimer;
     window.addEventListener("resize", function () {
          clearTimeout(rsTimer);
          rsTimer = setTimeout(function () {
               resize();
               planes = [];
               init();
          }, 120);
     });

     if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", init);
     } else {
          init();
     }
})();

/* ═══════════════════════════════════════════════════════
   MOODBOARD DOODLES — scattered hearts, stars, arrows
═══════════════════════════════════════════════════════ */
(function initDoodles() {
     var section = document.getElementById("moodboard");
     var canvas = document.getElementById("mb-doodles-canvas"); // behind polaroids
     var canvasFront = document.getElementById("mb-doodles-front-canvas"); // above polaroids
     if (!section || !canvas || !canvasFront) return;

     var ctx = canvas.getContext("2d");
     var ctxFront = canvasFront.getContext("2d");
     var W = 0,
          H = 0;
     var animId = null;
     var doodles = [];

     var COLORS = ["#c9a96a", "#d4b87a", "#8ab4dc", "#a0c4e8", "#c38a8c", "#d4a0a2", "#ede8da", "#a8c4a2", "#b8a0d4", "#f0c4a0"];
     var COUNT = 45;

     function resize() {
          W = canvas.width = canvasFront.width = section.offsetWidth;
          H = canvas.height = canvasFront.height = section.offsetHeight;
     }

     /* ── Helper: generate N random offsets in range [-maxW, +maxW] ── */
     function rndOffsets(n, maxW) {
          var out = [];
          for (var i = 0; i < n; i++) out.push((Math.random() - 0.5) * maxW * 2);
          return out;
     }

     /* ── Heart — uses 5 pre-baked offsets ── */
     function drawHeart(ctx, s, o) {
          ctx.beginPath();
          ctx.moveTo(0, s * 0.3);
          ctx.bezierCurveTo(-s * 0.1 + o[0], -s * 0.4, -s * 1.0 + o[1], -s * 0.4, 0, -s * 0.9 + o[2]);
          ctx.bezierCurveTo(s * 1.0 + o[3], -s * 0.4, s * 0.1 + o[4], -s * 0.4, 0, s * 0.3);
          ctx.stroke();
     }

     /* ── 4-point star — 16 pre-baked offsets (4 points × 4 coords) ── */
     function drawStar(ctx, s, o) {
          ctx.beginPath();
          for (var i = 0; i < 4; i++) {
               var a1 = (i / 4) * Math.PI * 2 - Math.PI / 2;
               var a2 = a1 + Math.PI / 4;
               var ox = Math.cos(a1) * s + o[i * 4];
               var oy = Math.sin(a1) * s + o[i * 4 + 1];
               var ix = Math.cos(a2) * s * 0.22 + o[i * 4 + 2];
               var iy = Math.sin(a2) * s * 0.22 + o[i * 4 + 3];
               if (i === 0) ctx.moveTo(ox, oy);
               else ctx.lineTo(ox, oy);
               ctx.lineTo(ix, iy);
          }
          ctx.closePath();
          ctx.stroke();
     }

     /* ── Arrow — 8 pre-baked offsets ── */
     function drawArrow(ctx, s, o) {
          ctx.beginPath();
          ctx.moveTo(-s + o[0], o[1]);
          ctx.lineTo(s + o[2], o[3]);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(s * 0.55 + o[4], -s * 0.45 + o[5]);
          ctx.lineTo(s + o[6], o[7]);
          ctx.lineTo(s * 0.55 + o[4], s * 0.45 + o[5]);
          ctx.stroke();
     }

     /* ── Sparkle — no wobble, always stable ── */
     function drawSparkle(ctx, s) {
          [
               [0, 0],
               [s * 1.1, -s * 0.5],
               [s * 0.4, s * 1.1],
               [-s * 1.0, s * 0.3],
               [-s * 0.6, -s * 0.9],
          ].forEach(function (p, i) {
               ctx.beginPath();
               ctx.arc(p[0], p[1], s * (i === 0 ? 0.38 : 0.2), 0, Math.PI * 2);
               ctx.stroke();
          });
     }

     /* ── Smiley — just :) eyes and smile, no head circle ── */
     function drawSmiley(ctx, s, o) {
          // Left eye dot
          ctx.beginPath();
          ctx.arc(-s * 0.32 + o[0], -s * 0.2 + o[1], s * 0.1, 0, Math.PI * 2);
          ctx.fill();
          // Right eye dot
          ctx.beginPath();
          ctx.arc(s * 0.32 + o[2], -s * 0.2 + o[3], s * 0.1, 0, Math.PI * 2);
          ctx.fill();
          // Smile arc
          ctx.beginPath();
          ctx.arc(o[4], s * 0.1 + o[5], s * 0.38, 0.2, Math.PI - 0.2);
          ctx.stroke();
     }

     /* ── Flower — 12 pre-baked offsets (2 per petal + 2 for center) ── */
     function drawFlower(ctx, s, o) {
          for (var i = 0; i < 5; i++) {
               var a = (i / 5) * Math.PI * 2;
               ctx.beginPath();
               ctx.ellipse(Math.cos(a) * s * 0.55 + o[i * 2], Math.sin(a) * s * 0.55 + o[i * 2 + 1], s * 0.35, s * 0.22, a, 0, Math.PI * 2);
               ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(o[10], o[11], s * 0.22, 0, Math.PI * 2);
          ctx.stroke();
     }

     /* ── Squiggle — 14 pre-baked offsets (7 points × 2) ── */
     function drawSquiggle(ctx, s, o) {
          ctx.beginPath();
          ctx.moveTo(-s * 1.2, o[0]);
          for (var i = 0; i <= 6; i++) {
               var x = -s * 1.2 + (i / 6) * s * 2.4 + o[i * 2];
               var y = (i % 2 === 0 ? -1 : 1) * s * 0.5 + o[i * 2 + 1];
               ctx.lineTo(x, y);
          }
          ctx.stroke();
     }

     /* ── Square — no offsets, clean rotated square ── */
     function drawSquare(ctx, s) {
          ctx.beginPath();
          ctx.rect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
          ctx.stroke();
     }

     var TEXTS = ["sherwin's the best", "cutie", "baddie", "kiss", "hug", "love", "date", "loki", "slay", "skrrt"];
     var TYPES = ["heart", "heart", "star", "star", "sparkle", "smiley", "smiley", "flower", "squiggle", "square", "text", "text", "text"];

     /* How many offsets each type needs */
     var OFFSET_COUNTS = { heart: 5, star: 16, arrow: 8, sparkle: 0, smiley: 6, flower: 12, squiggle: 14, square: 0, text: 0 };

     function makeDoodle() {
          var type = TYPES[Math.floor(Math.random() * TYPES.length)];
          var maxW = 1.2 + Math.random() * 1.4;
          return {
               x: Math.random() * W,
               y: Math.random() * H,
               type: type,
               phrase: type === "text" ? TEXTS[Math.floor(Math.random() * TEXTS.length)] : null,
               size: 10 + Math.random() * 14,
               angle: (Math.random() - 0.5) * Math.PI * 2,
               color: COLORS[Math.floor(Math.random() * COLORS.length)],
               alpha: 0.28 + Math.random() * 0.24,
               vx: (Math.random() - 0.5) * 0.12,
               vy: (Math.random() - 0.5) * 0.1,
               breathT: Math.random() * Math.PI * 2,
               breathSpd: 0.004 + Math.random() * 0.004,
               offsets: rndOffsets(OFFSET_COUNTS[type] || 0, maxW),
          };
     }

     function drawDoodle(d) {
          d.breathT += d.breathSpd;
          var alpha = d.alpha * (0.65 + 0.35 * Math.sin(d.breathT));
          // "sherwin is the best" draws on front canvas (above polaroids), everything else behind
          var c = d.phrase === "sherwin is the best" ? ctxFront : ctx;

          c.save();
          c.translate(d.x, d.y);
          c.rotate(d.angle);
          c.strokeStyle = d.color;
          c.globalAlpha = alpha;
          c.lineWidth = 1.4;
          c.lineCap = "round";
          c.lineJoin = "round";

          var s = d.size,
               o = d.offsets;
          c.fillStyle = d.color;
          if (d.type === "heart") drawHeart(c, s, o);
          else if (d.type === "star") drawStar(c, s, o);
          else if (d.type === "arrow") drawArrow(c, s, o);
          else if (d.type === "sparkle") drawSparkle(c, s * 0.55);
          else if (d.type === "smiley") drawSmiley(c, s, o);
          else if (d.type === "flower") drawFlower(c, s, o);
          else if (d.type === "squiggle") drawSquiggle(c, s, o);
          else if (d.type === "square") drawSquare(c, s);
          else {
               var fs = Math.round(s * 1.4);
               c.font = "bold " + fs + "px 'Caveat', cursive";
               c.textAlign = "left";
               c.textBaseline = "middle";
               c.fillText(d.phrase, 0, 0);
          }

          c.restore();

          d.x += d.vx;
          d.y += d.vy;
          if (d.x < -30) d.x = W + 30;
          if (d.x > W + 30) d.x = -30;
          if (d.y < -30) d.y = H + 30;
          if (d.y > H + 30) d.y = -30;
     }

     function loop() {
          ctx.clearRect(0, 0, W, H);
          ctxFront.clearRect(0, 0, W, H);
          doodles.forEach(drawDoodle);
          animId = requestAnimationFrame(loop);
     }

     var visObs = new IntersectionObserver(
          function (entries) {
               if (entries[0].isIntersecting) {
                    if (!animId) animId = requestAnimationFrame(loop);
               } else {
                    if (animId) {
                         cancelAnimationFrame(animId);
                         animId = null;
                    }
               }
          },
          { threshold: 0.01 },
     );

     function init() {
          resize();
          doodles = [];
          for (var i = 0; i < COUNT; i++) doodles.push(makeDoodle());
          visObs.observe(section);
     }

     var rsTimer;
     window.addEventListener("resize", function () {
          clearTimeout(rsTimer);
          rsTimer = setTimeout(function () {
               resize();
          }, 120);
     });

     // Start immediately — don't rely solely on IntersectionObserver
     if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", init);
     } else {
          init();
     }
     // Also kick off the loop directly in case observer fires late
     window.addEventListener("load", function () {
          if (!animId) animId = requestAnimationFrame(loop);
     });
})();
