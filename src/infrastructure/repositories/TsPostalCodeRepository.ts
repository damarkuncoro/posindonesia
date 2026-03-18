import { PostalCode } from '../../domain/models/PostalCode.js';
import { SearchableRepository } from '../../domain/repositories/PostalCodeRepository.js';
import { PostalCodeData } from '../../types.js';
import { PROVINCE_LOADERS, PROVINCE_ALIAS_MAP } from '../../data/index.js';
import Fuse from 'fuse.js';

export interface TsRepoConfig {
  useFuzzy?: boolean;
  fuzzyThreshold?: number;
}

/**
 * Implementation of SearchableRepository using internal TypeScript data.
 * Optimized with True Dynamic Imports and per-province caching.
 */
export class TsPostalCodeRepository implements SearchableRepository {
  private provinceCache: Map<string, PostalCode[]> = new Map();
  private allInstances: PostalCode[] | null = null;
  private readonly useFuzzy: boolean;
  private readonly fuzzyThreshold: number;

  constructor(config: TsRepoConfig = {}) {
    this.useFuzzy = config.useFuzzy ?? false;
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.4;
  }

  /**
   * Internal helper to load data for a specific province.
   */
  private async loadProvince(code: string): Promise<PostalCode[]> {
    if (this.provinceCache.has(code)) {
      return this.provinceCache.get(code)!;
    }

    const loader = PROVINCE_LOADERS[code];
    if (!loader) return [];

    try {
      const module = await loader();
      // Find the exported array (it matches the key in ALIAS_MAP usually)
      const exportKey = Object.keys(module).find(k => k !== 'default');
      if (!exportKey) return [];

      const rawData = module[exportKey] as PostalCodeData[];
      const instances = rawData.map(d => new PostalCode(d));
      
      this.provinceCache.set(code, instances);
      return instances;
    } catch (error) {
      return [];
    }
  }

  /**
   * Internal helper to load all data.
   */
  private async ensureAllLoaded(): Promise<PostalCode[]> {
    if (this.allInstances === null) {
      const loadPromises = Object.keys(PROVINCE_LOADERS).map(code => this.loadProvince(code));
      const results = await Promise.all(loadPromises);
      this.allInstances = results.flat();
    }
    return this.allInstances;
  }

  /**
   * Search for postal codes matching multiple keywords.
   */
  async findByKeywords(keywords: string[], provinceCode?: string): Promise<PostalCode[]> {
    let data: PostalCode[];
    
    if (provinceCode) {
      data = await this.loadProvince(provinceCode);
    } else {
      data = await this.ensureAllLoaded();
    }
    
    if (this.useFuzzy) {
      const fuseOptions = {
        keys: ['postalCode', 'province', 'city', 'district', 'village'],
        threshold: this.fuzzyThreshold,
      };
      const fuse = new Fuse(data, fuseOptions);
      return fuse.search(keywords.join(' ')).map(result => result.item);
    }

    return data.filter((pc) => pc.matches(keywords));
  }

  /**
   * Search for postal codes matching a specific code.
   */
  async findByCode(code: string, provinceCode?: string): Promise<PostalCode[]> {
    let data: PostalCode[];
    
    if (provinceCode) {
      data = await this.loadProvince(provinceCode);
    } else {
      data = await this.ensureAllLoaded();
    }
    
    return data.filter((pc) => pc.matchesCode(code));
  }

  /**
   * Clear the memory cache.
   */
  clearMemory(): void {
    this.provinceCache.clear();
    this.allInstances = null;
  }
}
