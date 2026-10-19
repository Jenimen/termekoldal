// Egységtesztek a kosár üzleti logikájára (Node.js beépített tesztfuttató: node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cart, STORAGE_KEY, MAX_PER_LINE } from '../../js/cart.js';

class MemoryStorage {
  constructor(init = {}) { this.data = { ...init }; }
  getItem(k) { return k in this.data ? this.data[k] : null; }
  setItem(k, v) { this.data[k] = String(v); }
}
const shipping = { fee: 1490, freeAbove: 25000 };
const item = (size = 'M', stock = 12) => ({ id: 'P1', size, name: 'Pulóver', image: 'x.svg', price: 18990, stock });

test('UT-01 Új tétel hozzáadása', () => {
  const c = new Cart();
  const r = c.add(item(), 1);
  assert.equal(r.added, 1);
  assert.equal(c.items.length, 1);
  assert.equal(c.count, 1);
});

test('UT-02 Azonos termék és méret összevonása egy sorba', () => {
  const c = new Cart();
  c.add(item('M'), 1); c.add(item('M'), 2);
  assert.equal(c.items.length, 1);
  assert.equal(c.items[0].qty, 3);
});

test('UT-03 Eltérő méret külön tételként jelenik meg', () => {
  const c = new Cart();
  c.add(item('M'), 1); c.add(item('L', 2), 1);
  assert.equal(c.items.length, 2);
  assert.equal(c.count, 2);
});

test('UT-04 A mennyiség nem lépheti túl a készletet', () => {
  const c = new Cart();
  const r = c.add(item('L', 2), 5);
  assert.equal(c.items[0].qty, 2);
  assert.equal(r.capped, true);
  assert.equal(c.add(item('L', 2), 1).added, 0);
});

test('UT-05 Soronkénti maximum (10 db) nagy készletnél is érvényes', () => {
  const c = new Cart();
  c.add(item('M', 50), 25);
  assert.equal(c.items[0].qty, MAX_PER_LINE);
});

test('UT-06 Érvénytelen bemenet hibát dob (hiányzó méret, 0 db)', () => {
  const c = new Cart();
  assert.throws(() => c.add({ ...item(), size: null }, 1));
  assert.throws(() => c.add(item(), 0));
  assert.equal(c.count, 0);
});

test('UT-07 Mennyiség módosítása és 0-ra állítás = törlés', () => {
  const c = new Cart();
  c.add(item(), 2);
  c.setQty('P1', 'M', 4);
  assert.equal(c.items[0].qty, 4);
  c.setQty('P1', 'M', 0);
  assert.equal(c.items.length, 0);
});

test('UT-08 Részösszeg, szállítási díj és végösszeg számítása', () => {
  const c = new Cart();
  assert.equal(c.shipping(shipping), 0, 'üres kosárnál nincs szállítási díj');
  c.add(item(), 1);
  assert.equal(c.subtotal, 18990);
  assert.equal(c.shipping(shipping), 1490);
  assert.equal(c.total(shipping), 20480);
  c.setQty('P1', 'M', 2);
  assert.equal(c.subtotal, 37980);
  assert.equal(c.shipping(shipping), 0, '25 000 Ft felett ingyenes');
  assert.equal(c.total(shipping), 37980);
});

test('UT-09 Mentés és visszatöltés tárolóból', () => {
  const s = new MemoryStorage();
  const c1 = new Cart(s);
  c1.add(item('S', 4), 2);
  const c2 = new Cart(s);
  assert.equal(c2.count, 2);
  assert.equal(c2.items[0].size, 'S');
});

test('UT-10 Sérült tárolt adat esetén üres kosár, nincs hiba', () => {
  const s = new MemoryStorage({ [STORAGE_KEY]: '{nem json' });
  const c = new Cart(s);
  assert.equal(c.count, 0);
  const s2 = new MemoryStorage({ [STORAGE_KEY]: JSON.stringify([{ id: 'P1', size: 'M', qty: -3, price: 1 }, null]) });
  assert.equal(new Cart(s2).count, 0);
});

test('UT-11 Változásfigyelő értesítést kap', () => {
  const c = new Cart();
  const events = [];
  c.onChange((_, ch) => events.push(ch.type));
  c.add(item(), 1); c.setQty('P1', 'M', 2); c.remove('P1', 'M');
  assert.deepEqual(events, ['add', 'qty', 'remove']);
});
