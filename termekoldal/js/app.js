import { $, formatPrice, safeStorage, toast } from './utils.js';
import { Cart } from './cart.js';
import { initGallery } from './gallery.js';
import { initSizeSelector } from './sizeSelector.js';
import { initCartView } from './cartView.js';

async function loadProduct() {
  const res = await fetch('data/product.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderInfo(p) {
  document.title = `${p.name} – ${p.brand} webáruház`;
  $('#product-brand').textContent = p.brand;
  $('#product-name').textContent = p.name;
  $('#crumb-name').textContent = p.name;
  $('#product-color').textContent = p.color;
  $('#product-price').textContent = formatPrice(p.price);
  $('#shipping-note').textContent =
    `Szállítás ${formatPrice(p.shipping.fee)}, ${formatPrice(p.shipping.freeAbove)} felett ingyenes. Az ár tartalmazza az áfát.`;
  const full = Math.round(p.rating.value);
  $('#product-rating').innerHTML =
    `<span class="stars" aria-hidden="true">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span> ` +
    `<span>${p.rating.value.toString().replace('.', ',')} / 5 (${p.rating.count} értékelés)</span>`;
  $('#product-short').textContent = p.short;
  $('#product-details').innerHTML = p.details.map(d => `<li>${d}</li>`).join('');
}

function initQuantity(getMax) {
  const input = $('#qty-input');
  const clamp = v => Math.max(1, Math.min(getMax(), Math.floor(Number(v)) || 1));
  document.querySelectorAll('.qty-btn').forEach(b =>
    b.addEventListener('click', () => { input.value = clamp(Number(input.value) + Number(b.dataset.step)); }));
  input.addEventListener('change', () => { input.value = clamp(input.value); });
  return {
    value: () => clamp(input.value),
    refresh: () => { input.max = String(getMax()); input.value = clamp(input.value); },
    reset: () => { input.value = 1; },
  };
}

async function main() {
  let product;
  try {
    product = await loadProduct();
  } catch (err) {
    $('#product').innerHTML = '<p class="error" role="alert">A termékadatok betöltése nem sikerült. Kérjük, frissítsd az oldalt.</p>';
    console.error(err);
    return;
  }

  renderInfo(product);
  initGallery(product.images);

  const cart = new Cart(safeStorage());
  const cartView = initCartView(cart, product.shipping);

  let qty;
  const sizes = initSizeSelector(product, { onChange: () => qty.refresh() });
  qty = initQuantity(() => {
    const s = sizes.selected();
    return Math.min(10, s ? sizes.stockOf(s) : 10);
  });

  $('#buy-form').addEventListener('submit', e => {
    e.preventDefault();
    const size = sizes.selected();
    if (!size) {
      sizes.showError('Kérjük, válassz méretet a kosárba helyezés előtt.');
      return;
    }
    const result = cart.add({
      id: product.id, size, name: `${product.name} – ${product.color}`,
      image: product.images[0].src, price: product.price, stock: sizes.stockOf(size),
    }, qty.value());
    if (result.added === 0) {
      toast(`Ebből a méretből már a teljes elérhető mennyiség a kosaradban van.`);
    } else {
      toast(result.capped
        ? `${result.added} db került a kosárba (${size}) – elérted az elérhető mennyiséget.`
        : `Kosárba téve: ${result.added} db, ${size} méret.`);
      qty.reset();
      cartView.open();
    }
  });
}

main();
