import { test, expect } from '../../src/fixtures/test-fixtures';
test.describe('Cart @e2e', () => {
  test.beforeEach(async ({ shopApi }) => { await shopApi.clearCart(); });
  test('removes a line from the cart', async ({ cartPage, shopApi }) => {
    await shopApi.addToCart('SKU-100');
    await cartPage.open();
    await cartPage.removeLine('Blue mug');
    await expect(cartPage.total).toHaveText('0.00');
  });
});
