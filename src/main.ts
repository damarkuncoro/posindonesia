// Domain Layer
export * from './domain/models/PostalCode.js';
export * from './domain/repositories/PostalCodeRepository.js';
export * from './domain/services/PostalCodeMatcher.js';

// Application Layer
export * from './application/use-cases/SearchPostalCode.js';

// Infrastructure Layer
export * from './infrastructure/repositories/TsPostalCodeRepository.js';
export * from './infrastructure/external/PosIndonesiaApi.js';
export * from './infrastructure/parsers/HtmlParser.js';

// Errors
export * from './domain/errors/PostalCodeError.js';

// Data
export * from './data/index.js';
