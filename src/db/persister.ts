import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { db } from '@/db/idb'

export const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => (await db).get('query-cache', key) ?? null,
    setItem: async (key, value) => { await (await db).put('query-cache', value, key) },
    removeItem: async (key) => { await (await db).delete('query-cache', key) },
  },
})
