interface OfflineTrack {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  audioBlob: Blob
  coverUrl: string
  downloadedAt: number
}

class OfflineStorage {
  private dbName = "MusicStreamDB"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create tracks store
        if (!db.objectStoreNames.contains("tracks")) {
          const tracksStore = db.createObjectStore("tracks", { keyPath: "id" })
          tracksStore.createIndex("downloadedAt", "downloadedAt", { unique: false })
        }

        // Create playlists store
        if (!db.objectStoreNames.contains("playlists")) {
          db.createObjectStore("playlists", { keyPath: "id" })
        }
      }
    })
  }

  async downloadTrack(track: any, audioUrl: string): Promise<boolean> {
    try {
      console.log("[v0] Starting download for:", track.title)

      // Fetch audio file
      const response = await fetch(audioUrl)
      if (!response.ok) throw new Error("Failed to fetch audio")

      const audioBlob = await response.blob()

      const offlineTrack: OfflineTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        audioBlob,
        coverUrl: track.coverUrl,
        downloadedAt: Date.now(),
      }

      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"))
          return
        }

        const transaction = this.db.transaction(["tracks"], "readwrite")
        const store = transaction.objectStore("tracks")
        const request = store.put(offlineTrack)

        request.onsuccess = () => {
          console.log("[v0] Track downloaded successfully:", track.title)
          resolve(true)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("[v0] Download failed:", error)
      return false
    }
  }

  async getOfflineTrack(trackId: string): Promise<OfflineTrack | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction(["tracks"], "readonly")
      const store = transaction.objectStore("tracks")
      const request = store.get(trackId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllOfflineTracks(): Promise<OfflineTrack[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction(["tracks"], "readonly")
      const store = transaction.objectStore("tracks")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removeOfflineTrack(trackId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = this.db.transaction(["tracks"], "readwrite")
      const store = transaction.objectStore("tracks")
      const request = store.delete(trackId)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  async isTrackDownloaded(trackId: string): Promise<boolean> {
    const track = await this.getOfflineTrack(trackId)
    return track !== null
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    }
    return { used: 0, quota: 0 }
  }
}

export const offlineStorage = new OfflineStorage()
