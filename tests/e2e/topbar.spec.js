import { expect, test } from '@playwright/test';

test.describe('Topbar', () => {
  test('permite seleccionar un tema desde la barra superior', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.getByRole('button', { name: 'Cambiar estilo de la barra' });
    await expect(themeToggle).toBeVisible();

    await themeToggle.click();

    const dropdown = page.locator('#topbarThemeDropdown');
    await expect(dropdown).toBeVisible();
    await expect(themeToggle).toHaveAttribute('aria-expanded', 'true');

    await dropdown.getByRole('button', { name: 'Verde' }).click();

    const topbar = page.locator('.topbar');
    await expect(topbar).toHaveClass(/topbar-color-emerald/);
  });
});
