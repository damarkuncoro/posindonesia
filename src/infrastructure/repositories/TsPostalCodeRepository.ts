import { PostalCode } from '../../domain/models/PostalCode.js';
import { SearchableRepository, PostalCodeFilter } from '../../domain/repositories/PostalCodeRepository.js';
import { PostalCodeData } from '../../types.js';
import { DataProvider } from '../../domain/repositories/DataProvider.js';
import { TsDataProvider } from '../data-providers/TsDataProvider.js';
import Fuse from 'fuse.js';

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
}

/**
 * Implementation of SearchableRepository.
 * Optimized with Flyweight pattern, dynamic imports, and secondary indexing.
 */
export class TsPostalCodeRepository implements SearchableRepository {
  private allData: PostalCodeData[] | null = null;
  private allLoadPromise: Promise<PostalCodeData[]> | null = null;
  private postalCodeIndex: Map<string, PostalCodeData[]> = new Map();
  private invertedIndex: Map<string, number[]> = new Map();
  private allDataArray: PostalCodeData[] = [];
  private readonly useFuzzy: boolean;
  private readonly fuzzyThreshold: number;
  private readonly dataProvider: DataProvider;

  constructor(config: TsRepoConfig = {}) {
    this.useFuzzy = config.useFuzzy ?? false;
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.4;
    this.dataProvider = config.dataProvider ?? new TsDataProvider();
  }

  /**
   * Internal helper to build an index for postal codes and inverted index for text search.
   */
  private buildIndex(data: PostalCodeData[]): void {
    const startIndex = this.allDataArray.length;
    
    data.forEach((item, idx) => {
      const globalIdx = startIndex + idx;
      this.allDataArray.push(item);

      // Postal Code Index
      if (!this.postalCodeIndex.has(item.postalCode)) {
        this.postalCodeIndex.set(item.postalCode, []);
      }
      this.postalCodeIndex.get(item.postalCode)!.push(item);

      // Inverted Index for text search
      const text = `${item.province} ${item.city} ${item.district} ${item.village}`.toLowerCase();
      const tokens = text.split(/[\s,.-]+/).filter(t => t.length > 0);
      
      // Use a Set to avoid duplicate tokens for the same document
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, []);
        }
        this.invertedIndex.get(token)!.push(globalIdx);
      });
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
      // Use Inverted Index for standard search
      const lowerKeywords = keywords.map(k => k.toLowerCase());
      const resultIndices = new Set<number>();

      if (lowerKeywords.length > 0) {
        const firstKeyword = lowerKeywords[0];
        const initialDocs = this.invertedIndex.get(firstKeyword) || [];
        initialDocs.forEach(idx => resultIndices.add(idx));

        for (let i = 1; i < lowerKeywords.length; i++) {
          const keyword = lowerKeywords[i];
          const docsForKeyword = new Set(this.invertedIndex.get(keyword) || []);
          resultIndices.forEach(idx => {
            if (!docsForKeyword.has(idx)) {
              resultIndices.delete(idx);
            }
          });
        }
      }
      
      const finalIndices = Array.from(resultIndices);
      matches = finalIndices.map(idx => this.allDataArray[idx]);

      // If provinceCode is provided, we need to filter the results from the global index
      if (provinceCode) {
        matches = matches.filter(m => m.provinceCode === provinceCode);
      }
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
    this.postalCodeIndex.clear();
    this.invertedIndex.clear();
    this.allData = null;
    this.allDataArray = [];
    this.allLoadPromise = null;
    if (this.dataProvider instanceof TsDataProvider) {
      this.dataProvider.clearCache();
    }
  }
}
