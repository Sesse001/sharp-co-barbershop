// ===== MOBILE NAV TOGGLE =====
function toggleNav() {
  const nav = document.getElementById('nav');
  if (nav) nav.classList.toggle('open');
}

// Close mobile nav when a link is clicked
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const nav = document.getElementById('nav');
      if (nav) nav.classList.remove('open');
    });
  });

  // ===== PROMO MODAL =====
  const modal = document.getElementById('promoModal');
  if (modal) {
    const seen = sessionStorage.getItem('promoSeen');
    if (!seen) {
      setTimeout(() => {
        modal.classList.add('active');
        sessionStorage.setItem('promoSeen', 'true');
      }, 5000);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }
});

// ===== CLOSE MODAL =====
function closeModal() {
  const modal = document.getElementById('promoModal');
  if (modal) modal.classList.remove('active');
}

// ===== SMOOTH SCROLL (anchor links) =====
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      // Skip if empty, just "#", or a full URL
      if (!href || href === '#' || href.length < 2 || href.includes('://')) return;
      // Skip if it contains characters that break CSS selectors
      if (href.includes('?') || href.includes('&')) return;

      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        // Silently ignore invalid selectors
      }
    });
  });
});