// Végponttól végpontig (E2E) tartó tesztek – Playwright
import { test, expect } from '@playwright/test';

const norm = s => s.replace(/\s/g, ' ');          // a Ft-összegekben nem törhető szóköz van
const size = (page, code) => page.locator(`label.size-option:has(input[value="${code}"])`);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#gallery-thumbs button')).toHaveCount(5);
});

test.describe('Termékadatok', () => {
  test('TC-01 A termék neve, ára és szállítási információja megjelenik', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Merino kötött pulóver');
    expect(norm(await page.locator('#product-price').innerText())).toBe('18 990 Ft');
    await expect(page.locator('#shipping-note')).toContainText('felett ingyenes');
  });
});

test.describe('Képnézegető', () => {
  test('TC-02 Következő és előző gomb lapoz, a számláló frissül', async ({ page }) => {
    await page.click('#gallery-next');
    await expect(page.locator('#gallery-counter')).toHaveText('2 / 5');
    await expect(page.locator('#gallery-main')).toHaveAttribute('src', /hatul/);
    await page.click('#gallery-prev');
    await expect(page.locator('#gallery-counter')).toHaveText('1 / 5');
  });

  test('TC-03 Körbeérő lapozás az első képről visszafelé', async ({ page }) => {
    await page.click('#gallery-prev');
    await expect(page.locator('#gallery-counter')).toHaveText('5 / 5');
  });

  test('TC-04 Bélyegképre kattintva a fő kép és a kijelölés változik', async ({ page }) => {
    await page.locator('#gallery-thumbs button').nth(3).click();
    await expect(page.locator('#gallery-main')).toHaveAttribute('src', /kotes/);
    await expect(page.locator('#gallery-thumbs button').nth(3)).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#gallery-thumbs button').nth(0)).toHaveAttribute('aria-current', 'false');
  });

  test('TC-05 Billentyűzetes lapozás nyilakkal', async ({ page }) => {
    await page.locator('#gallery-stage').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#gallery-counter')).toHaveText('3 / 5');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#gallery-counter')).toHaveText('2 / 5');
  });

  test('TC-06 Elhúzással (swipe) lapozás', async ({ page }) => {
    const box = await page.locator('#gallery-stage').boundingBox();
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, y, { steps: 5 });
    await page.mouse.move(box.x + box.width * 0.2, y, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('#gallery-counter')).toHaveText('2 / 5');
    await expect(page.locator('#lightbox')).not.toHaveAttribute('open', '');
  });

  test('TC-07 Nagyítás megnyitása és bezárása (gomb és Esc)', async ({ page }) => {
    await page.click('#gallery-zoom');
    await expect(page.locator('#lightbox')).toBeVisible();
    await expect(page.locator('#lightbox-img')).toHaveAttribute('src', /elol/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toBeHidden();
    await page.click('#gallery-zoom');
    await page.click('#lightbox-close');
    await expect(page.locator('#lightbox')).toBeHidden();
  });

  test('TC-08 Minden képnek van alternatív szövege', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await expect(page.locator('#gallery-main')).not.toHaveAttribute('alt', '');
      await page.click('#gallery-next');
    }
  });
});

test.describe('Méretválasztó', () => {
  test('TC-09 Elfogyott méretek nem választhatók', async ({ page }) => {
    await expect(page.locator('input[value="XS"]')).toBeDisabled();
    await expect(page.locator('input[value="XXL"]')).toBeDisabled();
    await expect(page.locator('input[value="M"]')).toBeEnabled();
  });

  test('TC-10 Méret nélkül nem lehet kosárba tenni, hibaüzenet jelenik meg', async ({ page }) => {
    await page.click('#add-to-cart');
    await expect(page.locator('#size-error')).toHaveText(/válassz méretet/);
    await expect(page.locator('#cart-count')).toHaveText('0');
    await expect(page.locator('#cart-drawer')).toBeHidden();
  });

  test('TC-11 Méret kiválasztásakor a hibaüzenet eltűnik, készletinfo jelenik meg', async ({ page }) => {
    await page.click('#add-to-cart');
    await size(page, 'M').click();
    await expect(page.locator('#size-error')).toHaveText('');
    await expect(page.locator('#size-stock')).toContainText('Raktáron');
  });

  test('TC-12 Alacsony készlet figyelmeztetés (L méret, 2 db)', async ({ page }) => {
    await size(page, 'L').click();
    await expect(page.locator('#size-stock')).toContainText('csak 2 db');
    await expect(page.locator('#size-stock')).toHaveClass(/low/);
  });

  test('TC-13 Mérettáblázat megnyitása, a kiválasztott méret sora kiemelve', async ({ page }) => {
    await size(page, 'XL').click();
    await page.click('#size-guide-open');
    await expect(page.locator('#size-guide')).toBeVisible();
    await expect(page.locator('#size-table tbody tr')).toHaveCount(6);
    await expect(page.locator('#size-table tr[data-size="XL"]')).toHaveClass(/selected/);
    await page.click('#size-guide-close');
    await expect(page.locator('#size-guide')).toBeHidden();
  });

  test('TC-14 Mennyiség nem állítható a készlet fölé', async ({ page }) => {
    await size(page, 'L').click();
    const plus = page.locator('.qty-btn[data-step="1"]');
    await plus.click(); await plus.click(); await plus.click();
    await expect(page.locator('#qty-input')).toHaveValue('2');
  });
});

