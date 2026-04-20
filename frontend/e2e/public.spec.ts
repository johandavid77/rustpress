import { test, expect } from '@playwright/test'

test.describe('Sitio público', () => {
  test('homepage carga', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('tienda carga y muestra productos', async ({ page }) => {
    await page.goto('/shop')
    await expect(page.locator('body')).toBeVisible()
    // Esperar que carguen productos o mensaje vacío
    await page.waitForTimeout(2000)
    const hasProducts = await page.locator('[data-testid="product"], .product-card, article').count()
    const hasEmpty    = await page.locator('text=/sin productos|no hay|empty/i').count()
    expect(hasProducts + hasEmpty).toBeGreaterThan(0)
  })

  test('página 404 muestra mensaje', async ({ page }) => {
    await page.goto('/ruta-que-no-existe-xyz')
    const has404 = await page.locator('text=/404|no encontrada|not found/i').count()
    expect(has404).toBeGreaterThan(0)
  })

  test('navegación a blog', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.locator('body')).toBeVisible()
  })
})
