import { PostalCode } from '../../domain/models/PostalCode';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository';
/**
 * Use case to search for postal codes.
 */
export declare class SearchPostalCode {
    private readonly repository;
    constructor(repository: PostalCodeRepository);
    /**
     * Execute the search with keywords.
     */
    execute(keywords: string[]): Promise<PostalCode[]>;
}
//# sourceMappingURL=SearchPostalCode.d.ts.map