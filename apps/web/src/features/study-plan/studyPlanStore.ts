import type { StudyPlanData } from './studyPlanService'

const STORE_KEY = 'study-plan'
const TABLE_NAME = 'contentMeta'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ielts-journey')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePlanToIndexedDB(plan: StudyPlanData): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(TABLE_NAME, 'readwrite')
    const store = tx.objectStore(TABLE_NAME)
    store.put({
      id: STORE_KEY,
      packId: STORE_KEY,
      packName: 'Study Plan',
      packVersion: 1,
      contentCount: 1,
      seededAt: plan.generatedAt,
      updatedAt: new Date().toISOString(),
      planData: JSON.stringify(plan),
    })
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  } catch (err) {
    console.warn('[studyPlanStore] Failed to save plan to IndexedDB, falling back to localStorage:', err)
    try {
      localStorage.setItem('ielts-study-plan', JSON.stringify(plan))
    } catch { /* ignore */ }
  }
}

export async function loadPlanFromIndexedDB(): Promise<StudyPlanData | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(TABLE_NAME, 'readonly')
    const store = tx.objectStore(TABLE_NAME)
    const result = await new Promise<unknown>((resolve, reject) => {
      const req = store.get(STORE_KEY)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()

    if (result && typeof result === 'object') {
      const record = result as Record<string, unknown>
      if (typeof record.planData === 'string') {
        return JSON.parse(record.planData) as StudyPlanData
      }
    }
    return null
  } catch {
    try {
      const raw = localStorage.getItem('ielts-study-plan')
      if (raw) return JSON.parse(raw) as StudyPlanData
    } catch { /* ignore */ }
    return null
  }
}
