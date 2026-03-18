import { TsPostalCodeRepository, TsRepoConfig } from './infrastructure/repositories/TsPostalCodeRepository.js';
import { SearchPostalCode } from './application/use-cases/SearchPostalCode.js';
import { PostalCode } from './domain/models/PostalCode.js';

// Re-export core components
export * from './domain/models/PostalCode.js';
export * from './domain/repositories/PostalCodeRepository.js';
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
let globalRepo: TsPostalCodeRepository | null = null;

export async function search(
  keywords: string | string[], 
  options: { provinceCode?: string; useFuzzy?: boolean } = {}
): Promise<PostalCode[]> {
  if (!globalRepo) {
    globalRepo = new TsPostalCodeRepository({ useFuzzy: options.useFuzzy });
  }
  
  const useCase = new SearchPostalCode(globalRepo);
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
  if (!globalRepo) {
    globalRepo = new TsPostalCodeRepository();
  }
  
  const useCase = new SearchPostalCode(globalRepo);
  return useCase.executeByCode(code, provinceCode);
}
