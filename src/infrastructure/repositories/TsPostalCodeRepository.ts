import { PostalCode } from '../../domain/models/PostalCode.js';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository.js';
import { PostalCodeData } from '../../types.js';
import { PROVINCE_MAP } from '../../data/index.js';
import Fuse from 'fuse.js';

export interface TsRepoConfig {
  useFuzzy?: boolean;
  fuzzyThreshold?: number;
}

/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 * Optimized with True Dynamic Imports for minimal memory footprint.
 */
export class TsPostalCodeRepository implements PostalCodeRepository {
  private instances: PostalCode[] | null = null;
  private readonly useFuzzy: boolean;
  private readonly fuzzyThreshold: number;

  constructor(config: TsRepoConfig = {}) {
    this.useFuzzy = config.useFuzzy ?? false;
    this.fuzzyThreshold = config.fuzzyThreshold ?? 0.4;
  }

  /**
   * Internal helper to load data only when needed using dynamic imports.
   */
  private async ensureDataLoaded(provinceCode?: string): Promise<PostalCode[]> {
    // If a specific province is requested, we can load just that one
    if (provinceCode) {
      const entry = Object.entries(PROVINCE_MAP).find(([key]) => key.startsWith(provinceCode) || PROVINCE_MAP[key].startsWith(provinceCode));
      if (entry) {
        const [key, fileName] = entry;
        const module = await import(`../../data/${fileName}`);
        const data = module[key] as PostalCodeData[];
        return data.map(d => new PostalCode(d)); 
      }
    }

    if (this.instances === null) {
      const allData: PostalCodeData[] = [];
      
      // Load all province files dynamically
      // Note: This is still loading all data, but only when a search is actually performed.
      // For even better performance, we could search per-province file, but that's more complex.
      const loadPromises = Object.entries(PROVINCE_MAP).map(async ([key, fileName]) => {
        const module = await import(`../../data/${fileName}`);
        const data = module[key] as PostalCodeData[];
        return data;
      });

      const results = await Promise.all(loadPromises);
      const combinedData = results.flat();
      
      this.instances = combinedData.map(
        (data: PostalCodeData) => new PostalCode(data)
      );
    }
    return this.instances;
  }

  /**
   * Search for postal codes matching multiple keywords.
   */
  async findByKeywords(keywords: string[], provinceCode?: string): Promise<PostalCode[]> {
    const data = await this.ensureDataLoaded(provinceCode);
    
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
  async findByCode(code: string): Promise<PostalCode[]> {
    const data = await this.ensureDataLoaded();
    return data.filter((pc) => pc.matchesCode(code));
  }

  /**
   * External fetching is not implemented for the static TS repository.
   */
  async fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]> {
    throw new Error('External fetch not implemented for TS repository');
  }

  /**
   * Clear the memory.
   */
  clearMemory(): void {
    this.instances = null;
  }
}
