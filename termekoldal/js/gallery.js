import { $ } from './utils.js';

/**
 * Képnézegető: fő kép, előző/következő gomb, bélyegképek, billentyűzet,
 * érintéses lapozás (elhúzás) és nagyítás (lightbox, egér/ujj követésével).
 */
export function initGallery(images) {
  const stage = $('#gallery-stage');
  const main = $('#gallery-main');
  const counter = $('#gallery-counter');
  const thumbs = $('#gallery-thumbs');
  const lightbox = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbStage = $('#lightbox-stage');
  let index = 0;

  // Bélyegképek létrehozása
  thumbs.innerHTML = '';
  images.forEach((img, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.index = String(i);
    btn.setAttribute('aria-label', `${i + 1}. kép: ${img.alt}`);
    const t = document.createElement('img');
    t.src = img.src; t.alt = ''; t.width = 160; t.height = 200; t.loading = 'lazy';
    btn.append(t);
    btn.addEventListener('click', () => show(i));
    li.append(btn);
    thumbs.append(li);
  });

  function show(i) {
    const n = images.length;
    index = ((i % n) + n) % n;            // körbeérő lapozás
    const img = images[index];
    main.classList.add('fading');
    main.src = img.src;
    main.alt = img.alt;
    main.dataset.index = String(index);
    counter.textContent = `${index + 1} / ${n}`;
    thumbs.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-current', j === index ? 'true' : 'false'));
    if (lightbox.open) { lbImg.src = img.src; lbImg.alt = img.alt; }
  }
  main.addEventListener('load', () => main.classList.remove('fading'));

  $('#gallery-prev').addEventListener('click', e => { e.stopPropagation(); show(index - 1); });
  $('#gallery-next').addEventListener('click', e => { e.stopPropagation(); show(index + 1); });
  $('#gallery-zoom').addEventListener('click', e => { e.stopPropagation(); openZoom(); });

  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      if (e.target === stage) { e.preventDefault(); openZoom(); }
    }
  });

  // Érintéses / egeres elhúzás (Pointer Events): 40 px felett lapoz, alatta kattintásnak számít.
  let startX = null, startY = null, moved = false;
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    startX = e.clientX; startY = e.clientY; moved = false;
  });
  stage.addEventListener('pointermove', e => {
    if (startX !== null && Math.abs(e.clientX - startX) > 10) moved = true;
  });
  stage.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (!moved && !e.target.closest('button')) openZoom();
  });
  stage.addEventListener('pointercancel', () => { startX = null; });

  // Nagyítás
  function openZoom() {
    lbImg.src = images[index].src;
    lbImg.alt = images[index].alt;
    lbImg.style.transformOrigin = '50% 50%';
    lightbox.showModal();
    document.body.classList.add('no-scroll');
  }
  function closeZoom() { if (lightbox.open) lightbox.close(); }
  lightbox.addEventListener('close', () => { document.body.classList.remove('no-scroll'); stage.focus(); });
  $('#lightbox-close').addEventListener('click', closeZoom);
  lbStage.addEventListener('click', closeZoom);
  lbStage.addEventListener('pointermove', e => {
    const r = lbStage.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    lbImg.style.transformOrigin = `${x}% ${y}%`;
  });
  lightbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  show(0);
  return { show, get index() { return index; } };
}
