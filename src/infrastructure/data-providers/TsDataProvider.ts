import { DataProvider } from '../../domain/repositories/DataProvider.js';
import { PostalCodeData } from '../../types.js';
import { PROVINCE_LOADERS } from '../../data/index.js';

interface CacheEntry {
  data: PostalCodeData[];
  expiry: number;
  lastAccessed: number;
}

/**
 * A DataProvider implementation that loads data from the internal TypeScript files.
 * Optimized with an LRU (Least Recently Used) cache and TTL (Time To Live).
 */
export class TsDataProvider implements DataProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private provinceLoadPromises: Map<string, Promise<PostalCodeData[]>> = new Map();
  
  private readonly ttl: number; // Time to live in milliseconds
  private readonly maxCacheSize: number; // Maximum number of provinces in memory

  constructor(options: { ttl?: number; maxCacheSize?: number } = {}) {
    this.ttl = options.ttl ?? 1000 * 60 * 30; // Default 30 minutes
    this.maxCacheSize = options.maxCacheSize ?? 5; // Default 5 provinces to keep in memory
  }

  /**
   * Cleans up expired entries and ensures cache size is within limits (LRU).
   */
  private maintainCache(): void {
    const now = Date.now();
    
    // 1. Remove expired entries
    for (const [code, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(code);
      }
    }

    // 2. Enforce LRU size limit
    if (this.cache.size > this.maxCacheSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toDelete = this.cache.size - this.maxCacheSize;
      for (let i = 0; i < toDelete; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }
  }

  async getByProvince(provinceCode: string): Promise<PostalCodeData[]> {
    const now = Date.now();
    this.maintainCache();

    // Check Cache
    const cached = this.cache.get(provinceCode);
    if (cached) {
      cached.lastAccessed = now; // Update LRU
      return cached.data;
    }

    // Check Loading Promise
    let loadPromise = this.provinceLoadPromises.get(provinceCode);
    if (!loadPromise) {
      loadPromise = (async () => {
        const loader = PROVINCE_LOADERS[provinceCode];
        if (!loader) return [];

        try {
          const module = await loader();
          const exportKey = Object.keys(module).find(k => k !== 'default');
          if (!exportKey) return [];

          const rawData = module[exportKey] as PostalCodeData[];
          
          this.cache.set(provinceCode, {
            data: rawData,
            expiry: now + this.ttl,
            lastAccessed: now
          });
          
          return rawData;
        } catch (error) {
          return [];
        } finally {
          this.provinceLoadPromises.delete(provinceCode);
        }
      })();
      this.provinceLoadPromises.set(provinceCode, loadPromise);
    }

    return loadPromise;
  }

  async getAll(): Promise<PostalCodeData[]> {
    const codes = Object.keys(PROVINCE_LOADERS);
    const results = await Promise.allSettled(
      codes.map(code => this.getByProvince(code))
    );
    
    return results
      .filter((r): r is PromiseFulfilledResult<PostalCodeData[]> => r.status === 'fulfilled')
      .map(r => r.value)
      .flat();
  }

  clearCache(): void {
    this.cache.clear();
    this.provinceLoadPromises.clear();
  }
}
