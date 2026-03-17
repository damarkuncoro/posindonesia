import { PostalCode } from '../../domain/models/PostalCode';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository';
import { SAMPLE_POSTAL_CODES } from '../../data';

/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
export class TsPostalCodeRepository implements PostalCodeRepository {
  private readonly instances: PostalCode[] = SAMPLE_POSTAL_CODES.map(
    (item) =>
      new PostalCode(
        item.kode,
        item.nama,
        item.provinsi,
        item.kabupaten,
        item.kecamatan,
        item.desa
      )
  );

  async findByKeywords(keywords: string[]): Promise<PostalCode[]> {
    return this.instances.filter((pc) => pc.matches(keywords));
  }

  async fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]> {
    throw new Error('External fetch not implemented for TS repository');
  }
}
