import { STORE_NAMES, IDB_INDEXES, STORAGE_KEYS, MESSAGE_TYPES, PROGRESS_KEYS } from './constants'
export { STORE_NAMES, STORAGE_KEYS, MESSAGE_TYPES, PROGRESS_KEYS }

const DB_NAME = 'ielts-journey-extension'
const DB_VERSION = 5

export type StoreName = typeof STORE_NAMES[keyof typeof STORE_NAMES]

function createStore(db: IDBDatabase, name: StoreName, indexes: { name: string; key: string }[]): void {
  if (db.objectStoreNames.contains(name)) return
  const store = db.createObjectStore(name, { keyPath: 'id' })
  for (const { name: indexName, key } of indexes) {
    store.createIndex(indexName, key, { unique: false })
  }
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      createStore(db, STORE_NAMES.LEARNING_ENTRIES, [
        { name: IDB_INDEXES.CATEGORY, key: IDB_INDEXES.CATEGORY },
        { name: IDB_INDEXES.CREATED_AT, key: IDB_INDEXES.CREATED_AT },
        { name: IDB_INDEXES.TOPIC, key: IDB_INDEXES.TOPIC },
        { name: IDB_INDEXES.SKILL, key: IDB_INDEXES.SKILL },
        { name: IDB_INDEXES.STATUS, key: IDB_INDEXES.STATUS },
      ])

      createStore(db, STORE_NAMES.VOCABULARY, [
        { name: IDB_INDEXES.WORD, key: IDB_INDEXES.WORD },
        { name: IDB_INDEXES.TOPIC, key: IDB_INDEXES.TOPIC },
        { name: IDB_INDEXES.STATUS, key: IDB_INDEXES.STATUS },
        { name: IDB_INDEXES.CREATED_AT, key: IDB_INDEXES.CREATED_AT },
        { name: IDB_INDEXES.ADDED_TO_REVIEW, key: IDB_INDEXES.ADDED_TO_REVIEW },
      ])

      createStore(db, STORE_NAMES.ARTICLES, [
        { name: IDB_INDEXES.TOPIC, key: IDB_INDEXES.TOPIC },
        { name: IDB_INDEXES.STATUS, key: IDB_INDEXES.STATUS },
        { name: IDB_INDEXES.IS_READING_PRACTICE, key: IDB_INDEXES.IS_READING_PRACTICE },
        { name: IDB_INDEXES.CREATED_AT, key: IDB_INDEXES.CREATED_AT },
      ])

      createStore(db, STORE_NAMES.VIDEOS, [
        { name: IDB_INDEXES.PLATFORM, key: IDB_INDEXES.PLATFORM },
        { name: IDB_INDEXES.TOPIC, key: IDB_INDEXES.TOPIC },
        { name: IDB_INDEXES.STATUS, key: IDB_INDEXES.STATUS },
        { name: IDB_INDEXES.CREATED_AT, key: IDB_INDEXES.CREATED_AT },
      ])

      createStore(db, STORE_NAMES.MISTAKES, [
        { name: IDB_INDEXES.STATUS, key: IDB_INDEXES.STATUS },
        { name: IDB_INDEXES.SKILL, key: IDB_INDEXES.SKILL },
        { name: IDB_INDEXES.TOPIC, key: IDB_INDEXES.TOPIC },
        { name: IDB_INDEXES.CREATED_AT, key: IDB_INDEXES.CREATED_AT },
      ])
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