test.describe('Kosár', () => {
  test('TC-15 Kosárba helyezés: a panel megnyílik, a számláló és az összegek helyesek', async ({ page }) => {
    await size(page, 'M').click();
    await page.click('#add-to-cart');
    await expect(page.locator('#cart-drawer')).toBeVisible();
    await expect(page.locator('#cart-count')).toHaveText('1');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item .meta')).toContainText('M');
    expect(norm(await page.locator('#cart-subtotal').innerText())).toBe('18 990 Ft');
    expect(norm(await page.locator('#cart-total').innerText())).toBe('20 480 Ft');
  });

  test('TC-16 Ugyanaz a méret kétszer: egy sor, összeadott mennyiség', async ({ page }) => {
    await size(page, 'M').click();
    await page.click('#add-to-cart');
    await page.click('#cart-close');
    await page.click('#add-to-cart');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item output')).toHaveText('2');
    await expect(page.locator('#cart-count')).toHaveText('2');
  });

  test('TC-17 Két különböző méret két külön tétel', async ({ page }) => {
    await size(page, 'M').click();
    await page.click('#add-to-cart');
    await page.click('#cart-close');
    await size(page, 'S').click();
    await page.click('#add-to-cart');
    await expect(page.locator('.cart-item')).toHaveCount(2);
  });

  test('TC-18 Mennyiség növelése a kosárban; 25 000 Ft felett ingyenes szállítás', async ({ page }) => {
    await size(page, 'M').click();
    await page.click('#add-to-cart');
    await page.click('.cart-item button[data-action="inc"]');
    await expect(page.locator('.cart-item output')).toHaveText('2');
    expect(norm(await page.locator('#cart-subtotal').innerText())).toBe('37 980 Ft');
    await expect(page.locator('#cart-shipping')).toHaveText('Ingyenes');
    expect(norm(await page.locator('#cart-total').innerText())).toBe('37 980 Ft');
  });

  test('TC-19 Tétel törlése után üres kosár üzenet', async ({ page }) => {
    await size(page, 'M').click();
    await page.click('#add-to-cart');
    await page.click('.cart-item button[data-action="remove"]');
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.locator('#cart-empty')).toBeVisible();
    await expect(page.locator('#cart-count')).toHaveText('0');
  });

  test('TC-20 Készlethatár a kosárban: a + gomb letiltva (L méret, 2 db)', async ({ page }) => {
    await size(page, 'L').click();
    await page.click('#add-to-cart');
    await page.click('.cart-item button[data-action="inc"]');
    await expect(page.locator('.cart-item output')).toHaveText('2');
    await expect(page.locator('.cart-item button[data-action="inc"]')).toBeDisabled();
  });

  test('TC-21 A kosár tartalma az oldal újratöltése után megmarad', async ({ page }) => {
    await size(page, 'XL').click();
    await page.click('#add-to-cart');
    await page.reload();
    await expect(page.locator('#cart-count')).toHaveText('1');
    await page.click('#cart-open');
    await expect(page.locator('.cart-item .meta')).toContainText('XL');
  });

  test('TC-22 Kosár bezárása Esc billentyűvel, a fókusz visszakerül', async ({ page }) => {
    await page.click('#cart-open');
    await expect(page.locator('#cart-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#cart-drawer')).toBeHidden();
    await expect(page.locator('#cart-open')).toBeFocused();
  });

  test('TC-23 A pénztár gomb jelzi, hogy a fizetés nem része a demónak', async ({ page }) => {
    await size(page, 'M').click();
    await page.click('#add-to-cart');
    await page.click('#checkout');
    await expect(page.locator('#checkout-note')).toContainText('nem része');
  });
});

test.describe('Reszponzivitás és akadálymentesség', () => {
  for (const width of [360, 768, 1280, 1920]) {
    test(`TC-24 Nincs vízszintes görgetés ${width} px szélességen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('TC-25 Teljes vásárlói folyamat csak billentyűzettel', async ({ page }) => {
    await page.locator('input[value="S"]').focus();
    await page.keyboard.press('ArrowRight');           // rádiócsoport: S -> M
    await expect(page.locator('input[value="M"]')).toBeChecked();
    await page.locator('#add-to-cart').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#cart-drawer')).toBeVisible();
    await expect(page.locator('#cart-close')).toBeFocused();
  });

  test('TC-26 Nincs JavaScript-hiba az oldal betöltésekor', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.reload();
    await expect(page.locator('#gallery-thumbs button')).toHaveCount(5);
    expect(errors).toEqual([]);
  });
});
