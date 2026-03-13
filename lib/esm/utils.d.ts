import { PostalCodeResult } from './parser';
/**
 * Formats a raw numerical code into standard Indonesian administrative format (PP.KK.CC.DD).
 * @param code - The raw code (e.g., 1101012001)
 * @returns The formatted code (e.g., 11.01.01.2001)
 */
export declare function formatCode(code: string): string;
/**
 * Finds the best match in a list of search results using Fuzzy Matching.
 * @param results - The list of parsed results
 * @param villageName - The target village name
 * @param districtName - The target district name
 * @returns The best matching object or null
 */
export declare function findBestMatch(results: PostalCodeResult[], villageName: string, districtName: string): PostalCodeResult | null;
//# sourceMappingURL=utils.d.ts.map