import { PostalCode } from '../../domain/models/PostalCode.js';
import { SearchableRepository, PostalCodeFilter } from '../../domain/repositories/PostalCodeRepository.js';
import { PostalCodeData } from '../../types.js';
import { PROVINCE_LOADERS } from '../../data/index.js';
import Fuse from 'fuse.js';

export interface TsRepoConfig {
  useFuzzy?: boolean;
  fuzzyThreshold?: number;
}

/**
 * Implementation of SearchableRepository using internal TypeScript data.
 * Optimized with Flyweight pattern, dynamic imports, and secondary indexing.
 */
export class TsPostalCodeRepository implements SearchableRepository {
  private provinceCache: Map<string, PostalCodeData[]> = new Map();
  private provinceLoadPromises: Map<string, Promise<PostalCodeData[]>> = new Map();
  private allData: PostalCodeData[] | null = null;
  private allLoadPromise: Promise<PostalCodeData[]> | null = null;
  private postalCodeIndex: Map<string, PostalCodeData[]> = new Map();
  private readonly useFuzzy: boolean;
  private readonly fuzzyThreshold: number;

  constructor(config: TsRepoConfig = {}) {
    this.useFuzzy = config.useFuzzy ?? false;
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.4;
  }

  /**
   * Internal helper to build an index for postal codes.
   */
  private buildIndex(data: PostalCodeData[]): void {
    data.forEach(item => {
      if (!this.postalCodeIndex.has(item.postalCode)) {
        this.postalCodeIndex.set(item.postalCode, []);
      }
      this.postalCodeIndex.get(item.postalCode)!.push(item);
    });
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
          this.buildIndex(rawData);
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
    
    console.log('DEBUG findByKeywords rawData size:', rawData.length, 'provinceCode:', provinceCode);
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
   * Optimized with secondary index for postal codes.
   */
  async findByCode(code: string, provinceCode?: string): Promise<PostalCode[]> {
    const rawData = provinceCode 
      ? await this.loadProvince(provinceCode) 
      : await this.ensureAllLoaded();
    
    // Check index first if searching by a 5-digit numeric string (likely postal code)
    if (/^\d{5}$/.test(code) && this.postalCodeIndex.has(code)) {
      const indexed = this.postalCodeIndex.get(code)!;
      // If provinceCode is provided, filter the indexed results
      const filtered = provinceCode 
        ? indexed.filter(d => d.provinceCode === provinceCode)
        : indexed;
      return filtered.map(data => new PostalCode(data));
    }
    
    const matches = rawData.filter((data) => PostalCode.matchesCode(data, code));
    
    // Flyweight: Instantiate PostalCode only for results
    return matches.map(data => new PostalCode(data));
  }

  /**
   * Search for postal codes matching the given structured filter.
   */
  async findByFilter(filter: PostalCodeFilter, provinceCode?: string): Promise<PostalCode[]> {
    const rawData = provinceCode 
      ? await this.loadProvince(provinceCode) 
      : await this.ensureAllLoaded();
    
    const matches = rawData.filter((data) => {
      if (filter.postalCode && data.postalCode !== filter.postalCode) return false;
      if (filter.province && !data.province.toLowerCase().includes(filter.province.toLowerCase())) return false;
      if (filter.city && !data.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
      if (filter.district && !data.district.toLowerCase().includes(filter.district.toLowerCase())) return false;
      if (filter.village && !data.village.toLowerCase().includes(filter.village.toLowerCase())) return false;
      return true;
    });

    return matches.map(data => new PostalCode(data));
  }

  /**
   * Clear the memory cache.
   */
  clearMemory(): void {
    this.provinceCache.clear();
    this.provinceLoadPromises.clear();
    this.postalCodeIndex.clear();
    this.allData = null;
    this.allLoadPromise = null;
  }
}
