import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'qa@example.com');
  await page.fill('#password', 'secret-pass');
  await page.click('.btn-primary');
  await page.waitForTimeout(2000);
}

function expectedTotal(items) {
  let total = 0;
  for (const i of items) total += i.price * i.qty;
  return total.toFixed(2);
}

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('checkout works', async ({ page }) => {
    await page.goto('http://localhost:3000/products');
    await page.click('.product-card:nth-child(1) .add');
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/cart');
    const items = [{ price: 12.5, qty: 1 }];
    if (await page.locator('.coupon-banner').isVisible()) {
      await page.fill('.coupon-input', 'WELCOME10');
      await page.click('.coupon-apply');
      await page.waitForTimeout(1500);
    }
    try {
      await page.click('text=Checkout');
    } catch (e) {
      await page.click('.checkout-btn');
    }
    await page.waitForTimeout(3000);
    const total = await page.locator('.summary .total').textContent();
    expect(total).toContain(expectedTotal(items));
    await page.click('button >> nth=2');
    await page.waitForSelector('.order-confirmed', { timeout: 15000 });
    expect(await page.locator('.order-confirmed').isVisible()).toBe(true);
  });
});
