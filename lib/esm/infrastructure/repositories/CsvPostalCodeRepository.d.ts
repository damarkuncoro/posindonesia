import { PostalCode } from '../../domain/models/PostalCode';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository';
/**
 * Implementation of PostalCodeRepository using CSV files with streaming.
 */
export declare class CsvPostalCodeRepository implements PostalCodeRepository {
    private readonly filePath;
    constructor(filePath: string);
    findByKeywords(keywords: string[]): Promise<PostalCode[]>;
    fetchExternal(_villageName: string, _cookie?: string): Promise<PostalCode[]>;
}
//# sourceMappingURL=CsvPostalCodeRepository.d.ts.map