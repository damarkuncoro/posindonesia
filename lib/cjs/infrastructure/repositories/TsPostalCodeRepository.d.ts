import { PostalCode } from '../../domain/models/PostalCode';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository';
/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
export declare class TsPostalCodeRepository implements PostalCodeRepository {
    private readonly instances;
    findByKeywords(keywords: string[]): Promise<PostalCode[]>;
    fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]>;
}
//# sourceMappingURL=TsPostalCodeRepository.d.ts.map