import { TsPostalCodeRepository, TsRepoConfig } from './infrastructure/repositories/TsPostalCodeRepository.js';
import { SearchPostalCode } from './application/use-cases/SearchPostalCode.js';
import { PostalCode } from './domain/models/PostalCode.js';
import { PostalCodeFilter } from './domain/repositories/PostalCodeRepository.js';

// Re-export core components
export * from './domain/models/PostalCode.js';
export { 
  type SearchableRepository, 
  type ScrapableRepository, 
  type PostalCodeRepository,
  type PostalCodeFilter 
} from './domain/repositories/PostalCodeRepository.js';
export * from './domain/services/PostalCodeMatcher.js';
export * from './domain/services/Logger.js';
export * from './domain/errors/PostalCodeError.js';
export * from './application/use-cases/SearchPostalCode.js';
export { TsPostalCodeRepository, type TsRepoConfig };
export { TsDataProvider } from './infrastructure/data-providers/TsDataProvider.js';
export * from './types.js';

import { PROVINCE_ALIAS_MAP } from './data/index.js';

/**
 * Global helper for quick postal code searching without manual instantiation.
 * Uses the internal TypeScript database with caching.
 */
let globalStandardRepo: TsPostalCodeRepository | null = null;
let globalFuzzyRepo: TsPostalCodeRepository | null = null;

export interface SearchOptions {
  province?: string;
  provinceCode?: string;
  useFuzzy?: boolean;
}

/**
 * Searches for postal codes based on various criteria.
 * This is the primary, recommended function for all search operations.
 * 
 * @example
 * // Search by keywords
 * await search(['Gambir', 'Jakarta Pusat']);
 * 
 * @example
 * // Fuzzy search for a typo
 * await search('Gmbir', { useFuzzy: true });
 * 
 * @example
 * // Structured search for a specific village and city
 * await search({ village: 'Gambir', city: 'Jakarta Pusat' });
 * 
 * @example
 * // Search within a specific province by name (more intuitive)
 * await search('Bandung', { province: 'Jawa Barat' });
 *
 * @param keywords - A search term, an array of terms, or a structured filter object.
 * @param options - Configuration for the search, such as province filter or fuzzy mode.
 * @returns A promise that resolves to an array of `PostalCode` instances.
 */
export async function search(
  keywords: string | string[] | PostalCodeFilter, 
  options: SearchOptions = {}
): Promise<PostalCode[]> {
  const isFuzzy = !!options.useFuzzy;
  let repo: TsPostalCodeRepository;

  if (isFuzzy) {
    if (!globalFuzzyRepo) {
      globalFuzzyRepo = new TsPostalCodeRepository({ useFuzzy: true });
    }
    repo = globalFuzzyRepo;
  } else {
    if (!globalStandardRepo) {
      globalStandardRepo = new TsPostalCodeRepository({ useFuzzy: false });
    }
    repo = globalStandardRepo;
  }
  
  const useCase = new SearchPostalCode(repo);

  // Resolve province name to code
  let resolvedProvinceCode = options.provinceCode;
  if (options.province && !resolvedProvinceCode) {
    const upperProvince = options.province.toUpperCase().replace(/\s+/g, '_');
    resolvedProvinceCode = PROVINCE_ALIAS_MAP[upperProvince];
  }

  if (typeof keywords === 'object' && !Array.isArray(keywords)) {
    return useCase.executeByFilter(keywords, resolvedProvinceCode);
  }

  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];

  return useCase.execute(keywordArray, resolvedProvinceCode);
}

/**
 * A quick-access helper to find postal codes by a specific code.
 * This is optimized for searching by a 5-digit postal code or administrative codes.
 * 
 * @example
 * // Find by postal code
 * await searchByCode('10110');
 * 
 * @example
 * // Find by village code within a specific province
 * await searchByCode('3171010001', { province: 'DKI Jakarta' });
 *
 * @param code - The code to search for (e.g., '10110').
 * @param options - Optional configuration to narrow down the search by province.
 * @returns A promise that resolves to an array of `PostalCode` instances.
 */
export async function searchByCode(
  code: string, 
  options: { province?: string; provinceCode?: string } = {}
): Promise<PostalCode[]> {
  if (!globalStandardRepo) {
    globalStandardRepo = new TsPostalCodeRepository();
  }
  
  const useCase = new SearchPostalCode(globalStandardRepo);

  let resolvedProvinceCode = options.provinceCode;
  if (options.province && !resolvedProvinceCode) {
    const upperProvince = options.province.toUpperCase().replace(/\s+/g, '_');
    resolvedProvinceCode = PROVINCE_ALIAS_MAP[upperProvince];
  }

  return useCase.executeByCode(code, resolvedProvinceCode);
}
