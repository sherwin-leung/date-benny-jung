/* ═══════════════════════════════════════════════════════
       CARD DATA
       Add/remove cards here. rotation = tilt in degrees.
    ═══════════════════════════════════════════════════════ */
const CARDS = [
     {
          quote: "i like him enough to spend literally hours making ts for him. 🙄<br><br>this guy is one of my best friends and i would trust him with <em>almost</em> anything. he's the type to leave me on delivered, force me to double text him, only for him to then leave me on read. but he's also the guy who'd drop everything to come to us during a time of need. he's the guy who makes sure we're safe, taken care of, and comfortable. he's a teddy bear tryna be nonchalant but his heart is too big to let him be. he <strong>will</strong> take care of you; just as he has done for us. he loves - sometimes silently, but always hard. 😉",
          attr: "— Sherwin (friend of 20 years)",
          rotation: 0.9,
     },
     {
          quote: "",
          attr: "— Brandon",
          rotation: -1.5,
     },
     {
          quote: "",
          attr: "— Lynn",
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

/* OLD SCROLL CTA */
// document.getElementById('scroll-cta').addEventListener('click', () => {
//   const hero = document.getElementById('hero');
//         const heroHeight = hero.offsetHeight;
//   window.scrollTo({
//     top: heroHeight + 55,
//     behavior: 'smooth'
//   });
// });

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
     const TEXT = "(please) 🥺"; // ← edit freely
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
       STATS BAR — hide swipe hint on first touch/scroll
    ═══════════════════════════════════════════════════════ */
// (function () {
//   const strip = document.getElementById('stats-scroll');
//   const hint = document.getElementById('stats-drag-hint');
//   if (!strip || !hint) return;
//   function hideHint() {
//     hint.classList.add('hidden');
//     strip.removeEventListener('scroll', hideHint);
//     strip.removeEventListener('touchstart', hideHint);
//   }
//   strip.addEventListener('scroll', hideHint, { passive: true });
//   strip.addEventListener('touchstart', hideHint, { passive: true });
// })();

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
       REPEATING CUPID PNG HEARTS
    ═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
       REPEATING CUPID HEARTS - BUG FIX VERSION
    ═══════════════════════════════════════════════════════ */
(function () {
     const aboutSection = document.querySelector("#about");
     const cupids = document.querySelectorAll(".cupid");
     const HEART_SRC = "images/heart.png";
     let heartInterval = null;

     function launchHearts() {
          console.log("Attempting to launch hearts..."); // Debug log

          cupids.forEach((cupid, index) => {
               const rect = cupid.getBoundingClientRect();

               // Only skip if the cupid literally doesn't exist/has no size
               if (rect.width === 0) {
                    console.warn(`Cupid ${index} has no width. Skipping.`);
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
          const observer = new IntersectionObserver(
               (entries) => {
                    entries.forEach((entry) => {
                         if (entry.isIntersecting) {
                              console.log("About section in view. Starting hearts.");
                              if (!heartInterval) {
                                   launchHearts();
                                   heartInterval = setInterval(launchHearts, 5000);
                              }
                         } else {
                              console.log("About section out of view. Stopping hearts.");
                              clearInterval(heartInterval);
                              heartInterval = null;
                         }
                    });
               },
               { threshold: 0.1 },
          );

          observer.observe(aboutSection);
     } else {
          console.error("Could not find #about section or .cupid elements in HTML.");
     }
})();
