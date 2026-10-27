import type { Locator, Page } from '@playwright/test';
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  protected ui(name: string): Locator { return this.page.getByTestId(name); }
  async goto(path: string) { await this.page.goto(path); }
}
