/**
 * Nadine Baghdadi Art Gallery - Main Application Script
 * Manages Artwork Catalog, Quick View Modal, Collector Bag, and Commission Inquiries
 */

// =========================================================================
// ARTWORK DATA FOR GALLERY & QUICK VIEW
// =========================================================================
const ARTWORKS_DATA = {
  symphony: {
    title: "Symphony in Rose & Cobalt",
    medium: "Impasto Oil on Belgian Linen",
    dims: "100 × 120 cm (39 × 47 in)",
    price: "$680.00",
    numPrice: 680.00,
    img: "assets/images/artworks/art_symphony.jpg",
    desc: "An expressive, high-energy abstract composition characterized by bold palette knife ridges, cadmium yellow highlights, deep ultramarine strokes, and rose magenta melodies. Finished with archival UV satin varnish and fitted in a handcrafted natural oak float frame."
  },
  floral: {
    title: "Golden Bloom Botanical Motif",
    medium: "24K Gold Leaf & Textured Acrylic",
    dims: "120 × 140 cm (47 × 55 in)",
    price: "$850.00",
    numPrice: 850.00,
    img: "assets/images/artworks/art_floral.jpg",
    desc: "Nadine's signature textured botanical motif, featuring sculptural impasto rose petals in blush pink and pure titanium white, layered over genuine 24-karat gold leaf leafing that radiates warm luminescence under gallery lighting."
  },
  golden: {
    title: "Ethereal Sunset Horizon",
    medium: "Terracotta, Rose & Gold on Linen",
    dims: "90 × 120 cm (35 × 47 in)",
    price: "$540.00",
    numPrice: 540.00,
    img: "assets/images/artworks/art_golden.jpg",
    desc: "A minimalist meditation on natural landscapes, blending soft terracotta ochres, blush pink horizons, and raw linen canvas textures accented with textured gold leaf."
  },
  melodic: {
    title: "Melodic Swirls & Notes No. 5",
    medium: "Mixed Media, Ink & Gold Splatter",
    dims: "100 × 130 cm (39 × 51 in)",
    price: "$720.00",
    numPrice: 720.00,
    img: "assets/images/artworks/art_melodic.jpg",
    desc: "Inspired by classical violin harmonies, this piece intertwines musical clefs with swirling floral motifs and dynamic gold splatter across a multi-layered textured acrylic foundation."
  }
};

// =========================================================================
// COLLECTOR'S BAG (CART STATE)
// =========================================================================
let collectorBag = [];

try {
  const saved = localStorage.getItem('nadine_collector_bag');
  if (saved) {
    collectorBag = JSON.parse(saved);
  }
} catch (e) {
  collectorBag = [];
}

function saveBag() {
  try {
    localStorage.setItem('nadine_collector_bag', JSON.stringify(collectorBag));
  } catch (e) {}
  updateBagUI();
}

function addToCollection(title, price, img) {
  const existing = collectorBag.find(item => item.title === title);
  if (existing) {
    existing.qty += 1;
  } else {
    collectorBag.push({
      id: Date.now().toString(),
      title: title,
      price: price,
      img: img,
      qty: 1
    });
  }
  saveBag();
  showToast(`"${title}" added to your Collector Bag!`);
  openCart();
}

function updateBagQty(id, delta) {
  const item = collectorBag.find(item => item.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    collectorBag = collectorBag.filter(i => i.id !== id);
  }
  saveBag();
}

function removeFromBag(id) {
  const item = collectorBag.find(i => i.id === id);
  const title = item ? item.title : 'Artwork';
  collectorBag = collectorBag.filter(i => i.id !== id);
  saveBag();
  showToast(`Removed "${title}" from your bag.`);
}

