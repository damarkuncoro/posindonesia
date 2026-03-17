import { PostalCode } from '../../domain/models/PostalCode';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository';
/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
export declare class TsPostalCodeRepository implements PostalCodeRepository {
    private readonly instances;
    constructor();
    findByKeywords(keywords: string[]): Promise<PostalCode[]>;
    findByCode(code: string): Promise<PostalCode[]>;
    fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]>;
}
//# sourceMappingURL=TsPostalCodeRepository.d.ts.map