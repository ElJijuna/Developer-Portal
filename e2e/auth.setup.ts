import { mkdir } from 'node:fs/promises'
import { test, expect } from '@playwright/test'

test('inicio manual con GitHub y sesión reutilizable', async ({ page, context, browser }) => {
  await page.goto('/login')
  const githubUser = page.waitForResponse(response =>
    response.url() === 'https://api.github.com/user' && response.status() === 200,
    { timeout: 540_000 },
  )
  const popup = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Connect', exact: true }).click()
  await popup
  console.log('Completa GitHub/2FA en Chromium. La sesión se guardará al llegar al dashboard.')
  await githubUser
  await expect(page).toHaveURL('http://localhost:5173/', { timeout: 540_000 })
  await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible()
  await mkdir('playwright/.auth', { recursive: true })
  const state = await context.storageState({ indexedDB: true })
  const restored = await browser.newContext({ storageState: state })
  try {
    const restoredPage = await restored.newPage()
    await restoredPage.goto('http://localhost:5173/')
    await expect(restoredPage.getByRole('button', { name: 'User menu' })).toBeVisible()
    await expect(restoredPage).toHaveURL('http://localhost:5173/')
    await context.storageState({ path: 'playwright/.auth/user.json', indexedDB: true })
  } finally {
    await restored.close()
  }
})
