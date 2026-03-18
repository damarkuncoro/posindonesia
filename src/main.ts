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
export * from './types.js';

/**
 * Global helper for quick postal code searching without manual instantiation.
 * Uses the internal TypeScript database with caching.
 */
let globalStandardRepo: TsPostalCodeRepository | null = null;
let globalFuzzyRepo: TsPostalCodeRepository | null = null;

export async function search(
  keywords: string | string[] | PostalCodeFilter, 
  options: { provinceCode?: string; useFuzzy?: boolean } = {}
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
  // console.log('DEBUG search:', { keywords, provinceCode: options.provinceCode });

  if (typeof keywords === 'object' && !Array.isArray(keywords)) {
    return useCase.executeByFilter(keywords, options.provinceCode);
  }

  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];

  return useCase.execute(keywordArray, options.provinceCode);
}

/**
 * Global helper for quick search by specific code.
 */
export async function searchByCode(
  code: string, 
  provinceCode?: string
): Promise<PostalCode[]> {
  if (!globalStandardRepo) {
    globalStandardRepo = new TsPostalCodeRepository();
  }
  
  const useCase = new SearchPostalCode(globalStandardRepo);
  return useCase.executeByCode(code, provinceCode);
}
