/** Segédfüggvények */
const priceFmt = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 });

/** 18990 -> "18 990 Ft" */
export function formatPrice(value) { return priceFmt.format(value); }

/** localStorage, ha elérhető; különben null (pl. letiltott sütik esetén). */
export function safeStorage() {
  try {
    const s = window.localStorage;
    const k = '__test__';
    s.setItem(k, '1'); s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

export function $(sel, root = document) { return root.querySelector(sel); }

let toastTimer;
export function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
