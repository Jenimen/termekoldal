/**
 * Kosár – üzleti logika (DOM-független, ezért egységtesztelhető).
 * Egy tételt a termékazonosító + méret pár azonosít.
 */
export const STORAGE_KEY = 'borostyan.cart.v1';
export const MAX_PER_LINE = 10;

export class Cart {
  /** @param {{getItem:Function,setItem:Function}|null} storage */
  constructor(storage = null) {
    this.storage = storage;
    this.items = [];
    this.listeners = new Set();
    this.load();
  }

  static key(id, size) { return `${id}__${size}`; }

  /** Biztonságos betöltés: hibás vagy hiányzó adat esetén üres kosár. */
  load() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      this.items = Array.isArray(data)
        ? data.filter(i => i && i.id && i.size && Number.isInteger(i.qty) && i.qty > 0 && Number.isFinite(i.price))
        : [];
    } catch {
      this.items = [];
    }
  }

  save() {
    if (!this.storage) return;
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.items)); } catch { /* pl. privát mód – a kosár memóriában működik tovább */ }
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(change) { this.save(); this.listeners.forEach(fn => fn(this, change)); }

  find(id, size) { return this.items.find(i => i.id === id && i.size === size); }

  /** Egy tétel felső korlátja: készlet és soronkénti maximum közül a kisebb. */
  static limit(item) { return Math.min(MAX_PER_LINE, Number.isInteger(item.stock) ? item.stock : MAX_PER_LINE); }

  /**
   * Hozzáadás. Ha ugyanaz a termék és méret már a kosárban van, a mennyiség összeadódik.
   * @returns {{added:number, capped:boolean}}
   */
  add(product, qty = 1) {
    if (!product || !product.id || !product.size) throw new Error('Hiányzó termék vagy méret');
    qty = Math.floor(Number(qty));
    if (!Number.isFinite(qty) || qty < 1) throw new Error('Érvénytelen mennyiség');
    const existing = this.find(product.id, product.size);
    const limit = Cart.limit(product);
    const current = existing ? existing.qty : 0;
    const target = Math.min(limit, current + qty);
    const added = target - current;
    if (added <= 0) return { added: 0, capped: true };
    if (existing) {
      existing.qty = target;
      existing.stock = product.stock;
    } else {
      this.items.push({ id: product.id, size: product.size, name: product.name, image: product.image,
                        price: product.price, stock: product.stock, qty: target });
    }
    this.emit({ type: 'add', id: product.id, size: product.size, added });
    return { added, capped: current + qty > limit };
  }

  setQty(id, size, qty) {
    const item = this.find(id, size);
    if (!item) return;
    qty = Math.floor(Number(qty));
    if (!Number.isFinite(qty)) return;
    if (qty <= 0) return this.remove(id, size);
    item.qty = Math.min(qty, Cart.limit(item));
    this.emit({ type: 'qty', id, size });
  }

  remove(id, size) {
    const before = this.items.length;
    this.items = this.items.filter(i => !(i.id === id && i.size === size));
    if (this.items.length !== before) this.emit({ type: 'remove', id, size });
  }

  clear() { this.items = []; this.emit({ type: 'clear' }); }

  get count() { return this.items.reduce((s, i) => s + i.qty, 0); }
  get subtotal() { return this.items.reduce((s, i) => s + i.qty * i.price, 0); }

  /** Szállítási díj: üres kosárnál 0, a határérték felett ingyenes. */
  shipping(cfg) {
    if (!cfg || this.items.length === 0) return 0;
    return this.subtotal >= cfg.freeAbove ? 0 : cfg.fee;
  }

  total(cfg) { return this.subtotal + this.shipping(cfg); }
}
