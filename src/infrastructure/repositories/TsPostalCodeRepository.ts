import { PostalCode } from '../../domain/models/PostalCode.js';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository.js';
import { PostalCodeData } from '../../types.js';
import * as PROVINCES from '../../data/index.js';

/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 * Provides fast, in-memory searching of postal code information.
 */
export class TsPostalCodeRepository implements PostalCodeRepository {
  private readonly instances: PostalCode[];

  constructor() {
    // Cast PROVINCES to a known structure to ensure type safety during flat()
    const provincesData = PROVINCES as Record<string, PostalCodeData[]>;
    
    // Combine all province data into a single array of domain models
    const allData: PostalCodeData[] = Object.values(provincesData).flat();
    
    this.instances = allData.map(
      (data: PostalCodeData) => new PostalCode(data)
    );
  }

  /**
   * Search for postal codes matching multiple keywords.
   */
  async findByKeywords(keywords: string[]): Promise<PostalCode[]> {
    return this.instances.filter((pc) => pc.matches(keywords));
  }

  /**
   * Search for postal codes matching a specific code.
   */
  async findByCode(code: string): Promise<PostalCode[]> {
    return this.instances.filter((pc) => pc.matchesCode(code));
  }

  /**
   * External fetching is not implemented for the static TS repository.
   */
  async fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]> {
    throw new Error('External fetch not implemented for TS repository');
  }
}
