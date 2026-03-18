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
 * Optimized with Flyweight pattern and dynamic imports for minimal memory footprint.
 */
export class TsPostalCodeRepository implements SearchableRepository {
  private provinceCache: Map<string, PostalCodeData[]> = new Map();
  private provinceLoadPromises: Map<string, Promise<PostalCodeData[]>> = new Map();
  private allData: PostalCodeData[] | null = null;
  private allLoadPromise: Promise<PostalCodeData[]> | null = null;
  private readonly useFuzzy: boolean;
  private readonly fuzzyThreshold: number;

  constructor(config: TsRepoConfig = {}) {
    this.useFuzzy = config.useFuzzy ?? false;
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.4;
  }

  /**
   * Internal helper to load data for a specific province.
   */
  private async loadProvince(code: string): Promise<PostalCodeData[]> {
    if (this.provinceCache.has(code)) {
      return this.provinceCache.get(code)!;
    }

    let loadPromise = this.provinceLoadPromises.get(code);
    if (!loadPromise) {
      loadPromise = (async () => {
        const loader = PROVINCE_LOADERS[code];
        if (!loader) return [];

        try {
          const module = await loader();
          const exportKey = Object.keys(module).find(k => k !== 'default');
          if (!exportKey) return [];

          const rawData = module[exportKey] as PostalCodeData[];
          this.provinceCache.set(code, rawData);
          return rawData;
        } catch (error) {
          return [];
        } finally {
          this.provinceLoadPromises.delete(code);
        }
      })();
      this.provinceLoadPromises.set(code, loadPromise);
    }

    return loadPromise;
  }

  /**
   * Internal helper to load all data.
   */
  private async ensureAllLoaded(): Promise<PostalCodeData[]> {
    if (this.allData !== null) {
      return this.allData;
    }

    if (!this.allLoadPromise) {
      this.allLoadPromise = (async () => {
        const codes = Object.keys(PROVINCE_LOADERS);
        const results = await Promise.allSettled(
          codes.map(code => this.loadProvince(code))
        );
        
        const combinedData = results
          .filter((r): r is PromiseFulfilledResult<PostalCodeData[]> => r.status === 'fulfilled')
          .map(r => r.value)
          .flat();
          
        this.allData = combinedData;
        return combinedData;
      })();
    }

    return this.allLoadPromise;
  }

  /**
   * Search for postal codes matching multiple keywords.
   */
  async findByKeywords(keywords: string[], provinceCode?: string): Promise<PostalCode[]> {
    const rawData = provinceCode 
      ? await this.loadProvince(provinceCode) 
      : await this.ensureAllLoaded();
    
    let matches: PostalCodeData[];

    if (this.useFuzzy) {
      const fuseOptions = {
        keys: ['postalCode', 'province', 'city', 'district', 'village'],
        threshold: this.fuzzyThreshold,
      };
      const fuse = new Fuse(rawData, fuseOptions);
      matches = fuse.search(keywords.join(' ')).map(result => result.item);
    } else {
      matches = rawData.filter((data) => PostalCode.matches(data, keywords));
    }

    // Flyweight: Instantiate PostalCode only for results
    return matches.map(data => new PostalCode(data));
  }

  /**
   * Search for postal codes matching a specific code.
   */
  async findByCode(code: string, provinceCode?: string): Promise<PostalCode[]> {
    const rawData = provinceCode 
      ? await this.loadProvince(provinceCode) 
      : await this.ensureAllLoaded();
    
    const matches = rawData.filter((data) => PostalCode.matchesCode(data, code));
    
    // Flyweight: Instantiate PostalCode only for results
    return matches.map(data => new PostalCode(data));
  }

  /**
   * Clear the memory cache.
   */
  clearMemory(): void {
    this.provinceCache.clear();
    this.provinceLoadPromises.clear();
    this.allData = null;
    this.allLoadPromise = null;
  }
}
