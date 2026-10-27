import { test as base, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { ShopApi } from '../api/ShopApi';
type Fixtures = { cartPage: CartPage; shopApi: ShopApi };
export const test = base.extend<Fixtures>({
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  shopApi: async ({ request }, use) => use(new ShopApi(request)),
});
export { expect };
