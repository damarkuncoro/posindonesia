import { PostalCode } from '../../domain/models/PostalCode.js';
import { SearchableRepository, PostalCodeFilter } from '../../domain/repositories/PostalCodeRepository.js';
import { PostalCodeData } from '../../types.js';
import { DataProvider } from '../../domain/repositories/DataProvider.js';
import { TsDataProvider } from '../data-providers/TsDataProvider.js';
import { SearchStrategy } from '../../domain/services/SearchStrategy.js';
import { InvertedIndexStrategy } from '../../domain/services/InvertedIndexStrategy.js';
import { FuzzySearchStrategy } from '../../domain/services/FuzzySearchStrategy.js';

/**
 * Configuration for the TsPostalCodeRepository.
 */
export interface TsRepoConfig {
  /**
   * If true, enables fuzzy search mode using Fuse.js.
   * @default false
   */
  useFuzzy?: boolean;
  /**
   * The threshold for fuzzy search sensitivity (0.0 to 1.0).
   * Lower values are more strict.
   * @default 0.4
   */
  fuzzyThreshold?: number;
  /**
   * Optional custom data provider. Defaults to internal TsDataProvider.
   */
  dataProvider?: DataProvider;
  /**
   * Optional custom search strategy. Defaults to InvertedIndexStrategy.
   */
  searchStrategy?: SearchStrategy;
}

/**
 * Implementation of SearchableRepository.
 * Optimized with Flyweight pattern, dynamic imports, and secondary indexing.
 */
export class TsPostalCodeRepository implements SearchableRepository {
  private allData: PostalCodeData[] | null = null;
  private allLoadPromise: Promise<PostalCodeData[]> | null = null;
  private postalCodeIndex: Map<string, PostalCodeData[]> = new Map();
  private readonly useFuzzy: boolean;
  private readonly fuzzyThreshold: number;
  private readonly dataProvider: DataProvider;
  private searchStrategy: SearchStrategy | null = null;

  constructor(config: TsRepoConfig = {}) {
    this.useFuzzy = config.useFuzzy ?? false;
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.4;
    this.dataProvider = config.dataProvider ?? new TsDataProvider();
    this.searchStrategy = config.searchStrategy ?? null;
  }

  /**
   * Internal helper to build an index for postal codes.
   */
  private buildIndex(data: PostalCodeData[]): void {
    data.forEach(item => {
      // Postal Code Index
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
    const data = await this.dataProvider.getByProvince(code);
    this.buildIndex(data);
    return data;
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
        const combinedData = await this.dataProvider.getAll();
        this.buildIndex(combinedData);
        this.allData = combinedData;
        return combinedData;
      })();
    }

    return this.allLoadPromise;
  }

  /**
   * Internal helper to ensure search strategy is initialized.
   */
  private async ensureSearchStrategy(data: PostalCodeData[]): Promise<SearchStrategy> {
    if (!this.searchStrategy) {
      this.searchStrategy = this.useFuzzy 
        ? new FuzzySearchStrategy() 
        : new InvertedIndexStrategy(data);
    }
    return this.searchStrategy;
  }

  /**
   * Search for postal codes matching multiple keywords.
   */
  async findByKeywords(keywords: string[], provinceCode?: string): Promise<PostalCode[]> {
    const rawData = provinceCode 
      ? await this.loadProvince(provinceCode) 
      : await this.ensureAllLoaded();
    
    const strategy = await this.ensureSearchStrategy(rawData);
    const matches = await strategy.search(rawData, keywords, {
      threshold: this.fuzzyThreshold,
      provinceCode: provinceCode
    });

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
    this.postalCodeIndex.clear();
    this.allData = null;
    this.allLoadPromise = null;
    this.searchStrategy = null;
    if (this.dataProvider instanceof TsDataProvider) {
      this.dataProvider.clearCache();
    }
  }
}
