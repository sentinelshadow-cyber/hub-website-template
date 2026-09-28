// Shadow Cloud — small interactive touches
document.addEventListener('DOMContentLoaded', () => {
  // Animate the active-servers stat on the homepage
  const el = document.getElementById('stat-servers');
  if (el) {
    const target = 1247;
    let cur = 0;
    const step = () => {
      cur += Math.ceil((target - cur) / 12);
      if (cur >= target) cur = target;
      el.textContent = cur.toLocaleString();
      if (cur < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const t = document.querySelector(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
      }
    });
  });
});
