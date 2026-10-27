import { expect, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export class CartPage extends BasePage {
  readonly lines = this.ui('cart-lines');
  readonly total = this.ui('cart-total');
  readonly checkoutButton = this.page.getByRole('button', { name: 'Checkout' });
  async open() { await this.goto('/cart'); await expect(this.lines).toBeVisible(); }
  lineByTitle(title: string): Locator { return this.lines.getByRole('listitem').filter({ hasText: title }); }
  async removeLine(title: string) {
    await this.lineByTitle(title).getByRole('button', { name: `Remove ${title}` }).click();
    await expect(this.lineByTitle(title)).toHaveCount(0);
  }
}
