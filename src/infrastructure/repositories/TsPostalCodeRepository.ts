import { PostalCode } from '../../domain/models/PostalCode.js';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository.js';
import { PostalCodeData } from '../../types.js';
import * as PROVINCES from '../../data/index.js';

/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 * Optimized with Lazy Loading to save memory.
 */
export class TsPostalCodeRepository implements PostalCodeRepository {
  private instances: PostalCode[] | null = null;

  constructor() {
    // We don't initialize instances in constructor anymore (Lazy Loading)
  }

  /**
   * Internal helper to load data only when needed.
   */
  private ensureDataLoaded(): PostalCode[] {
    if (this.instances === null) {
      const provincesData = PROVINCES as Record<string, PostalCodeData[]>;
      
      // Combine all province data into a single array of domain models
      const allData: PostalCodeData[] = Object.values(provincesData).flat();
      
      this.instances = allData.map(
        (data: PostalCodeData) => new PostalCode(data)
      );
    }
    return this.instances;
  }

  /**
   * Search for postal codes matching multiple keywords.
   */
  async findByKeywords(keywords: string[]): Promise<PostalCode[]> {
    const data = this.ensureDataLoaded();
    return data.filter((pc) => pc.matches(keywords));
  }

  /**
   * Search for postal codes matching a specific code.
   */
  async findByCode(code: string): Promise<PostalCode[]> {
    const data = this.ensureDataLoaded();
    return data.filter((pc) => pc.matchesCode(code));
  }

  /**
   * External fetching is not implemented for the static TS repository.
   */
  async fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]> {
    throw new Error('External fetch not implemented for TS repository');
  }

  /**
   * Clear the memory (optional, useful for testing or memory-constrained environments).
   */
  clearMemory(): void {
    this.instances = null;
  }
}
