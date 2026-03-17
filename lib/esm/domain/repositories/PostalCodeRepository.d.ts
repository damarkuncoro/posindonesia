import { PostalCode } from '../models/PostalCode';
export interface PostalCodeRepository {
    /**
     * Finds postal codes matching the given keywords.
     */
    findByKeywords(keywords: string[]): Promise<PostalCode[]>;
    /**
     * Fetches the latest postal code data from an external source (e.g., website).
     */
    fetchExternal(villageName: string, cookie?: string): Promise<PostalCode[]>;
}
//# sourceMappingURL=PostalCodeRepository.d.ts.map