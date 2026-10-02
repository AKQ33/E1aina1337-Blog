/* ============================================================
   E1aina1337 · Liquid Glass Blog — Interactions
   Vanilla JS, no dependencies
   ============================================================ */
(() => {
  'use strict';

  // ==================== Utilities ====================
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==================== Easing ====================
  const ease = {
    outQuint: t => 1 - Math.pow(1 - t, 5),
    outCubic: t => 1 - Math.pow(1 - t, 3),
    outBack:  t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };

  // Throttle helper (trailing)
  const throttle = (fn, wait) => {
    let last = 0, timer = null;
    return function (...args) {
      const now = performance.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => { last = performance.now(); timer = null; fn.apply(this, args); }, remaining);
      }
    };
  };

  // ============================================================
  //  1. STARFIELD — twinkling stars on canvas
  // ============================================================
  const Starfield = {
    canvas: null, ctx: null, stars: [], w: 0, h: 0, dpr: 1,

    init() {
      this.canvas = $('#starfield');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });
      if (!prefersReduced) this.animate();
    },

    resize() {
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width  = this.w * this.dpr;
      this.canvas.height = this.h * this.dpr;
      this.canvas.style.width  = this.w + 'px';
      this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.createStars();
      if (prefersReduced) this.drawStatic();
    },

    createStars() {
      const count = Math.min(Math.floor((this.w * this.h) / 2500), 220);
      this.stars = [];
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.w,
          y: Math.random() * this.h,
          r: Math.random() * 1.4 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.15,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.88
            ? `hsla(${Math.floor(Math.random() * 60) + 200}, 70%, 72%, 1)`  // cyan-ish
            : Math.random() > 0.7
              ? `hsla(${Math.floor(Math.random() * 40) + 260}, 65%, 72%, 1)`  // violet-ish
              : '#ffffff',
          depth: Math.random() * 0.4 + 0.4,
        });
      }
    },

    drawStatic() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      for (const s of this.stars) {
        ctx.globalAlpha = s.baseAlpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    animate() {
      const ctx = this.ctx;
      const t = performance.now() * 0.001;
      const scrollY = window.scrollY;
      ctx.clearRect(0, 0, this.w, this.h);

      // Draw stars
      for (const s of this.stars) {
        const tw = Math.sin(t * s.twinkleSpeed * 100 + s.twinklePhase);
        const alpha = s.baseAlpha * (0.55 + 0.45 * tw);
        let y = (s.y + scrollY * s.depth * 0.12) % this.h;
        if (y < 0) y += this.h;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();

        // Soft glow for brighter stars
        if (s.r > 1.1) {
          ctx.beginPath();
          ctx.arc(s.x, y, s.r * 4, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(s.x, y, 0, s.x, y, s.r * 4);
          g.addColorStop(0, s.color);
          g.addColorStop(1, 'transparent');
          ctx.globalAlpha = alpha * 0.25;
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      requestAnimationFrame(() => this.animate());
    }
  };

  // ============================================================
  //  3. TYPEWRITER — type → pause → delete → loop
  // ============================================================
  const Typewriter = {
    el: null,
    text: '一个苦逼的爱vibecoding和玩MC CODM的高二牲。',
    idx: 0,
    deleting: false,
    paused: false,

    config: { typeSpeed: 65, deleteSpeed: 28, pauseTime: 3500, startDelay: 1200 },

    init() {
      this.el = $('#typedText');
      if (!this.el) return;
      if (prefersReduced) { this.el.textContent = this.text; return; }
      setTimeout(() => this.tick(), this.config.startDelay);
    },

    tick() {
      if (this.paused) return;
      const cur = this.text.slice(0, this.idx);
      this.el.textContent = cur;

      if (!this.deleting) {
        this.idx++;
        if (this.idx > this.text.length) {
          this.deleting = true;
          setTimeout(() => this.tick(), this.config.pauseTime);
          return;
        }
        setTimeout(() => this.tick(), this.config.typeSpeed);
      } else {
        this.idx--;
        if (this.idx < 0) {
          this.idx = 0;
          this.deleting = false;
          setTimeout(() => this.tick(), 600);
          return;
        }
        setTimeout(() => this.tick(), this.config.deleteSpeed);
      }
    }
  };

  // ============================================================
  //  4. TITLE CHARACTER ANIMATION — 3D flip in
  // ============================================================
  const TitleAnim = {
    init() {
      // Hero title - dramatic 3D char flip
      this.splitChars($('#heroTitle'), 'E1aina1337', 0.06, 0.2);

      // Section titles - split white part into chars, keep grad-text as whole
      document.querySelectorAll('.section-title').forEach((el, idx) => {
        const hasGrad = el.querySelector('.grad-text');
        if (hasGrad) {
          const gradSpan = hasGrad.cloneNode(true);
          const prefixText = el.textContent.replace(hasGrad.textContent, '');
          el.innerHTML = '';
          // Split prefix into chars
          for (let i = 0; i < prefixText.length; i++) {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = prefixText[i];
            span.style.animationDelay = (i * 0.04 + idx * 0.05 + 0.1) + 's';
            el.appendChild(span);
          }
          // Keep grad-text as whole unit
          gradSpan.classList.add('char');
          gradSpan.style.animationDelay = (prefixText.length * 0.04 + idx * 0.05 + 0.1) + 's';
          el.appendChild(gradSpan);
        } else {
          this.splitChars(el, el.textContent, 0.03, 0.05);
        }
      });

      // Footer title - same approach
      const footerTitle = document.querySelector('.footer-title');
      if (footerTitle) {
        const hasGrad = footerTitle.querySelector('.grad-text');
        if (hasGrad) {
          const gradSpan = hasGrad.cloneNode(true);
          const prefixText = footerTitle.textContent.replace(hasGrad.textContent, '');
          footerTitle.innerHTML = '';
          for (let i = 0; i < prefixText.length; i++) {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = prefixText[i];
            span.style.animationDelay = (i * 0.05 + 0.1) + 's';
            footerTitle.appendChild(span);
          }
          gradSpan.classList.add('char');
          gradSpan.style.animationDelay = (prefixText.length * 0.05 + 0.1) + 's';
          footerTitle.appendChild(gradSpan);
        } else {
          this.splitChars(footerTitle, footerTitle.textContent, 0.04, 0.1);
        }
      }
    },

    splitChars(el, text, delay, base) {
      if (!el) return;
      el.innerHTML = '';
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = text[i];
        span.setAttribute('aria-hidden', 'true');
        span.style.animationDelay = (i * delay + base) + 's';
        el.appendChild(span);
      }
    }
  };

  // ============================================================
  //  5. SCROLL PROGRESS + NAV SCROLLED STATE
  // ============================================================
  const ScrollUI = {
    bar: null, nav: null,

    init() {
      this.bar = $('#scrollProgress');
      this.nav = $('#nav');
      if (!this.bar && !this.nav) return;

      const update = () => {
        const scrollY = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (scrollY / max) * 100 : 0;
        if (this.bar) this.bar.style.width = pct + '%';
        if (this.nav) this.nav.classList.toggle('scrolled', scrollY > 50);
      };

      window.addEventListener('scroll', update, { passive: true });
      update();
    }
  };

  // ============================================================
  //  6. REVEAL — multi-direction slide-in on scroll
  // ============================================================
  const Reveal = {
    init() {
      const els = $$('.reveal');
      if (!els.length) return;

      if (prefersReduced) {
        els.forEach(el => el.classList.add('in'));
        return;
      }

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          } else {
            entry.target.classList.remove('in');
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      els.forEach(el => io.observe(el));
    }
  };

  // ============================================================
  //  8. SMOOTH SCROLL — custom eased, cancels on manual scroll
  // ============================================================
  const SmoothScroll = {
    raf: null,
    animating: false,
    cancelled: false,

    init() {
      document.documentElement.style.scrollBehavior = 'auto';

      const clickHandler = e => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();

        // Cancel any ongoing animation
        this.cancel();

        let target = null;
        if (href !== '#hero') {
          target = $(href);
          if (!target) return;
        }
        this.to(target);
      };

      document.addEventListener('click', clickHandler);

      // Cancel animation on manual scroll (wheel / touch / key)
      const cancelHandler = () => { if (this.animating) this.cancel(); };
      window.addEventListener('wheel', cancelHandler, { passive: true });
      window.addEventListener('touchmove', cancelHandler, { passive: true });
      window.addEventListener('keydown', e => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space', 'Home', 'End'].includes(e.key)) {
          cancelHandler();
        }
      }, { passive: true });
    },

    cancel() {
      this.cancelled = true;
      this.animating = false;
      if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    },

    to(target) {
      this.cancel();
      this.animating = true;
      this.cancelled = false;

      const startY = window.scrollY;
      const endY = target ? target.getBoundingClientRect().top + window.scrollY - 70 : 0;
      const diff = endY - startY;
      if (Math.abs(diff) < 2) { this.animating = false; return; }

      const dur = clamp(Math.abs(diff) * 0.4, 400, 900);
      const start = performance.now();

      const step = now => {
        if (this.cancelled) return;
        const p = clamp((now - start) / dur, 0, 1);
        const eased = ease.outQuint(p);
        window.scrollTo(0, startY + diff * eased);
        if (p < 1) {
          this.raf = requestAnimationFrame(step);
        } else {
          this.animating = false;
          this.raf = null;
        }
      };
      this.raf = requestAnimationFrame(step);
    }
  };

  // ============================================================
  //  9. MAGNETIC BUTTONS — CSS-variable based
  // ============================================================
  const Magnetic = {
    init() {
      $$('[data-magnetic]').forEach(el => this.bind(el));
    },

    bind(el) {
      const strength = 0.28;
      let raf = null;

      el.addEventListener('mousemove', e => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          el.style.setProperty('--mx', (x * strength).toFixed(1) + 'px');
          el.style.setProperty('--my', (y * strength).toFixed(1) + 'px');
        });
      });

      el.addEventListener('mouseleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    }
  };

  // ============================================================
  //  10. 3D TILT — CSS-variable based, subtle
  // ============================================================
  const Tilt = {
    init() {
      const cards = $$('.tilt-target');
      cards.forEach(c => this.bind(c));

      // Auto-bind contact cards only (video/project use CardSpring)
      $$('.contact-item, .about-card, .tags-card').forEach(c => {
        if (!c._tiltBound) { this.bind(c); }
      });
    },

    bind(card) {
      if (card._tiltBound) return;
      card._tiltBound = true;

      const maxTilt = 5;
      let raf = null;

      card.addEventListener('mousemove', e => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty('--rx', (-y * maxTilt).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ( x * maxTilt).toFixed(2) + 'deg');
        });
      });

      card.addEventListener('mouseleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    }
  };

  // ============================================================
  //  10.5 CARD SPRING — physics-based hover animation
  // ============================================================
  const CardSpring = {
    init() {
      const cards = $$('.video-card, .project-card');
      cards.forEach(card => {
        if (card._springBound) return;
        card._springBound = true;

        const s = { x: 0, vx: 0, y: 0, vy: 0, tx: 0, ty: 0, on: false, raf: 0, _t: 0, k: 420, d: 15 };

        const step = t => {
          let dt = (t - (s._t || t)) / 1000;
          if (dt > 0.05) dt = 0.05;
          s._t = t;

          const ax = (s.tx - s.x) * s.k - s.vx * s.d;
          const ay = (s.ty - s.y) * s.k - s.vy * s.d;
          s.vx += ax * dt;
          s.vy += ay * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;

          card.style.transform = `translateY(${s.y.toFixed(3)}px) scale(${(1 + s.x).toFixed(4)})`;

          if (Math.abs(s.tx - s.x) < 0.0004 && Math.abs(s.ty - s.y) < 0.0004 &&
              Math.abs(s.vx) < 0.02 && Math.abs(s.vy) < 0.02) {
            s.x = s.tx;
            s.y = s.ty;
            s.on = false;
            card.style.transform = `translateY(${s.y.toFixed(3)}px) scale(${(1 + s.x).toFixed(4)})`;
          } else {
            s.raf = requestAnimationFrame(step);
          }
        };

        const to = (dx, dy, k, d) => {
          s.tx = dx;
          s.ty = dy;
          s.k = k;
          s.d = d;
          if (!s.on) {
            s.on = true;
            s._t = 0;
            s.raf = requestAnimationFrame(step);
          }
        };

        card.addEventListener('mouseenter', () => to(0.05, -12, 420, 15));
        card.addEventListener('mouseleave', () => to(0, 0, 300, 26));
      });
    }
  };

  // ============================================================
  //  11. ACTIVE NAV — highlight current section
  // ============================================================
  const ActiveNav = {
    init() {
      const sections = $$('section[id], footer[id]');
      if (!sections.length) return;

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          $$('.nav-links a').forEach(a => {
            const active = a.dataset.nav === id || a.getAttribute('href') === '#' + id;
            a.classList.toggle('active', active);
          });
        });
      }, { threshold: 0.25, rootMargin: '-15% 0px -55% 0px' });

      sections.forEach(s => io.observe(s));
    }
  };

  // ============================================================
  //  12. RIPPLE — click / touch feedback
  // ============================================================
  const Ripple = {
    init() {
      const targets = $$('.copy-btn, .btn, .social-pill, .video-card, .footer-top-btn, .nav-cta');
      targets.forEach(el => {
        el.addEventListener('pointerdown', e => {
          if (prefersReduced) return;
          this.create(e, el);
        });
      });
    },

    create(e, el) {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.cssText =
        `position:absolute;border-radius:50%;pointer-events:none;` +
        `background:radial-gradient(circle,rgba(255,255,255,0.22) 0%,rgba(255,255,255,0) 70%);` +
        `width:${size}px;height:${size}px;` +
        `left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;` +
        `transform:scale(0);opacity:0.7;` +
        `animation:rippleAnim 0.7s cubic-bezier(0.22,1,0.36,1) forwards;z-index:1;`;
      el.appendChild(r);
      setTimeout(() => r.remove(), 700);
    }
  };

  // ============================================================
  //  13. CUSTOM CURSOR — dot + trail
  // ============================================================
  const CustomCursor = {
    dot: null,
    canvas: null, ctx: null,
    mx: 0, my: 0,
    raf: null,
    isHover: false,
    trail: [],
    TRAIL_LIFE: 50,

    init() {
      if (prefersReduced) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;

      // Canvas for trail + dot (same coordinate system)
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'cursorTrail';
      this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99997;';
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });

      document.addEventListener('mousemove', e => {
        this.mx = e.clientX;
        this.my = e.clientY;
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        this.trail = [];
        this.renderTrail();
      }, { passive: true });

      const hoverTargets = document.querySelectorAll('a, button, .video-card, .social-pill');
      hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => {
          this.isHover = true;
        }, { passive: true });
        el.addEventListener('mouseleave', () => {
          this.isHover = false;
        }, { passive: true });
      });

      this.loop = () => {
        // Add trail point when moved enough
        const lastPt = this.trail.length > 0 ? this.trail[this.trail.length - 1] : null;
        const dx = lastPt ? this.mx - lastPt.x : 0;
        const dy = lastPt ? this.my - lastPt.y : 0;
        if (!lastPt || Math.sqrt(dx * dx + dy * dy) > 5) {
          this.trail.push({ x: this.mx, y: this.my, age: 0 });
          if (this.trail.length > 35) this.trail.shift();
        }

        this.renderTrail();
        this.raf = requestAnimationFrame(this.loop);
      };
      this.loop();
    },

    resize() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    },

    renderTrail() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (this.trail.length < 2) return;

      // Age and filter
      this.trail.forEach(p => p.age++);
      this.trail = this.trail.filter(p => p.age <= this.TRAIL_LIFE);

      if (this.trail.length < 2) return;

      // Draw trail as segments with per-point alpha
      ctx.save();
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;

      for (let i = 1; i < this.trail.length; i++) {
        const prev = this.trail[i - 1];
        const curr = this.trail[i];

        // Alpha based on current point's age
        const alpha = Math.max(0, 1 - curr.age / this.TRAIL_LIFE);
        if (alpha <= 0.05) continue;

        // Blue to white color based on x position
        const t = curr.x / window.innerWidth;
        const r = Math.round(80 + t * 175);
        const g = Math.round(140 + t * 115);
        const b = 255;

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }

      // Draw dot at current mouse position (same coordinate system as trail)
      const t = this.mx / window.innerWidth;
      let r, g, b;
      if (this.isHover) {
        // Green when hovering
        r = 52; g = 211; b = 153;
      } else {
        // Bright blue-white, more saturated
        r = Math.round(60 + t * 195);
        g = Math.round(120 + t * 135);
        b = 255;
      }
      const dotSize = this.isHover ? 8 : 6;

      // Glow
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
      ctx.shadowBlur = 15;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
      ctx.beginPath();
      ctx.arc(this.mx, this.my, dotSize, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight for more contrast
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.beginPath();
      ctx.arc(this.mx, this.my, dotSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };

  // ============================================================
  //  14. LOADER — loading overlay animation
  // ============================================================
  const Loader = {
    el: null,

    init() {
      this.el = document.getElementById('loader');
      if (!this.el) return;

      setTimeout(() => {
        this.el.classList.add('hidden');
        setTimeout(() => { this.el.style.display = 'none'; }, 600);
      }, 1500);
    }
  };

  // ============================================================
  //  15. LAZY IMAGES — blur placeholder on scroll
  // ============================================================
  const LazyImages = {
    init() {
      const imgs = document.querySelectorAll('img[loading="lazy"]');
      if (!imgs.length) return;

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.addEventListener('load', () => {
              img.classList.add('loaded');
            }, { once: true });
            io.unobserve(img);
          }
        });
      }, { threshold: 0.1 });

      imgs.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          img.classList.add('loaded');
        } else {
          io.observe(img);
        }
      });
    }
  };

  // ============================================================
  //  16. KEYBOARD SHORTCUTS — J/K/Home/End/?
  // ============================================================
  const KeyboardShortcuts = {
    init() {
      const handleKey = e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const kbdHelp = document.getElementById('kbdHelp');
        if (kbdHelp && kbdHelp.classList.contains('visible') && e.key !== 'Escape') return;

        switch (e.key) {
          case 'j': case 'J':
            e.preventDefault();
            window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
            break;
          case 'k': case 'K':
            e.preventDefault();
            window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
            break;
          case 'Home':
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
          case 'End':
            e.preventDefault();
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            break;
          case '?':
            e.preventDefault();
            if (kbdHelp) kbdHelp.classList.toggle('visible');
            break;
          case 'Escape':
            if (kbdHelp) kbdHelp.classList.remove('visible');
            break;
        }
      };

      window.addEventListener('keydown', handleKey, { passive: false });
    }
  };

  // ============================================================
  //  17. EASTER EGGS — logo click + Konami Code
  // ============================================================
  const EasterEggs = {
    logoClicks: 0,
    logoTimer: null,
    konamiSeq: [],
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    konamiTimer: null,

    init() {
      this.bindLogoClick();
      this.bindKonami();
    },

    bindLogoClick() {
      const logo = document.querySelector('.nav-logo');
      if (!logo) return;

      logo.addEventListener('click', () => {
        this.logoClicks++;
        
        if (this.logoTimer) clearTimeout(this.logoTimer);
        this.logoTimer = setTimeout(() => { this.logoClicks = 0; }, 2000);

        if (this.logoClicks === 3) {
          this.logoClicks = 0;
          this.celebrateLogo(logo);
        } else if (this.logoClicks >= 1) {
          logo.classList.add('shake');
          setTimeout(() => logo.classList.remove('shake'), 500);
        }
      });
    },

    celebrateLogo(logo) {
      logo.classList.add('celebrate');
      setTimeout(() => logo.classList.remove('celebrate'), 1500);

      const rect = logo.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      for (let i = 0; i < 8; i++) {
        const spark = document.createElement('div');
        spark.className = 'logo-sparkle';
        const angle = (i / 8) * Math.PI * 2;
        const dist = 40 + Math.random() * 30;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        
        spark.style.left = cx + 'px';
        spark.style.top = cy + 'px';
        spark.style.setProperty('--dx', dx + 'px');
        spark.style.setProperty('--dy', dy + 'px');
        spark.style.background = i % 2 === 0 ? 'var(--c-blue)' : 'var(--c-green)';
        spark.style.boxShadow = `0 0 8px ${i % 2 === 0 ? 'var(--c-blue)' : 'var(--c-green)'}`;
        
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 800);
      }
    },

    bindKonami() {
      window.addEventListener('keydown', e => {
        this.konamiSeq.push(e.key);
        
        if (this.konamiSeq.length > this.konamiCode.length) {
          this.konamiSeq.shift();
        }

        if (this.konamiTimer) clearTimeout(this.konamiTimer);
        this.konamiTimer = setTimeout(() => { this.konamiSeq = []; }, 5000);

        if (this.konamiSeq.length === this.konamiCode.length) {
          const match = this.konamiSeq.every((k, i) => k === this.konamiCode[i]);
          if (match) {
            this.triggerKonami();
            this.konamiSeq = [];
          }
        }
      }, { passive: true });
    },

    triggerKonami() {
      const flash = document.createElement('div');
      flash.className = 'konami-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 800);

      const toast = document.createElement('div');
      toast.className = 'konami-toast';
      toast.textContent = '🎮 KONAMI CODE!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  // ============================================================
  //  18. DYNAMIC GREETING — time-based greeting
  // ============================================================
  const DynamicGreeting = {
    init() {
      const el = document.getElementById('greetingText');
      if (!el) return;

      const hour = new Date().getHours();
      let greeting = '余额不足中';

      if (hour >= 5 && hour < 11) greeting = '早安';
      else if (hour >= 11 && hour < 14) greeting = '午安';
      else if (hour >= 14 && hour < 18) greeting = '下午好';
      else if (hour >= 18 && hour < 23) greeting = '晚上好';
      else greeting = '深夜了';

      el.textContent = greeting;
    }
  };

  // ============================================================
  //  19. ONLINE STATUS — time-based online/offline
  // ============================================================
  const OnlineStatus = {
    init() {
      const dot = document.getElementById('statusDot');
      const text = document.getElementById('statusText');
      if (!dot || !text) return;

      const hour = new Date().getHours();
      const online = hour >= 8 && hour < 23;

      if (online) {
        dot.classList.add('online');
        text.textContent = '在线';
      } else {
        dot.classList.add('offline');
        text.textContent = '离线';
      }
    }
  };

  // ============================================================
  //  20. IMAGE GENERATOR — AI image generation API
  // ============================================================
  const ImageGenerator = {
    apiKeyInput: null,
    endpointInput: null,
    modelInput: null,
    promptInput: null,
    generateBtn: null,
    outputArea: null,
    loaderArea: null,
    errorArea: null,
    errorMsg: null,
    downloadBar: null,
    downloadBtn: null,
    currentImage: null,

    init() {
      this.apiKeyInput = document.getElementById('apiKey');
      this.endpointInput = document.getElementById('apiEndpoint');
      this.modelInput = document.getElementById('apiModel');
      this.promptInput = document.getElementById('promptInput');
      this.generateBtn = document.getElementById('generateBtn');
      this.outputArea = document.getElementById('outputArea');
      this.loaderArea = document.getElementById('loaderArea');
      this.errorArea = document.getElementById('errorArea');
      this.errorMsg = document.getElementById('errorMsg');
      this.downloadBar = document.getElementById('downloadBar');
      this.downloadBtn = document.getElementById('downloadBtn');

      if (!this.generateBtn || !this.promptInput) return;

      this.generateBtn.addEventListener('click', () => this.generate());
      this.downloadBtn.addEventListener('click', () => this.download());
      this.promptInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          this.generate();
        }
      });
    },

    async generate() {
      const apiKey = this.apiKeyInput.value.trim();
      const endpoint = this.endpointInput.value.trim();
      const model = this.modelInput.value;
      const prompt = this.promptInput.value.trim();

      if (!apiKey) {
        this.showError('请输入 API Key');
        return;
      }

      if (!prompt) {
        this.showError('请输入提示词');
        return;
      }

      this.showLoading();
      this.hideError();
      this.currentImage = null;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            n: 1,
            size: '1024x1024'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `请求失败 (${response.status})`);
        }

        const data = await response.json();
        
        if (data.data && data.data[0]) {
          if (data.data[0].url) {
            this.showImage(data.data[0].url);
          } else if (data.data[0].b64_json) {
            this.showImage('data:image/png;base64,' + data.data[0].b64_json);
          } else {
            throw new Error('API 返回数据格式不正确');
          }
        } else {
          throw new Error('API 返回数据格式不正确');
        }
      } catch (error) {
        this.showError(error.message || '生成失败，请检查 API 设置');
      } finally {
        this.hideLoading();
      }
    },

    showImage(src) {
      this.outputArea.innerHTML = '';
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'AI generated image';
      img.onload = () => {
        this.currentImage = src;
        this.downloadBar.style.display = 'flex';
      };
      this.outputArea.appendChild(img);
    },

    download() {
      if (!this.currentImage) return;

      const link = document.createElement('a');
      link.download = `ai-art-${Date.now()}.png`;
      
      // If it's a data URL, use directly
      if (this.currentImage.startsWith('data:')) {
        link.href = this.currentImage;
      } else {
        // For external URLs, need to fetch as blob
        fetch(this.currentImage)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          })
          .catch(() => {
            // Fallback: open in new tab
            window.open(this.currentImage, '_blank');
          });
      }
      
      if (this.currentImage.startsWith('data:')) {
        link.click();
      }
    },

    showLoading() {
      this.loaderArea.style.display = 'flex';
      this.generateBtn.disabled = true;
      this.generateBtn.style.opacity = '0.6';
    },

    hideLoading() {
      this.loaderArea.style.display = 'none';
      this.generateBtn.disabled = false;
      this.generateBtn.style.opacity = '1';
    },

    showError(msg) {
      this.errorMsg.textContent = msg;
      this.errorArea.style.display = 'flex';
    },

    hideError() {
      this.errorArea.style.display = 'none';
    }
  };

  // ============================================================
  //  INIT
  // ============================================================
  function init() {
    Loader.init();
    Starfield.init();
    TitleAnim.init();
    Typewriter.init();
    ScrollUI.init();
    Reveal.init();
    SmoothScroll.init();
    Magnetic.init();
    Tilt.init();
    CardSpring.init();
    ActiveNav.init();
    Ripple.init();
    CustomCursor.init();
    LazyImages.init();
    KeyboardShortcuts.init();
    EasterEggs.init();
    DynamicGreeting.init();
    OnlineStatus.init();
    ImageGenerator.init();

    // Inject ripple keyframes if not already in CSS
    if (!document.querySelector('style[data-ripple]')) {
      const s = document.createElement('style');
      s.dataset.ripple = '1';
      s.textContent = '@keyframes rippleAnim{0%{transform:scale(0);opacity:0.7}100%{transform:scale(2.5);opacity:0}}';
      document.head.appendChild(s);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
