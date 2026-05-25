import { openDB } from 'idb'

export const db = openDB('developer-portal', 1, {
  upgrade(db) {
    db.createObjectStore('query-cache')
  },
})
