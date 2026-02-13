import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  // Recording...
await page.goto('https://danogo-admin.dev.teko.vn/');

await page.getByRole('cell', { name: 'ADA, qUSDT, qUSDC, qADA, qIUSD, qDJED, DJED, iUSD, USDC, USDT...' }).click();
await page.locator('.mantine-Modal-overlay').click();
await page.getByRole('button', { name: 'Add Market' }).click();

await page.locator('.mantine-Modal-overlay').click();
await page.getByRole('cell', { name: 'ADA', exact: true }).nth(3).click();
await expect(page.locator('#mantine-g8szv5kwp-body')).toMatchAriaSnapshot(`- paragraph: /ADA Market - 5bc5\\.\\.\\.\\d+/`);
await expect(page.getByRole('textbox', { name: 'Power Base' })).toBeVisible();
await page.locator('.mantine-Modal-overlay').click();
await page.locator('.mantine-Modal-overlay').click();
});
