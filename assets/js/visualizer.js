/**
 * Nadine Baghdady Art Gallery - Room Visualizer Engine
 * Interactive Spatial Wall Placement & Framing Studio
 */

(function () {
  'use strict';

  // State
  let artworks = [];
  let currentArtwork = null;
  let customArtworkSrc = null;
  let customRoomSrc = null;
  let currentRoom = 'assets/images/rooms/living_room.jpg';
  let currentFrame = 'oak'; // canvas | oak | charcoal | gold
  let scale = 100; // 50% to 150%
  let posX = 50; // percentage
  let posY = 40; // percentage

  // DOM Elements
  let wallStage = null;
  let artworkFrame = null;
  let artworkImg = null;
  let roomBg = null;
  let roomBadge = null;
  let artworkPlaque = null;
  let scaleInput = null;
  let scaleVal = null;
  let posXInput = null;
  let posXVal = null;
  let posYInput = null;
  let posYVal = null;
  let resetBtn = null;
  let artworkGrid = null;
  let artUploadInput = null;
  let roomUploadInput = null;

  // Dragging state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialPosX = 50;
  let initialPosY = 40;

  document.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    initEventListeners();
    await loadArtworks();
    renderArtworkGrid();
    applyInitialArtworkFromUrl();
    updateArtworkTransform();
  });

  function cacheElements() {
    wallStage = document.getElementById('wallStage');
    artworkFrame = document.getElementById('wallArtworkFrame');
    artworkImg = document.getElementById('wallArtworkImg');
    roomBg = document.getElementById('wallRoomBg');
    roomBadge = document.getElementById('wallRoomBadge');
    artworkPlaque = document.getElementById('wallArtworkPlaque');
    scaleInput = document.getElementById('scaleSlider');
    scaleVal = document.getElementById('scaleValue');
    posXInput = document.getElementById('posXSlider');
    posXVal = document.getElementById('posXValue');
    posYInput = document.getElementById('posYSlider');
    posYVal = document.getElementById('posYValue');
    resetBtn = document.getElementById('resetWallBtn');
    artworkGrid = document.getElementById('visualizerArtworkGrid');
    artUploadInput = document.getElementById('artUploadInput');
    roomUploadInput = document.getElementById('roomUploadInput');
  }

  async function loadArtworks() {
    // 1. Check local vault
    try {
      const local = localStorage.getItem('nb_gallery_artworks');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          artworks = parsed;
          return;
        }
      }
    } catch (e) {}

    // 2. Check API
    try {
      const res = await fetch('/api/artworks');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          artworks = data;
          return;
        }
      }
    } catch (e) {}

    // 3. Fallback to static seed
    try {
      const res = await fetch('assets/data/artworks.json');
      if (res.ok) {
        artworks = await res.json();
      }
    } catch (e) {}

    // 4. Default mock if completely empty
    if (!artworks || artworks.length === 0) {
      artworks = [
        { id: 'art-1', title: 'Atelier Artwork I', image: 'assets/images/artworks/art-1.jpg' },
        { id: 'art-2', title: 'Atelier Artwork II', image: 'assets/images/artworks/art-2.jpg' },
        { id: 'art-3', title: 'Atelier Artwork III', image: 'assets/images/artworks/art-3.jpg' },
        { id: 'art-4', title: 'Atelier Artwork IV', image: 'assets/images/artworks/art-4.jpg' },
        { id: 'art-5', title: 'Atelier Artwork V', image: 'assets/images/artworks/art-5.jpg' }
      ];
    }
  }

  function applyInitialArtworkFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const artId = params.get('art');

    if (artId && artworks.length > 0) {
      const found = artworks.find(a => a.id === artId || String(a.id).includes(artId));
      if (found) {
        selectArtwork(found);
        return;
      }
    }

    if (artworks.length > 0) {
      selectArtwork(artworks[0]);
    }
  }

  function renderArtworkGrid() {
    if (!artworkGrid) return;
    artworkGrid.innerHTML = '';

    artworks.forEach((art, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'artwork-thumb-btn';
      if (currentArtwork && currentArtwork.id === art.id) {
        btn.classList.add('active');
      }
      btn.setAttribute('aria-label', art.title || `Artwork ${idx + 1}`);

      const imgSrc = art.image || art.fallbackImage || 'assets/images/logo-badge.jpg';
      btn.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(art.title || 'Artwork')}" loading="lazy">`;

      btn.addEventListener('click', () => {
        customArtworkSrc = null;
        selectArtwork(art);
      });

      artworkGrid.appendChild(btn);
    });
  }

  function selectArtwork(art) {
    currentArtwork = art;
    if (artworkImg) {
      artworkImg.src = customArtworkSrc || art.image || art.fallbackImage || 'assets/images/logo-badge.jpg';
      artworkImg.alt = art.title || 'Artwork';
    }

    if (artworkPlaque) {
      const title = art.title || (window.currentLang === 'ar' ? 'لوحة أصلية' : 'Original Artwork');
      const artist = 'Nadine Baghdady';
      artworkPlaque.innerHTML = `<span>${escapeHtml(title)} • ${artist}</span>`;
    }

    // Update active state in grid
    if (artworkGrid) {
      const btns = artworkGrid.querySelectorAll('.artwork-thumb-btn');
      btns.forEach((b, i) => {
        if (artworks[i] && artworks[i].id === art.id && !customArtworkSrc) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
  }

  function initEventListeners() {
    // Sliders
    if (scaleInput) {
      scaleInput.addEventListener('input', (e) => {
        scale = Number(e.target.value);
        if (scaleVal) scaleVal.textContent = `${scale}%`;
        updateArtworkTransform();
      });
    }

    if (posXInput) {
      posXInput.addEventListener('input', (e) => {
        posX = Number(e.target.value);
        if (posXVal) posXVal.textContent = `${posX}%`;
        updateArtworkTransform();
      });
    }

    if (posYInput) {
      posYInput.addEventListener('input', (e) => {
        posY = Number(e.target.value);
        if (posYVal) posYVal.textContent = `${posY}%`;
        updateArtworkTransform();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        scale = 100;
        posX = 50;
        posY = 40;
        if (scaleInput) scaleInput.value = 100;
        if (scaleVal) scaleVal.textContent = '100%';
        if (posXInput) posXInput.value = 50;
        if (posXVal) posXVal.textContent = '50%';
        if (posYInput) posYInput.value = 40;
        if (posYVal) posYVal.textContent = '40%';
        updateArtworkTransform();
      });
    }

    // Frame Buttons
    document.querySelectorAll('[data-frame-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        const frame = btn.getAttribute('data-frame-style');
        setFrameStyle(frame);
      });
    });

    // Room Buttons
    document.querySelectorAll('[data-room-bg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const room = btn.getAttribute('data-room-bg');
        setRoomBg(room);
      });
    });

    // Custom Artwork Upload
    if (artUploadInput) {
      artUploadInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
          alert(window.currentLang === 'ar' ? 'يرجى اختيار صورة بحجم أقل من 15 ميجابايت' : 'Please choose an image under 15MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            customArtworkSrc = event.target.result;
            if (artworkImg) artworkImg.src = customArtworkSrc;
            if (artworkPlaque) {
              artworkPlaque.innerHTML = `<span>${window.currentLang === 'ar' ? 'لوحتك المخصصة' : 'Custom Upload'} • Nadine Baghdady Atelier</span>`;
            }
            if (artworkGrid) {
              artworkGrid.querySelectorAll('.artwork-thumb-btn').forEach(b => b.classList.remove('active'));
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Custom Room Upload
    if (roomUploadInput) {
      roomUploadInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
          alert(window.currentLang === 'ar' ? 'يرجى اختيار صورة بحجم أقل من 15 ميجابايت' : 'Please choose an image under 15MB.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            customRoomSrc = event.target.result;
            if (roomBg) roomBg.src = customRoomSrc;
            if (roomBadge) {
              roomBadge.textContent = window.currentLang === 'ar' ? 'جدار غرفتك الخاص' : 'Your Custom Wall';
            }
            document.querySelectorAll('[data-room-bg]').forEach(b => b.classList.remove('active'));
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Dragging artwork directly on wall (Mouse & Touch)
    initDragging();
  }

  function setFrameStyle(style) {
    currentFrame = style;
    const inner = document.querySelector('.wall-artwork-inner');
    if (!inner) return;

    inner.className = 'wall-artwork-inner ' + `frame-style-${style}`;

    document.querySelectorAll('[data-frame-style]').forEach(btn => {
      if (btn.getAttribute('data-frame-style') === style) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function setRoomBg(src) {
    customRoomSrc = null;
    currentRoom = src;
    if (roomBg) roomBg.src = src;

    if (roomBadge) {
      roomBadge.textContent = window.currentLang === 'ar' ? 'بيئة معمارية راقية' : 'Architectural Setting';
    }

    document.querySelectorAll('[data-room-bg]').forEach(btn => {
      if (btn.getAttribute('data-room-bg') === src && !customRoomSrc) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateArtworkTransform() {
    if (!artworkFrame) return;
    artworkFrame.style.left = `${posX}%`;
    artworkFrame.style.top = `${posY}%`;
    artworkFrame.style.width = `${(scale / 100) * 32}%`;
  }

  function initDragging() {
    if (!artworkFrame || !wallStage) return;

    // Mouse drag
    artworkFrame.addEventListener('mousedown', (e) => {
      isDragging = true;
      artworkFrame.classList.add('is-dragging');
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialPosX = posX;
      initialPosY = posY;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !wallStage) return;
      const rect = wallStage.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartY) / rect.height) * 100;

      posX = Math.min(80, Math.max(20, initialPosX + deltaX));
      posY = Math.min(68, Math.max(15, initialPosY + deltaY));

      if (posXInput) posXInput.value = Math.round(posX);
      if (posXVal) posXVal.textContent = `${Math.round(posX)}%`;
      if (posYInput) posYInput.value = Math.round(posY);
      if (posYVal) posYVal.textContent = `${Math.round(posY)}%`;

      updateArtworkTransform();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        artworkFrame.classList.remove('is-dragging');
      }
    });

    // Touch drag
    artworkFrame.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      artworkFrame.classList.add('is-dragging');
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      initialPosX = posX;
      initialPosY = posY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || !wallStage || e.touches.length !== 1) return;
      const rect = wallStage.getBoundingClientRect();
      const deltaX = ((e.touches[0].clientX - dragStartX) / rect.width) * 100;
      const deltaY = ((e.touches[0].clientY - dragStartY) / rect.height) * 100;

      posX = Math.min(80, Math.max(20, initialPosX + deltaX));
      posY = Math.min(68, Math.max(15, initialPosY + deltaY));

      if (posXInput) posXInput.value = Math.round(posX);
      if (posXVal) posXVal.textContent = `${Math.round(posX)}%`;
      if (posYInput) posYInput.value = Math.round(posY);
      if (posYVal) posYVal.textContent = `${Math.round(posY)}%`;

      updateArtworkTransform();
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        artworkFrame.classList.remove('is-dragging');
      }
    });
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

})();
