import { createCollection, localOnlyCollectionOptions } from '@tanstack/db'
import type { NotificationRecord, UserRecord, RepoRecord } from '@/db/schema'

// Colección de notificaciones — fuente de verdad local para optimistic updates en /inbox
export const notificationsCollection = createCollection(
  localOnlyCollectionOptions<NotificationRecord, string>({
    id: 'notifications',
    getKey: (n) => n.id,
  })
)

// Colección de usuarios — cache local de perfiles GitHub consultados
export const usersCollection = createCollection(
  localOnlyCollectionOptions<UserRecord, string>({
    id: 'users',
    getKey: (u) => u.login,
  })
)

// Colección de repositorios — cache local para queries derivados (p.ej. filtros, joins)
export const reposCollection = createCollection(
  localOnlyCollectionOptions<RepoRecord, number>({
    id: 'repos',
    getKey: (r) => r.id,
  })
)
