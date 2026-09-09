import type { CDPSession, Page } from '@playwright/test'
import { test, expect } from './fixtures'

// AdaptiveLayout's actual breakpoints (see @gnome-ui/hooks' useBreakpoint):
// mobile <480px (bottom nav), tablet 480-1023px (sidebar), desktop >=1024px.

// Portrait phone, notch + home indicator top/bottom (mobile bottom-nav layout).
const PORTRAIT_INSETS = { top: 59, bottom: 34, left: 0, right: 0 }
const PORTRAIT_VIEWPORT = { width: 390, height: 844 }

// Any current iPhone rotated to landscape crosses into the 480-1023px tablet
// band, switching to the sidebar layout. In landscape the notch/Dynamic Island
// sits on one side edge and the home indicator strip stays along the bottom.
const LANDSCAPE_INSETS = { top: 0, bottom: 21, left: 59, right: 0 }
const LANDSCAPE_VIEWPORT = { width: 844, height: 390 }

async function emulateInstalledPwa(page: Page, cdp: CDPSession, insets: typeof PORTRAIT_INSETS) {
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'display-mode', value: 'standalone' }],
  })
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets })
}

test.describe('Safe areas al correr como PWA instalada (standalone)', () => {
  test('la barra inferior respeta el home indicator en el layout móvil', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Emulation.setSafeAreaInsetsOverride es un comando CDP, solo existe en Chromium')

    const cdp = await context.newCDPSession(page)
    await emulateInstalledPwa(page, cdp, PORTRAIT_INSETS)
    await page.setViewportSize(PORTRAIT_VIEWPORT)
    await page.goto('/')

    // The mobile layout has no header bar: the page background runs edge to
    // edge under the top safe area, but the page content and the floating
    // user menu are both pushed below it (status bar / Dynamic Island).
    const header = page.getByRole('button', { name: 'User menu' })
    await expect(header).toBeVisible()

    const dashboardTab = page.getByRole('radio', { name: 'Dashboard', exact: true })
    await expect(dashboardTab).toBeVisible()
    const tabBox = await dashboardTab.boundingBox()
    const clearanceBelow = PORTRAIT_VIEWPORT.height - (tabBox!.y + tabBox!.height)
    expect(clearanceBelow).toBeGreaterThanOrEqual(PORTRAIT_INSETS.bottom)
  })

  test('el sidebar no queda bajo el notch lateral ni el home indicator en landscape', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Emulation.setSafeAreaInsetsOverride es un comando CDP, solo existe en Chromium')

    const cdp = await context.newCDPSession(page)
    await emulateInstalledPwa(page, cdp, LANDSCAPE_INSETS)
    await page.setViewportSize(LANDSCAPE_VIEWPORT)
    await page.goto('/')

    // Collapsed sidebar items are icon-only radios with no accessible name;
    // the first one in DOM order is the root-level "Dashboard" entry.
    const dashboardTab = page.getByRole('radio').first()
    await expect(dashboardTab).toBeVisible()
    const tabBox = await dashboardTab.boundingBox()
    expect(tabBox!.x).toBeGreaterThanOrEqual(LANDSCAPE_INSETS.left)

    const updateControl = page.getByRole('button', { name: 'Check for updates' })
    await expect(updateControl).toBeVisible()
    const updateBox = await updateControl.boundingBox()
    const clearanceBelow = LANDSCAPE_VIEWPORT.height - (updateBox!.y + updateBox!.height)
    expect(clearanceBelow).toBeGreaterThanOrEqual(LANDSCAPE_INSETS.bottom)
  })
})