function updateBagUI() {
  const totalQty = collectorBag.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = collectorBag.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const badge = document.getElementById('cartCountBadge');
  if (badge) badge.textContent = totalQty;

  const headerCount = document.getElementById('cartItemCountHeader');
  if (headerCount) headerCount.textContent = totalQty;

  const subtotalElem = document.getElementById('cartSubtotalVal');
  if (subtotalElem) subtotalElem.textContent = `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const listContainer = document.getElementById('cartItemsList');
  if (listContainer) {
    if (collectorBag.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--color-text-subtle);">
          <i class="fa-solid fa-palette" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.4;"></i>
          <p>Your collection bag is empty.</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">Explore available original paintings in our gallery.</p>
        </div>
      `;
    } else {
      listContainer.innerHTML = collectorBag.map(item => `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${item.img}" alt="${item.title}">
          </div>
          <div class="cart-item-info">
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-price">$${(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div class="cart-qty-controls">
              <button class="qty-btn" onclick="updateBagQty('${item.id}', -1)" aria-label="Decrease quantity">-</button>
              <span style="font-size: 0.9rem; font-weight: 600;">${item.qty}</span>
              <button class="qty-btn" onclick="updateBagQty('${item.id}', 1)" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="removeFromBag('${item.id}')" aria-label="Remove artwork">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `).join('');
    }
  }
}

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function proceedToCheckout() {
  if (collectorBag.length === 0) {
    showToast('Your collection bag is currently empty.');
    return;
  }
  const total = collectorBag.reduce((acc, item) => acc + (item.price * item.qty), 0);
  alert(`Thank you for acquiring artwork from Nadine Baghdadi Art Gallery!\n\nInvestment Total: $${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\nOur private concierge will contact you to coordinate insured wooden crate delivery and Certificate of Authenticity registration.`);
  collectorBag = [];
  saveBag();
  closeCart();
}

// =========================================================================
// QUICK VIEW MODAL
// =========================================================================
function openArtworkModal(key) {
  const data = ARTWORKS_DATA[key];
  if (!data) return;

  document.getElementById('modalArtImg').src = data.img;
  document.getElementById('modalArtImg').alt = data.title;
  document.getElementById('modalArtMedium').textContent = data.medium;
  document.getElementById('modalArtTitle').textContent = data.title;
  document.getElementById('modalArtDims').innerHTML = `<i class="fa-regular fa-clone"></i> ${data.dims}`;
  document.getElementById('modalArtPrice').textContent = data.price;
  document.getElementById('modalArtDesc').textContent = data.desc;

  const acquireBtn = document.getElementById('modalAcquireBtn');
  if (acquireBtn) {
    acquireBtn.onclick = function() {
      addToCollection(data.title, data.numPrice, data.img);
      closeArtworkModal();
    };
  }

  const modal = document.getElementById('artworkModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeArtworkModal() {
  const modal = document.getElementById('artworkModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// =========================================================================
// COMMISSION FORM SUBMISSION
// =========================================================================
function handleCommissionSubmit(event) {
  event.preventDefault();
  const btn = document.getElementById('submitCommissionBtn');
  const original = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Submitting your request...</span>';

  const name = document.getElementById('collectorName').value;
  const email = document.getElementById('collectorEmail').value;

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = original;
    showToast(`Thank you, ${name}! Your commission inquiry has been sent to Nadine. We will reach out to ${email} with concept sketches and pricing.`);
    document.getElementById('contactForm').reset();
  }, 1200);
}

// =========================================================================
// TOAST NOTIFICATIONS
// =========================================================================
function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  // Create icon
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-circle-check';
  icon.style.color = 'var(--color-brand-pink-light)';
  icon.style.fontSize = '1.15rem';
  
  // Create message span safely (Anti-XSS)
  const textSpan = document.createElement('span');
  textSpan.textContent = message; // Safe from DOM XSS
  
  toast.appendChild(icon);
  toast.appendChild(textSpan);

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  }, 4000);
}

// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  updateBagUI();

  // Header scroll
  const header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Mobile menu
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(l => {
      l.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Cart Drawer
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');

  if (openCartBtn) openCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Artwork Modal Backdrop
  const artModal = document.getElementById('artworkModal');
  if (artModal) {
    artModal.addEventListener('click', (e) => {
      if (e.target === artModal) closeArtworkModal();
    });
  }

  // Category filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const artworkCards = document.querySelectorAll('.artwork-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');

      artworkCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeArtworkModal();
    }
  });

  // 3D Tilt Effect for Featured Cards
  const tiltCards = document.querySelectorAll('.tilt-effect');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; // max 10 deg
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });

  // ==========================================================================
  // SECURITY & ANTI-COPY MEASURES
  // ==========================================================================
  
  // Disable Right-Click
  document.addEventListener('contextmenu', e => e.preventDefault());
  
  // Disable Text Selection and Image Dragging
  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
      e.preventDefault();
    }
  });
  
  // Disable Copying
  document.addEventListener('copy', e => e.preventDefault());
  
  // Disable Developer Tools Shortcuts (F12, Ctrl+Shift+I, Ctrl+U, etc.)
  document.addEventListener('keydown', e => {
    if (
      e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || // Mac DevTools
      (e.ctrlKey && (e.key === 'U' || e.key === 'C' || e.key === 'S')) ||
      (e.metaKey && (e.key === 'U' || e.key === 'C' || e.key === 'S')) // Mac View Source, Copy, Save
    ) {
      e.preventDefault();
    }
  });

  // Anti-Clickjacking (Frame Buster) - Prevents the site from being embedded in malicious iframes
  if (window.top !== window.self) {
    window.top.location = window.self.location;
  }

});

// Painting video: play only while visible, tap the speaker to toggle sound
document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('paintingVideo');
  const soundBtn = document.getElementById('paintingSoundBtn');
  if (!video) return;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const p = video.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 }).observe(video);
  } else {
    video.play().catch(function () {});
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      video.muted = !video.muted;
      soundBtn.querySelector('i').className = video.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    });
  }
});

// ==========================================================================
// NATIVE MOBILE APP DOCK INITIALIZATION & ACTIVE TAB SYNCHRONIZER
// ==========================================================================
document.addEventListener('DOMContentLoaded', function () {
  let dock = document.querySelector('.mobile-app-dock');
  const path = window.location.pathname.toLowerCase();
  const isAdmin = path.includes('admin');

  if (!dock && !isAdmin) {
    dock = document.createElement('nav');
    dock.className = 'mobile-app-dock';
    dock.setAttribute('aria-label', 'Mobile App Navigation');
    dock.innerHTML = `
      <a href="index.html" class="dock-item" data-page="home">
        <div class="dock-icon-box"><i class="fa-solid fa-house"></i></div>
        <span class="dock-label" data-i18n="nav_home">Home</span>
      </a>
      <a href="gallery.html" class="dock-item" data-page="gallery">
        <div class="dock-icon-box"><i class="fa-solid fa-palette"></i></div>
        <span class="dock-label" data-i18n="nav_gallery">Gallery</span>
      </a>
      <a href="about.html" class="dock-item" data-page="about">
        <div class="dock-icon-box"><i class="fa-solid fa-feather-pointed"></i></div>
        <span class="dock-label" data-i18n="nav_about">About</span>
      </a>
      <a href="contact.html" class="dock-item" data-page="contact">
        <div class="dock-icon-box"><i class="fa-solid fa-paper-plane"></i></div>
        <span class="dock-label" data-i18n="nav_contact">Contact</span>
      </a>
    `;
    document.body.appendChild(dock);
  }

  if (dock) {
    const items = dock.querySelectorAll('.dock-item');
    let activeFound = false;
    items.forEach(item => {
      const page = item.getAttribute('data-page');
      const isMatch = (page === 'gallery' && path.includes('gallery')) ||
                      (page === 'about' && path.includes('about')) ||
                      (page === 'contact' && path.includes('contact')) ||
                      (page === 'home' && (!path.includes('gallery') && !path.includes('about') && !path.includes('contact') && !path.includes('admin')));
      if (isMatch && !activeFound) {
        item.classList.add('active');
        activeFound = true;
      } else {
        item.classList.remove('active');
      }
    });

    if (window.setLanguage && window.currentLang) {
      window.setLanguage(window.currentLang);
    }
  }
});
