// Domain Layer
export * from './domain/models/PostalCode.js';
export * from './domain/repositories/PostalCodeRepository.js';
export * from './domain/services/PostalCodeMatcher.js';
export * from './domain/services/Logger.js';

// Application Layer
export * from './application/use-cases/SearchPostalCode.js';

// Infrastructure Layer
export { TsPostalCodeRepository, type TsRepoConfig } from './infrastructure/repositories/TsPostalCodeRepository.js';

// Errors
export * from './domain/errors/PostalCodeError.js';

// Data
export * from './data/index.js';
export * from './types.js';
