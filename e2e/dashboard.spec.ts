import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

const sections = [
  ['My Apps', '/my-apps'], ['CI/CD', '/cicd'], ['Repositories', '/repositories'],
  ['Advisory', '/advisory'], ['Inbox', '/inbox'], ['Issues', '/issues'],
  ['Pull Requests', '/pull-requests'], ['Organizations', '/organizations'],
  ['Following', '/following'], ['Insights', '/insights'],
] as const

declare global {
  interface Window {
    shellProbe: { frames: number; failures: string[]; stop: () => void }
  }
}

async function startProbe(page: Page) {
  await page.evaluate(() => {
    const selectors = ['.main', 'nav', 'button[aria-label="User menu"]']
    const original = selectors.map(selector => document.querySelector(selector))
    let frame = 0
    const probe = { frames: 0, failures: [] as string[], stop: () => cancelAnimationFrame(frame) }
    window.shellProbe = probe
    const sample = () => {
      probe.frames++
      selectors.forEach((selector, index) => {
        const element = document.querySelector(selector)
        let reason = ''
        if (!element || element !== original[index]) reason = 'missing or remounted'
        else {
          const rect = element.getBoundingClientRect()
          if (!rect.width || !rect.height) reason = 'zero size'
          for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor)
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
              reason = 'hidden'
            }
          }
        }
        if (reason && probe.failures.length < 100) probe.failures.push(`${performance.now().toFixed(1)} ${selector}: ${reason}`)
      })
      if (location.pathname === '/login') probe.failures.push('redirected to login')
      frame = requestAnimationFrame(sample)
    }
    sample()
  })
}

async function finishProbe(page: Page) {
  const result = await page.evaluate(() => {
    window.shellProbe.stop()
    return { frames: window.shellProbe.frames, failures: window.shellProbe.failures }
  })
  await test.info().attach('shell-frames.json', { body: JSON.stringify(result), contentType: 'application/json' })
  expect(result.frames).toBeGreaterThan(1)
  expect(result.failures, 'El layout desapareció, se ocultó o se remontó durante la navegación').toEqual([])
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'User menu' }),
    'Sesión ausente o caducada: ejecuta npm run test:e2e:auth').toBeVisible()
  await expect(page.getByRole('radio', { name: 'Dashboard', exact: true })).toBeVisible()
})

for (const slow of [false, true]) {
  test.describe(slow ? 'GitHub con demora' : 'red normal', () => {
    for (const [label, path] of sections) {
      test(`${label} → Dashboard ×5`, async ({ page }) => {
        test.setTimeout(120_000)
        const errors: string[] = []
        page.on('pageerror', error => errors.push(error.message))
        page.on('console', message => {
          if (message.type() === 'error') errors.push(message.text())
        })
        if (slow) await page.route('https://api.github.com/**', async route => {
          await new Promise(resolve => setTimeout(resolve, 1_000))
          await route.continue()
        })
        try {
          for (let iteration = 0; iteration < 5; iteration++) {
            await page.getByRole('radio', { name: label, exact: true }).click()
            await expect(page).toHaveURL(`http://localhost:5173${path}`)
            await expect(page.getByRole('radio', { name: label, exact: true })).toHaveAttribute('aria-checked', 'true')
            await startProbe(page)
            await page.getByRole('radio', { name: 'Dashboard', exact: true }).click()
            await expect(page).toHaveURL('http://localhost:5173/')
            await expect(page.getByRole('radio', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-checked', 'true')
            // Observation window captures transient frames after route completion as well.
            await page.waitForTimeout(slow ? 1_500 : 500)
            await finishProbe(page)
          }
        } finally {
          await test.info().attach('console-errors.json', { body: JSON.stringify(errors), contentType: 'application/json' })
        }
      })
    }
  })
}

test('atrás, adelante y recarga autenticada', async ({ page }) => {
  await page.getByRole('radio', { name: 'Repositories', exact: true }).click()
  await expect(page).toHaveURL('http://localhost:5173/repositories')
  await startProbe(page)
  await page.goBack()
  await expect(page).toHaveURL('http://localhost:5173/')
  await page.goForward()
  await expect(page).toHaveURL('http://localhost:5173/repositories')
  await page.waitForTimeout(500)
  await finishProbe(page)
  await page.reload()
  await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible()
  await expect(page).toHaveURL('http://localhost:5173/repositories')
})
