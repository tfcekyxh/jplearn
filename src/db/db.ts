const DB_NAME = 'jplearn'
const DB_VERSION = 2

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains('learned')) {
        db.createObjectStore('learned', { keyPath: 'romaji' })
      }
      if (!db.objectStoreNames.contains('wrong_kana')) {
        db.createObjectStore('wrong_kana', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('wrong_words')) {
        db.createObjectStore('wrong_words', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('quiz_stats')) {
        db.createObjectStore('quiz_stats', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('mnemonics')) {
        db.createObjectStore('mnemonics', { keyPath: 'romaji' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// === 已学假名 ===

export async function markKanaLearned(romaji: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('learned', 'readwrite')
    tx.objectStore('learned').put({ romaji, learnedAt: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getLearnedRomaji(): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('learned', 'readonly')
    const request = tx.objectStore('learned').getAll()
    request.onsuccess = () => resolve(request.result.map((r: { romaji: string }) => r.romaji))
    request.onerror = () => reject(request.error)
  })
}

// === 错题假名 ===

export async function saveWrongKana(romaji: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wrong_kana', 'readwrite')
    tx.objectStore('wrong_kana').add({ romaji, timestamp: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getWrongKana(): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wrong_kana', 'readonly')
    const request = tx.objectStore('wrong_kana').getAll()
    request.onsuccess = () => {
      const romajiSet = new Set(request.result.map((r: { romaji: string }) => r.romaji))
      resolve([...romajiSet])
    }
    request.onerror = () => reject(request.error)
  })
}

// === 错词 ===

export async function saveWrongWord(kana: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wrong_words', 'readwrite')
    tx.objectStore('wrong_words').add({ kana, timestamp: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getWrongWords(): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wrong_words', 'readonly')
    const request = tx.objectStore('wrong_words').getAll()
    request.onsuccess = () => {
      const kanaSet = new Set(request.result.map((r: { kana: string }) => r.kana))
      resolve([...kanaSet])
    }
    request.onerror = () => reject(request.error)
  })
}

// === 测验统计 ===

export async function saveQuizResult(correct: boolean): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('quiz_stats', 'readwrite')
    tx.objectStore('quiz_stats').add({ correct, timestamp: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getQuizStats(): Promise<{ correct: number; total: number }> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('quiz_stats', 'readonly')
    const request = tx.objectStore('quiz_stats').getAll()
    request.onsuccess = () => {
      const results = request.result as { correct: boolean }[]
      const correct = results.filter((r) => r.correct).length
      resolve({ correct, total: results.length })
    }
    request.onerror = () => reject(request.error)
  })
}

// === 速记口诀 ===

export async function saveMnemonic(romaji: string, mnemonic: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mnemonics', 'readwrite')
    tx.objectStore('mnemonics').put({ romaji, mnemonic })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllMnemonics(): Promise<Record<string, string>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mnemonics', 'readonly')
    const request = tx.objectStore('mnemonics').getAll()
    request.onsuccess = () => {
      const result: Record<string, string> = {}
      for (const row of request.result as { romaji: string; mnemonic: string }[]) {
        result[row.romaji] = row.mnemonic
      }
      resolve(result)
    }
    request.onerror = () => reject(request.error)
  })
}
