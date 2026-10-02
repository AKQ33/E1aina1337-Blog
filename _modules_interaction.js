  // ============================================================
  //  13. KEYBOARD SHORTCUTS
  // ============================================================
  const KeyboardShortcuts = {
    kbdHelp: null,

    init() {
      this.kbdHelp = $('#kbdHelp');
      window.addEventListener('keydown', this.onKeydown.bind(this), { passive: true });
    },

    onKeydown(e) {
      const target = e.target;
      // Don't trigger when typing in input/textarea
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const helpOpen = this.kbdHelp && this.kbdHelp.classList.contains('visible');

      // Esc always closes help
      if (e.key === 'Escape' && helpOpen) {
        this.kbdHelp.classList.remove('visible');
        return;
      }

      // Don't trigger other keys when help is open
      if (helpOpen) return;

      const vh = window.innerHeight;

      switch (e.key) {
        case 'j':
        case 'J':
          e.preventDefault();
          SmoothScroll.cancel();
          this.scrollToY(window.scrollY + vh);
          break;

        case 'k':
        case 'K':
          e.preventDefault();
          SmoothScroll.cancel();
          this.scrollToY(window.scrollY - vh);
          break;

        case 'Home':
          e.preventDefault();
          SmoothScroll.cancel();
          this.scrollToY(0);
          break;

        case 'End':
          e.preventDefault();
          SmoothScroll.cancel();
          this.scrollToY(document.documentElement.scrollHeight);
          break;

        case '?':
          if (this.kbdHelp) {
            this.kbdHelp.classList.toggle('visible');
          }
          break;
      }
    },

    scrollToY(endY) {
      SmoothScroll.animating = true;
      SmoothScroll.cancelled = false;

      const startY = window.scrollY;
      const diff = endY - startY;
      if (Math.abs(diff) < 2) {
        SmoothScroll.animating = false;
        return;
      }

      const dur = clamp(Math.abs(diff) * 0.4, 400, 900);
      const start = performance.now();

      const step = now => {
        if (SmoothScroll.cancelled) return;
        const p = clamp((now - start) / dur, 0, 1);
        const eased = ease.outQuint(p);
        window.scrollTo(0, startY + diff * eased);
        if (p < 1) {
          SmoothScroll.raf = requestAnimationFrame(step);
        } else {
          SmoothScroll.animating = false;
          SmoothScroll.raf = null;
        }
      };
      SmoothScroll.raf = requestAnimationFrame(step);
    }
  };

  // ============================================================
  //  14. EASTER EGGS
  // ============================================================
  const EasterEggs = {
    logoClicks: [],
    konamiSeq: [],
    konamiCode: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
    konamiTimer: null,
    logoEl: null,

    init() {
      this.logoEl = $('.nav-logo');

      if (this.logoEl) {
        this.logoEl.addEventListener('click', this.onLogoClick.bind(this));
      }

      window.addEventListener('keydown', this.onKonamiKey.bind(this), { passive: true });
    },

    onLogoClick() {
      const now = Date.now();
      this.logoClicks.push(now);

      // Remove clicks older than 2 seconds
      this.logoClicks = this.logoClicks.filter(t => now - t < 2000);

      if (this.logoClicks.length >= 3) {
        this.logoClicks = [];
        this.triggerCelebrate();
      }
    },

    triggerCelebrate() {
      if (!this.logoEl) return;

      // Add celebrate class briefly
      this.logoEl.classList.add('celebrate');
      setTimeout(() => this.logoEl.classList.remove('celebrate'), 1500);

      // Spawn 8 sparkle particles
      const rect = this.logoEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const colors = ['#4a9eff', '#34d399', '#ffffff', '#93c5fd'];

      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'sparkle-particle';
        particle.style.cssText = `
          position: fixed;
          left: ${cx}px;
          top: ${cy}px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${colors[i % colors.length]};
          pointer-events: none;
          z-index: 9999;
          transition: transform 0.8s ease-out, opacity 0.8s ease-out;
          box-shadow: 0 0 6px currentColor;
        `;
        document.body.appendChild(particle);

        const angle = (Math.PI * 2 / 8) * i;
        const distance = 40 + Math.random() * 30;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        requestAnimationFrame(() => {
          particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
          particle.style.opacity = '0';
        });

        setTimeout(() => particle.remove(), 800);
      }
    },

    onKonamiKey(e) {
      const key = e.key;
      // Only track relevant keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'b', 'B', 'a', 'A'].includes(key)) {
        this.resetKonami();
        return;
      }

      // Normalize b/a to lowercase
      const normKey = key.toLowerCase();
      this.konamiSeq.push(normKey);

      // Check if sequence matches
      const expected = this.konamiCode[this.konamiSeq.length - 1];
      if (normKey !== expected) {
        this.resetKonami();
        return;
      }

      // Reset timer on each key
      clearTimeout(this.konamiTimer);
      this.konamiTimer = setTimeout(() => this.resetKonami(), 5000);

      // Check if complete
      if (this.konamiSeq.length === this.konamiCode.length) {
        this.resetKonami();
        this.triggerKonami();
      }
    },

    resetKonami() {
      this.konamiSeq = [];
      clearTimeout(this.konamiTimer);
    },

    triggerKonami() {
      // Flash overlay
      const flash = document.createElement('div');
      flash.className = 'konami-flash';
      flash.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(74, 158, 255, 0.15);
        z-index: 10000;
        pointer-events: none;
        animation: konami-flash-anim 0.8s ease-out forwards;
      `;
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 800);

      // Toast
      const toast = document.createElement('div');
      toast.className = 'konami-toast';
      toast.textContent = '?? KONAMI CODE!';
      toast.style.cssText = `
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        padding: 14px 28px;
        background: linear-gradient(135deg, rgba(74, 158, 255, 0.3), rgba(52, 211, 153, 0.3));
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 100px;
        color: #fff;
        font-family: var(--font-mono);
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.05em;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        box-shadow: 0 8px 32px rgba(74, 158, 255, 0.3);
      `;
      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }
  };

  // ============================================================
  //  15. DYNAMIC GREETING
  // ============================================================
  const DynamicGreeting = {
    el: null,

    init() {
      this.el = $('#greetingText');
      if (!this.el) return;

      const hour = new Date().getHours();
      let greeting = '你好';

      if (hour >= 5 && hour < 11) greeting = '早安';
      else if (hour >= 11 && hour < 14) greeting = '午安';
      else if (hour >= 14 && hour < 18) greeting = '下午好';
      else if (hour >= 18 && hour < 23) greeting = '晚上好';
      else greeting = '深夜了';

      this.el.textContent = greeting;
    }
  };

  // ============================================================
  //  16. ONLINE STATUS
  // ============================================================
  const OnlineStatus = {
    dot: null,
    text: null,

    init() {
      this.dot = $('#statusDot');
      this.text = $('#statusText');
      if (!this.dot || !this.text) return;

      const hour = new Date().getHours();
      const isOnline = hour >= 8 && hour < 23;

      if (isOnline) {
        this.dot.className = 'status-dot online';
        this.text.textContent = '在线';
      } else {
        this.dot.className = 'status-dot offline';
        this.text.textContent = '离线';
      }
    }
  };
