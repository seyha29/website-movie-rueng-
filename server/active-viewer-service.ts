/**
 * ActiveViewerService - Real-time tracking of users watching movies
 * 
 * This service uses in-memory storage for high-performance tracking.
 * Optimized for 10,000+ simultaneous users with minimal memory footprint.
 * 
 * How it works:
 * - Frontend sends heartbeat every 5 seconds with userId and movieId
 * - Users are considered "active" if heartbeat received within last 15 seconds
 * - Automatic cleanup runs every 10 seconds to remove stale entries
 * 
 * Integration:
 * - Import and use activeViewerService singleton in routes.ts
 * - Call registerHeartbeat() when POST /api/heartbeat is received
 * - Call getActiveViewers() for GET /api/active-viewers
 */

interface ViewerEntry {
  lastSeen: number;
}

class ActiveViewerService {
  private viewers: Map<string, Map<string, ViewerEntry>> = new Map();
  private readonly INACTIVE_THRESHOLD_MS = 15000;
  private readonly CLEANUP_INTERVAL_MS = 10000;
  private cachedCounts: Map<string, number> = new Map();
  private cacheValid: boolean = false;
  
  constructor() {
    this.startCleanupScheduler();
  }
  
  registerHeartbeat(userId: string, movieId: string): void {
    const now = Date.now();
    
    let movieViewers = this.viewers.get(movieId);
    if (!movieViewers) {
      movieViewers = new Map();
      this.viewers.set(movieId, movieViewers);
    }
    
    movieViewers.set(userId, { lastSeen: now });
    this.cacheValid = false;
  }
  
  removeViewer(userId: string, movieId: string): void {
    const movieViewers = this.viewers.get(movieId);
    if (movieViewers) {
      movieViewers.delete(userId);
      if (movieViewers.size === 0) {
        this.viewers.delete(movieId);
      }
    }
    this.cacheValid = false;
  }
  
  getMovieViewerCount(movieId: string): number {
    const movieViewers = this.viewers.get(movieId);
    if (!movieViewers) return 0;
    
    const now = Date.now();
    let count = 0;
    
    const entries = Array.from(movieViewers.values());
    for (const entry of entries) {
      if (now - entry.lastSeen < this.INACTIVE_THRESHOLD_MS) {
        count++;
      }
    }
    
    return count;
  }
  
  getActiveViewers(): Record<string, number> {
    if (this.cacheValid) {
      const result: Record<string, number> = {};
      this.cachedCounts.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    
    const now = Date.now();
    const counts: Record<string, number> = {};
    
    const movieEntries = Array.from(this.viewers.entries());
    for (const [movieId, movieViewers] of movieEntries) {
      let count = 0;
      const viewerEntries = Array.from(movieViewers.values());
      for (const entry of viewerEntries) {
        if (now - entry.lastSeen < this.INACTIVE_THRESHOLD_MS) {
          count++;
        }
      }
      if (count > 0) {
        counts[movieId] = count;
      }
    }
    
    this.cachedCounts = new Map(Object.entries(counts));
    this.cacheValid = true;
    
    return counts;
  }
  
  getTotalActiveViewers(): number {
    const counts = this.getActiveViewers();
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }
  
  private cleanup(): void {
    const now = Date.now();
    
    const movieEntries = Array.from(this.viewers.entries());
    for (const [movieId, movieViewers] of movieEntries) {
      const userEntries = Array.from(movieViewers.entries());
      for (const [userId, entry] of userEntries) {
        if (now - entry.lastSeen >= this.INACTIVE_THRESHOLD_MS) {
          movieViewers.delete(userId);
        }
      }
      
      if (movieViewers.size === 0) {
        this.viewers.delete(movieId);
      }
    }
    
    this.cacheValid = false;
  }
  
  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }
  
  getStats(): { totalMovies: number; totalViewers: number; memoryEntries: number } {
    let memoryEntries = 0;
    const movieEntries = Array.from(this.viewers.values());
    for (const movieViewers of movieEntries) {
      memoryEntries += movieViewers.size;
    }
    
    return {
      totalMovies: this.viewers.size,
      totalViewers: this.getTotalActiveViewers(),
      memoryEntries
    };
  }
}

export const activeViewerService = new ActiveViewerService();
