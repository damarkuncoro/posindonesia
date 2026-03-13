import Fuse from 'fuse.js';
import { PostalCodeResult } from './parser';

/**
 * Formats a raw numerical code into standard Indonesian administrative format (PP.KK.CC.DD).
 * @param code - The raw code (e.g., 1101012001)
 * @returns The formatted code (e.g., 11.01.01.2001)
 */
export function formatCode(code: string): string {
    if (!code) return '';
    const cleanCode = code.replace(/\./g, '');
    const p1 = cleanCode.substring(0, 2);
    const p2 = cleanCode.substring(2, 4);
    const p3 = cleanCode.substring(4, 6);
    const p4 = cleanCode.substring(6);
    return [p1, p2, p3, p4].filter(Boolean).join('.');
}

/**
 * Finds the best match in a list of search results using Fuzzy Matching.
 * @param results - The list of parsed results
 * @param villageName - The target village name
 * @param districtName - The target district name
 * @returns The best matching object or null
 */
export function findBestMatch(
    results: PostalCodeResult[], 
    villageName: string, 
    districtName: string
): PostalCodeResult | null {
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
        threshold: 0.4, // Adjust for strictness (0.0 perfect, 1.0 match anything)
        includeScore: true
    };

    const fuse = new Fuse(results, fuseOptions);
    const fuzzyResults = fuse.search(`${villageName} ${districtName}`);

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
