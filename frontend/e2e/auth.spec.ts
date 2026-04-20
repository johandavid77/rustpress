import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('login with wrong credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"], input[name="email"]', 'wrong@test.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")')
    await expect(page.locator('text=/error|incorrect|inválid/i')).toBeVisible({ timeout: 5000 })
  })

  test('redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/login/)
  })
})
