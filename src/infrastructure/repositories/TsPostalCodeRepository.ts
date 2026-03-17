import { PostalCode } from '../../domain/models/PostalCode';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository';
import * as PROVINCES from '../../data/index';

/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
export class TsPostalCodeRepository implements PostalCodeRepository {
  private readonly instances: PostalCode[];

  constructor() {
    // Gabungkan semua data provinsi menjadi satu array
    const allData = Object.values(PROVINCES).flat();
    
    this.instances = allData.map(
      (item) =>
        new PostalCode(
          item.postalCode,
          item.village,
          item.province,
          item.city,
          item.district,
          item.village
        )
    );
  }

  async findByKeywords(keywords: string[]): Promise<PostalCode[]> {
    return this.instances.filter((pc) => pc.matches(keywords));
  }

  async fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]> {
    throw new Error('External fetch not implemented for TS repository');
  }
}
