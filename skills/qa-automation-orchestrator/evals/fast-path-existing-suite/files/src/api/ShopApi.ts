import type { APIRequestContext } from '@playwright/test';
/** Thin client used by e2e tests to seed and clean state through the API. */
export class ShopApi {
  constructor(private readonly request: APIRequestContext) {}
  addToCart(sku: string, qty = 1) { return this.request.post('/api/cart', { data: { sku, qty } }); }
  clearCart() { return this.request.delete('/api/cart'); }
  createCoupon(code: string, percent: number) { return this.request.post('/api/admin/coupons', { data: { code, percent } }); }
}
