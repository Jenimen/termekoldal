import { $, formatPrice } from './utils.js';
import { Cart } from './cart.js';

/** Kosár panel (oldalsó fiók) megjelenítése és kezelése. */
export function initCartView(cart, shippingCfg) {
  const drawer = $('#cart-drawer');
  const backdrop = $('#drawer-backdrop');
  const list = $('#cart-items');
  const empty = $('#cart-empty');
  const foot = $('#cart-foot');
  const countEl = $('#cart-count');
  const openBtn = $('#cart-open');
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    drawer.hidden = false; backdrop.hidden = false;
    document.body.classList.add('no-scroll');
    $('#cart-close').focus();
  }
  function close() {
    drawer.hidden = true; backdrop.hidden = true;
    document.body.classList.remove('no-scroll');
    $('#checkout-note').textContent = '';
    (lastFocus || openBtn).focus();
  }
  openBtn.addEventListener('click', open);
  $('#cart-close').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  drawer.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') trapFocus(e);
  });
  function trapFocus(e) {
    const f = [...drawer.querySelectorAll('button:not(:disabled), [href], input, [tabindex]:not([tabindex="-1"])')];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  $('#checkout').addEventListener('click', () => {
    $('#checkout-note').textContent = 'Demó oldal: a pénztár (fizetés) nem része a projekt hatókörének.';
  });

  // Eseménydelegálás a tételek gombjaira
  list.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const li = btn.closest('li');
    const { id, size } = li.dataset;
    const item = cart.find(id, size);
    if (!item) return;
    const action = btn.dataset.action;
    if (action === 'inc') cart.setQty(id, size, item.qty + 1);
    if (action === 'dec') cart.setQty(id, size, item.qty - 1);
    if (action === 'remove') cart.remove(id, size);
    // fókusz megtartása az újrarajzolás után
    const again = list.querySelector(`li[data-id="${id}"][data-size="${size}"] button[data-action="${action}"]`);
    (again && !again.disabled ? again : $('#cart-close')).focus();
  });

  function render() {
    const n = cart.count;
    countEl.textContent = String(n);
    countEl.setAttribute('aria-label', `${n} termék a kosárban`);
    empty.hidden = n > 0;
    foot.hidden = n === 0;
    list.innerHTML = '';
    cart.items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.dataset.id = item.id; li.dataset.size = item.size;
      const max = Cart.limit(item);
      li.innerHTML = `
        <img src="${item.image}" alt="" width="72" height="90">
        <div>
          <h3>${item.name}</h3>
          <p class="meta">Méret: <strong>${item.size}</strong></p>
          <div class="stepper" role="group" aria-label="Mennyiség: ${item.name}, ${item.size}">
            <button type="button" data-action="dec" aria-label="Eggyel kevesebb">−</button>
            <output aria-live="polite">${item.qty}</output>
            <button type="button" data-action="inc" aria-label="Eggyel több" ${item.qty >= max ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="link-button remove" data-action="remove">Törlés</button>
        </div>
        <div>
          <p class="line-total">${formatPrice(item.qty * item.price)}</p>
          <p class="unit">${formatPrice(item.price)} / db</p>
        </div>`;
      list.append(li);
    });
    const sub = cart.subtotal;
    const ship = cart.shipping(shippingCfg);
    $('#cart-subtotal').textContent = formatPrice(sub);
    $('#cart-shipping').textContent = ship === 0 ? 'Ingyenes' : formatPrice(ship);
    $('#cart-total').textContent = formatPrice(cart.total(shippingCfg));
    const missing = shippingCfg.freeAbove - sub;
    const pct = Math.min(100, Math.round((sub / shippingCfg.freeAbove) * 100));
    $('#free-ship').innerHTML = missing > 0
      ? `Még <strong>${formatPrice(missing)}</strong> és ingyenes a szállítás.<span class="bar" aria-hidden="true"><span style="width:${pct}%"></span></span>`
      : 'A szállítás ingyenes. <span class="bar" aria-hidden="true"><span style="width:100%"></span></span>';
  }

  cart.onChange((_, change) => {
    render();
    if (change.type === 'add') {
      countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
    }
  });
  // Másik böngészőfülön végzett módosítás szinkronizálása
  window.addEventListener('storage', e => { if (e.key && e.key.startsWith('borostyan.cart')) { cart.load(); render(); } });
  render();
  return { open, close, render };
}
