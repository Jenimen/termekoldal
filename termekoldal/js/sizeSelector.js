import { $ } from './utils.js';

const LOW_STOCK = 3;

/**
 * Méretválasztó: rádiógomb-csoport (natív billentyűzetkezelés),
 * elfogyott méretek letiltva, alacsony készlet jelzése, mérettáblázat.
 */
export function initSizeSelector(product, { onChange } = {}) {
  const wrap = $('#size-options');
  const fieldset = $('#size-fieldset');
  const stockEl = $('#size-stock');
  const errorEl = $('#size-error');

  wrap.innerHTML = '';
  product.sizes.forEach(s => {
    const label = document.createElement('label');
    label.className = 'size-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'size';
    input.value = s.code;
    input.disabled = s.stock <= 0;
    const span = document.createElement('span');
    span.textContent = s.code;
    if (s.stock <= 0) {
      const sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = ' – elfogyott';
      label.append(input, span, sr);
      label.title = 'Ez a méret jelenleg elfogyott';
    } else {
      label.append(input, span);
    }
    wrap.append(label);
  });

  wrap.addEventListener('change', () => {
    const size = selected();
    clearError();
    const s = product.sizes.find(x => x.code === size);
    if (s.stock <= LOW_STOCK) {
      stockEl.textContent = `Utolsó darabok: csak ${s.stock} db van raktáron ebből a méretből.`;
      stockEl.classList.add('low');
    } else {
      stockEl.textContent = 'Raktáron, 1–3 munkanapon belül szállítjuk.';
      stockEl.classList.remove('low');
    }
    highlightChartRow(size);
    onChange?.(s);
  });

  function selected() {
    const el = wrap.querySelector('input[name="size"]:checked');
    return el ? el.value : null;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    fieldset.classList.add('invalid');
    const first = wrap.querySelector('input:not(:disabled)');
    first?.focus();
  }
  function clearError() { errorEl.textContent = ''; fieldset.classList.remove('invalid'); }

  // --- Mérettáblázat ---
  const dlg = $('#size-guide');
  const table = $('#size-table');
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>${product.sizeChart.columns.map(c => `<th scope="col">${c}</th>`).join('')}</tr>`;
  const tbody = document.createElement('tbody');
  product.sizeChart.rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.size = r[0];
    tr.innerHTML = r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join('');
    tbody.append(tr);
  });
  table.append(thead, tbody);
  $('#size-fit').textContent = product.sizeChart.fit;
  $('#size-model').textContent = product.sizeChart.model;

  function highlightChartRow(size) {
    tbody.querySelectorAll('tr').forEach(tr => tr.classList.toggle('selected', tr.dataset.size === size));
  }
  $('#size-guide-open').addEventListener('click', () => dlg.showModal());
  $('#size-guide-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // kattintás a háttérre

  return { selected, showError, clearError, stockOf: code => product.sizes.find(s => s.code === code)?.stock ?? 0 };
}
