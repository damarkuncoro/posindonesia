import Fuse from 'fuse.js';
import { RawPostalCode } from '../../infrastructure/parsers/HtmlParser';

/**
 * Domain service to find the best matching postal code from search results.
 */
export class PostalCodeMatcher {
  /**
   * Finds the best match in a list of search results using Fuzzy Matching.
   */
  static findBestMatch(
    results: RawPostalCode[], 
    villageName: string, 
    districtName: string
  ): RawPostalCode | null {
    if (!results || results.length === 0) return null;

    // 1. Try Exact Match First
    const exactMatch = results.find(r => 
        r.desa_kelurahan.toLowerCase() === villageName.toLowerCase() &&
        r.kecamatan.toLowerCase() === districtName.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // 2. Fuzzy Match using Fuse.js
    const fuseOptions = {
        keys: [
            { name: 'desa_kelurahan', weight: 0.7 },
            { name: 'kecamatan', weight: 0.3 }
        ],
        threshold: 0.5, // Loosened from 0.4
        includeScore: true
    };

    const fuse = new Fuse(results, fuseOptions);
    let fuzzyResults = fuse.search(`${villageName} ${districtName}`);

    if (fuzzyResults.length > 0) {
        return fuzzyResults[0].item;
    }

    // 2.5 Try searching only by village name if combined failed
    fuzzyResults = fuse.search(villageName);
    if (fuzzyResults.length > 0) {
        return fuzzyResults[0].item;
    }

    // 3. Fallback to simple contains logic
    return results.find(r => 
        (r.desa_kelurahan.toLowerCase().includes(villageName.toLowerCase()) || 
         villageName.toLowerCase().includes(r.desa_kelurahan.toLowerCase())) &&
        (r.kecamatan.toLowerCase().includes(districtName.toLowerCase()) || 
         districtName.toLowerCase().includes(r.kecamatan.toLowerCase()))
    ) || results[0];
  }
}
