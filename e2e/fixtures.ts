import { access } from 'node:fs/promises'
import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  storageState: async ({}, use) => {
    const path = 'playwright/.auth/user.json'
    try {
      await access(path)
    } catch {
      throw new Error('Falta la sesión local. Ejecuta npm run test:e2e:auth y completa GitHub/2FA en Chromium.')
    }
    await use(path)
  },
})

export { expect }
