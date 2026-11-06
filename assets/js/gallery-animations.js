/**
 * Nadine Baghdadi Art Gallery - Original Native Stroll & Dynamic Ambient Lighting
 * 100% Native 60fps Scroll Snap Physics - Zero-Hang / Zero-Hijacking
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadDynamicArtworks();
    } catch (err) {
      console.warn('Dynamic load error:', err);
    }
    initOriginalGallery();
  });

  async function loadDynamicArtworks() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    let data = null;

    // 1. Check local administrative vault first (instant preview on curator's browser without database)
    const localVault = localStorage.getItem('nb_gallery_artworks');
    if (localVault) {
      try {
        const parsed = JSON.parse(localVault);
        if (Array.isArray(parsed) && parsed.length > 0) {
          data = parsed;
        }
      } catch (e) {}
    }

    // 2. If no local vault, fetch from live cloud API
    if (!data) {
      try {
        const apiRes = await fetch('/api/artworks').catch(() => null);
        if (apiRes && apiRes.ok) {
          const liveData = await apiRes.json().catch(() => null);
          if (Array.isArray(liveData) && liveData.length > 0) {
            data = liveData;
          }
        }
      } catch (e) {}
    }

    // 3. Fallback to initial seed artworks.json
    if (!data) {
      try {
        const res = await fetch('assets/data/artworks.json');
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {}
    }

    if (!data || !data.length) return;

    // Render dynamic items into grid
    galleryGrid.innerHTML = '';
    data.forEach((art, idx) => {
      const a = document.createElement('a');
      a.href = art.link || '#';
      a.className = 'gallery-item';
      a.setAttribute('data-category', (art.category || 'watercolor').toLowerCase());
      if (art.ambientColor) {
        a.setAttribute('data-ambient-color', art.ambientColor);
      }
      if (art.link && art.link !== '#') {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }

      const catKey = `cat_${(art.category || 'watercolor').toLowerCase()}`;
      const imgSrc = art.image || art.fallbackImage || 'assets/images/logo-badge.jpg';
      const fallbackAttr = art.fallbackImage ? `onerror="this.onerror=null;this.src='${art.fallbackImage}'"` : '';

      a.innerHTML = `
        <img src="${imgSrc}" ${fallbackAttr} alt="${escapeHtml(art.title || 'Artwork')}" class="gallery-item-img" ${idx === 0 ? 'loading="eager"' : 'loading="lazy"'}>
        ${(art.title || art.artist || art.price) ? `<div class="gallery-item-info">
          ${art.title ? `<h3 class="gallery-item-title">${escapeHtml(art.title)}</h3>` : ''}
          ${art.artist ? `<span class="gallery-item-artist">${escapeHtml(art.artist)}</span>` : ''}
          ${art.price ? `<span class="gallery-item-price">${escapeHtml(art.price)}</span>` : ''}
        </div>` : ''}
      `;
      galleryGrid.appendChild(a);
    });

    // Translate dynamic category tags if i18n engine is active
    if (window.setLanguage && window.currentLang) {
      window.setLanguage(window.currentLang);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initOriginalGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const ambientLayer = document.querySelector('.gallery-ambient-layer');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const watermark = document.getElementById('galleryWatermark');

    function updateWatermark() {
      if (!watermark) return;
      const isAr = document.body.getAttribute('dir') === 'rtl';
      watermark.textContent = isAr ? 'نادين بغدادي' : 'Nadine Baghdadi';
    }
    updateWatermark();

    if (!galleryGrid || !galleryItems.length) return;

    // 1. Signature Ambient Colors Per Artwork
    const defaultColors = [
      "#3b2b1f", "#4a2912", "#112738", "#3d2447",
      "#4a1919", "#3b2718", "#0f1a38", "#183329",
      "#113622", "#423311", "#3d1330", "#211d42"
    ];

    // 2. Ambient Lighting via IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const index = galleryItems.indexOf(entry.target);
          const dynamicColor = entry.target.getAttribute('data-ambient-color');
          const finalColor = dynamicColor || defaultColors[index % defaultColors.length] || '#3b2b1f';
          if (ambientLayer) {
            ambientLayer.style.backgroundColor = finalColor;
          }
        }
      });
    }, {
      root: galleryGrid,
      threshold: 0.5
    });

    galleryItems.forEach(item => observer.observe(item));

    // Language switch observer
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        setTimeout(updateWatermark, 120);
      });
    }
  }
})();
