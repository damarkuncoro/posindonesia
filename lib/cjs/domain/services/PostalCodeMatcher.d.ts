import { RawPostalCode } from '../../infrastructure/parsers/HtmlParser';
/**
 * Domain service to find the best matching postal code from search results.
 */
export declare class PostalCodeMatcher {
    /**
     * Finds the best match in a list of search results using Fuzzy Matching.
     */
    static findBestMatch(results: RawPostalCode[], villageName: string, districtName: string): RawPostalCode | null;
}
//# sourceMappingURL=PostalCodeMatcher.d.ts.map