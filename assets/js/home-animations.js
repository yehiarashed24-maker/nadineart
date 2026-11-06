/**
 * Nadine Baghdadi Art Gallery - Home Page Cinematic & Fantasy Animations
 * Powered by Anime.js v4.5.0
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHomeAnimations() {
    const animeLib = window.anime;
    if (!animeLib) {
      console.warn('Anime.js library not detected.');
      return;
    }

    const { animate, createTimeline, stagger } = animeLib;

    // Mark document as ready for animations
    document.documentElement.classList.add('anime-active');

    // =========================================================================
    // 1. FLOATING GOLDEN DUST CANVAS (HERO AMBIENT EFFECT)
    // =========================================================================
    initHeroDustCanvas();

    // =========================================================================
    // 2. CINEMATIC HERO OPENING SEQUENCE (TIMELINE)
    // =========================================================================
    if (!prefersReducedMotion) {
      runHeroCinematicEntrance(animate, createTimeline, stagger);
    }

    // =========================================================================
    // 3. INTERACTIVE HERO CTA MAGNETIC EFFECT
    // =========================================================================
    if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
      initMagneticHeroCta(animate);
    }

    // =========================================================================
    // 4. "A FRAME FOR EVERY HOUSE" MASTERPIECES 3D CASCADE & PARALLAX
    // =========================================================================
    initFrameSectionAnimations(animate, stagger);

    // =========================================================================
    // 6. ARTIST SNIPPET REVEAL & HEARTBEAT PULSE
    // =========================================================================
    initArtistSnippetAnimations(animate);
    initHeartbeatPulse(animate);

    // =========================================================================
    // 7. ALL-IN-ONE LUXURY ART EXPERIENCES
    // =========================================================================
    // Feature 1: Curator's Gallery Spotlight
    if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
      initCuratorSpotlight();
    }

    // Feature 4: Artist's Brushstroke Scroll Indicator
    initBrushstrokeScrollIndicator();

    // Re-run headline brush inscription when switching language
    window.addEventListener('languageChanged', () => {
      if (!prefersReducedMotion) {
        runHeroCinematicEntrance(animate, createTimeline, stagger);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 1. Golden Dust Canvas in Hero
  // ---------------------------------------------------------------------------
  function initHeroDustCanvas() {
    const canvas = document.getElementById('heroDustCanvas');
    const hero = document.querySelector('.home-hero');
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = hero.offsetWidth);
    let height = (canvas.height = hero.offsetHeight);
    let animationFrameId = null;
    let isVisible = true;

    // Mouse coordinates relative to hero center
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const particleCount = window.innerWidth < 768 ? 24 : 45;
    const particles = [];

    // Particle class
    class DustParticle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.radius = Math.random() * 2.2 + 0.8;
        this.baseAlpha = Math.random() * 0.45 + 0.25;
        this.alpha = this.baseAlpha;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = -(Math.random() * 0.45 + 0.2); // Gently rises upward
        this.twinkleSpeed = Math.random() * 0.02 + 0.008;
        this.twinklePhase = Math.random() * Math.PI * 2;
        // Gold-leaf & terracotta flecks (light theme)
        const pearlTones = [
          '176, 138, 78',  // Gold leaf
          '201, 150, 120', // Dusty rose
          '184, 105, 63',  // Terracotta
          '160, 130, 100'  // Warm umber
        ];
        this.rgb = pearlTones[Math.floor(Math.random() * pearlTones.length)];
      }

      update() {
        this.twinklePhase += this.twinkleSpeed;
        this.alpha = this.baseAlpha + Math.sin(this.twinklePhase) * 0.2;
        if (this.alpha < 0.05) this.alpha = 0.05;

        // Soft drift + gentle mouse influence
        this.x += this.vx + (mouseX * 0.00018);
        this.y += this.vy + (mouseY * 0.00012);

        // Wrap around boundaries
        if (this.y < -15) this.reset(false);
        if (this.x < -15) this.x = width + 10;
        if (this.x > width + 15) this.x = -10;
      }

      draw() {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius * 2.4
        );
        gradient.addColorStop(0, `rgba(${this.rgb}, ${this.alpha})`);
        gradient.addColorStop(0.5, `rgba(${this.rgb}, ${this.alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(${this.rgb}, 0)`);

        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.radius * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new DustParticle());
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.offsetWidth;
      height = hero.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      targetMouseX = e.clientX - (rect.left + rect.width / 2);
      targetMouseY = e.clientY - (rect.top + rect.height / 2);
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      targetMouseX = 0;
      targetMouseY = 0;
    }, { passive: true });

    // Render loop
    function loop() {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    // Pause canvas when out of view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });

    observer.observe(hero);
    loop();
  }

  // ---------------------------------------------------------------------------
  // 2. Cinematic Hero Opening Sequence with Live Brush Inscription
  // ---------------------------------------------------------------------------
  function prepareHeadlineBrushDrawing(headline) {
    if (!headline) return null;

    // Split headline by <br> or newline
    const originalHTML = headline.innerHTML;
    const parts = originalHTML.split(/<br\s*\/?>/i);

    let wrappedHTML = '';
    parts.forEach((part, lineIdx) => {
      // Remove any tags inside part if present
      const cleanText = part.replace(/<[^>]*>/g, '').trim();
      const isArabic = /[\u0600-\u06FF]/.test(cleanText);
      const words = cleanText.split(/\s+/).filter(Boolean);
      let lineWordsHTML = '';

      if (isArabic) {
        // Arabic cursive script must NOT split characters into individual spans,
        // otherwise letter ligatures disconnect into isolated forms.
        words.forEach((word, wordIdx) => {
          lineWordsHTML += `<span class="brush-char brush-word" data-line="${lineIdx}">${word}</span>`;
          if (wordIdx < words.length - 1) {
            lineWordsHTML += '<span class="brush-char space">&nbsp;</span>';
          }
        });
      } else {
        words.forEach((word, wordIdx) => {
          let wordChars = '';
          for (let i = 0; i < word.length; i++) {
            const char = word[i];
            wordChars += `<span class="brush-char" data-line="${lineIdx}">${char}</span>`;
          }
          lineWordsHTML += `<span class="brush-word">${wordChars}</span>`;
          if (wordIdx < words.length - 1) {
            lineWordsHTML += '<span class="brush-char space">&nbsp;</span>';
          }
        });
      }
      wrappedHTML += `<span class="brush-line line-${lineIdx + 1}">${lineWordsHTML}</span>`;
    });

    headline.innerHTML = wrappedHTML;

    // Create or find brush tip element
    let brushTip = headline.querySelector('.headline-brush-tip');
    if (!brushTip) {
      brushTip = document.createElement('div');
      brushTip.className = 'headline-brush-tip';
      headline.appendChild(brushTip);
    }

    return {
      chars: Array.from(headline.querySelectorAll('.brush-char:not(.space)')),
      brushTip: brushTip,
      wrapper: headline
    };
  }

  function runHeroCinematicEntrance(animate, createTimeline, stagger) {
    const logo = document.querySelector('.brand-logo-circle');
    const brandSpans = document.querySelectorAll('.brand-title span');
    const headline = document.querySelector('.home-headline');
    const cta = document.querySelector('.home-cta');
    const brushStrokePath = document.getElementById('brushStrokePath');
    const brushStreakPath = document.getElementById('brushStreakPath');

    if (!headline) return;

    // Fixed Logo & Text - Clean and immediate
    if (logo) {
      logo.style.opacity = '1';
      logo.style.transform = 'none';
    }
    brandSpans.forEach(span => {
      span.style.opacity = '1';
      span.style.transform = 'none';
    });

    // Prepare SVG brushstroke dash offsets
    let len1 = 350;
    let len2 = 320;
    if (brushStrokePath && typeof brushStrokePath.getTotalLength === 'function') {
      try {
        len1 = brushStrokePath.getTotalLength();
        brushStrokePath.style.strokeDasharray = len1;
        brushStrokePath.style.strokeDashoffset = len1;
      } catch(e) {}
    }
    if (brushStreakPath && typeof brushStreakPath.getTotalLength === 'function') {
      try {
        len2 = brushStreakPath.getTotalLength();
        brushStreakPath.style.strokeDasharray = len2;
        brushStreakPath.style.strokeDashoffset = len2;
      } catch(e) {}
    }

    // Prepare live brush-drawn inscription for headline
    const headlineData = prepareHeadlineBrushDrawing(headline);

    if (headlineData && headlineData.chars.length > 0) {
      const { chars, brushTip, wrapper } = headlineData;
      const charCount = chars.length;

      // Start brush inscription smoothly
      setTimeout(() => {
        // Place brush tip at the start of first character
        const firstRect = chars[0].getBoundingClientRect();
        const wrapRect = wrapper.getBoundingClientRect();
        brushTip.style.left = (firstRect.left - wrapRect.left) + 'px';
        brushTip.style.top = (firstRect.top - wrapRect.top + firstRect.height / 2) + 'px';
        brushTip.classList.add('active');

        // Draw each letter (or word in Arabic) sequentially like a real paintbrush stroke
        const isArabicMode = document.documentElement.dir === 'rtl' || /[\u0600-\u06FF]/.test(wrapper.textContent);
        const charInterval = isArabicMode ? 130 : 38; // ms per word for Arabic cursive, per letter for English

        chars.forEach((char, idx) => {
          setTimeout(() => {
            const cRect = char.getBoundingClientRect();
            const wRect = wrapper.getBoundingClientRect();
            const targetX = cRect.left - wRect.left + cRect.width / 2;
            const targetY = cRect.top - wRect.top + cRect.height / 2;

            brushTip.style.left = targetX + 'px';
            brushTip.style.top = targetY + 'px';

            // Paint the letter with fluid ink bloom
            animate(char, {
              opacity: [0, 1],
              filter: ['blur(8px)', 'blur(0px)'],
              translateY: [6, 0],
              scale: [0.92, 1],
              duration: 360,
              ease: 'outQuart'
            });

            // Tiny gold ink fleck occasionally
            if (idx % 3 === 0) {
              const drop = document.createElement('span');
              drop.className = 'headline-ink-drop';
              drop.style.left = targetX + 'px';
              drop.style.top = (targetY + 8) + 'px';
              wrapper.appendChild(drop);
              setTimeout(() => drop.remove(), 700);
            }

            // When the last letter finishes drawing:
            if (idx === charCount - 1) {
              setTimeout(() => {
                brushTip.classList.remove('active');
                wrapper.classList.add('anime-painted');

                // Flow seamlessly into the golden underline brushstroke flourish!
                if (brushStrokePath) {
                  animate(brushStrokePath, {
                    strokeDashoffset: [len1, 0],
                    duration: 1050,
                    ease: 'outQuart'
                  });
                }
                if (brushStreakPath) {
                  animate(brushStreakPath, {
                    strokeDashoffset: [len2, 0],
                    duration: 900,
                    ease: 'outQuart'
                  });
                }

                // CTA button reveals elegantly
                if (cta) {
                  cta.style.opacity = '0';
                  animate(cta, {
                    opacity: [0, 1],
                    translateY: [15, 0],
                    duration: 750,
                    ease: 'outQuad'
                  });
                }
              }, 80);
            }
          }, idx * charInterval);
        });
      }, 550);
    } else {
      // Fallback if headline splitting was not needed
      headline.style.opacity = '1';
      headline.style.transform = 'none';

      if (brushStrokePath) {
        setTimeout(() => {
          animate(brushStrokePath, {
            strokeDashoffset: [len1, 0],
            duration: 1100,
            ease: 'outQuart'
          });
        }, 650);
      }
      if (brushStreakPath) {
        setTimeout(() => {
          animate(brushStreakPath, {
            strokeDashoffset: [len2, 0],
            duration: 950,
            ease: 'outQuart'
          });
        }, 750);
      }
      if (cta) {
        cta.style.opacity = '0';
        setTimeout(() => {
          animate(cta, {
            opacity: [0, 1],
            translateY: [15, 0],
            duration: 800,
            ease: 'outQuad'
          });
        }, 950);
      }
    }
  }

  // ---------------------------------------------------------------------------
    // 3. Magnetic CTA on Mouse Movement
  // ---------------------------------------------------------------------------
  function initMagneticHeroCta(animate) {
    const cta = document.querySelector('.home-cta');
    if (!cta) return;

    cta.addEventListener('mousemove', (e) => {
      const rect = cta.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);

      animate(cta, {
        translateX: x * 0.35,
        translateY: y * 0.35,
        duration: 250,
        ease: 'outQuad'
      });
    });

    cta.addEventListener('mouseleave', () => {
      animate(cta, {
        translateX: 0,
        translateY: 0,
        duration: 700,
        ease: 'outBack(2)'
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 4. "A Frame for Every House" Section Animations & 3D Wall Mounting
  // ---------------------------------------------------------------------------
  function initFrameSectionAnimations(animate, stagger) {
    const section = document.querySelector('.home-frame-section');
    if (!section) return;

    const title = section.querySelector('.frame-section-title');
    const descParagraphs = section.querySelectorAll('.frame-section-desc p');
    const wallComposition = section.querySelector('.trio-wall-composition');
    const frames = section.querySelectorAll('.framed-piece');
    const mainPiece = section.querySelector('.frame-main-piece');
    const subTop = section.querySelector('.frame-sub-top');
    const subBot = section.querySelector('.frame-sub-bot');

    let sectionAnimated = false;

    // Trigger frame mounting entrance as the visitor scrolls down into the section
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !sectionAnimated) {
          sectionAnimated = true;
          section.classList.add('frame-revealed');

          // 1. Poetic Headline Entrance
          if (title) {
            animate(title, {
              opacity: [0, 1],
              translateX: [-40, 0],
              duration: 1100,
              ease: 'outQuart'
            });
          }

          if (descParagraphs.length > 0) {
            animate(descParagraphs, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 1000,
              delay: stagger(160, { start: 220 }),
              ease: 'outQuart'
            });
          }

          // 2. Main Hero Piece mounts onto the gallery wall with clean gentle reveal
          if (mainPiece) {
            animate(mainPiece, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 900,
              delay: 150,
              ease: 'outQuart'
            });
          }

          // 3. Top-Right Frame Mounts
          if (subTop) {
            animate(subTop, {
              opacity: [0, 1],
              translateX: [65, 0],
              translateY: [50, 0],
              rotateY: [20, 0],
              rotateX: [-8, 0],
              scale: [0.82, 1],
              duration: 1250,
              delay: 350,
              ease: 'outBack(1.4)'
            });
          }

          // 4. Bottom-Right Frame Mounts
          if (subBot) {
            animate(subBot, {
              opacity: [0, 1],
              translateX: [65, 0],
              translateY: [60, 0],
              rotateY: [-18, 0],
              rotateX: [10, 0],
              scale: [0.82, 1],
              duration: 1250,
              delay: 520,
              ease: 'outBack(1.4)'
            });
          }
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

    sectionObserver.observe(section);
  }

  // ---------------------------------------------------------------------------
  // 6. Artist Snippet Reveal & Heartbeat Pulse
  // ---------------------------------------------------------------------------
  function initArtistSnippetAnimations(animate) {
    const snippetSection = document.querySelector('.home-artist-snippet');
    if (!snippetSection) return;

    const avatar = snippetSection.querySelector('.snippet-avatar');
    const bio = snippetSection.querySelector('.snippet-bio');
    const link = snippetSection.querySelector('.snippet-link');
    let animated = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;

          if (avatar) {
            animate(avatar, {
              opacity: [0, 1],
              scale: [0.75, 1],
              rotate: [-10, 0],
              duration: 1100,
              ease: 'outBack(1.4)'
            });
          }

          if (bio) {
            animate(bio, {
              opacity: [0, 1],
              translateY: [25, 0],
              duration: 1000,
              delay: 200,
              ease: 'outExpo'
            });
          }

          if (link) {
            animate(link, {
              opacity: [0, 1],
              translateX: [-20, 0],
              duration: 900,
              delay: 380,
              ease: 'outExpo'
            });
          }
        }
      });
    }, { threshold: 0.05 });

    observer.observe(snippetSection);
  }

  function initHeartbeatPulse(animate) {
    const heart = document.querySelector('.care-heart-icon i');
    if (!heart || prefersReducedMotion) return;

    let pulseAnim = null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!pulseAnim) {
            pulseAnim = animate(heart, {
              scale: [1, 1.25, 1, 1.18, 1],
              color: ['#b8693f', '#e57373', '#b8693f', '#d9534f', '#b8693f'],
              duration: 1800,
              loop: true,
              ease: 'inOutQuad'
            });
          } else {
            pulseAnim.play();
          }
        } else if (pulseAnim) {
          pulseAnim.pause();
        }
      });
    }, { threshold: 0.2 });

    const careBlock = document.querySelector('.frame-care-block');
    if (careBlock) observer.observe(careBlock);
  }

  // ---------------------------------------------------------------------------
  // Feature 1: Curator's Gallery Spotlight (Warm Ambient Follower)
  // ---------------------------------------------------------------------------
  function initCuratorSpotlight() {
    const spotlight = document.getElementById('curatorSpotlight');
    if (!spotlight) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isMoving = false;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isMoving) {
        isMoving = true;
        spotlight.classList.add('active');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      spotlight.classList.remove('active');
      isMoving = false;
    });

    function spotlightLoop() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      spotlight.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`;
      requestAnimationFrame(spotlightLoop);
    }

    requestAnimationFrame(spotlightLoop);
  }

  // ---------------------------------------------------------------------------
  // Feature 4: Artist's Brushstroke Scroll Indicator
  // ---------------------------------------------------------------------------
  function initBrushstrokeScrollIndicator() {
    const bar = document.getElementById('brushProgressBar');
    if (!bar) return;

    function updateScrollProgress() {
      const scrollY = window.scrollY || window.pageYOffset;
      const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalDocHeight <= 0) return;
      const progress = Math.min(1, Math.max(0, scrollY / totalDocHeight));
      bar.style.width = `${(progress * 100).toFixed(2)}%`;
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
  }

  // Self-initializing on DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeAnimations);
  } else {
    initHomeAnimations();
  }
})();
