// Domain Layer
export * from './domain/models/PostalCode';
export * from './domain/repositories/PostalCodeRepository';
export * from './domain/services/PostalCodeMatcher';
// Application Layer
export * from './application/use-cases/SearchPostalCode';
export * from './application/use-cases/ScrapePostalCode';
// Infrastructure Layer
export * from './infrastructure/repositories/TsPostalCodeRepository';
export * from './infrastructure/repositories/CsvPostalCodeRepository';
export * from './infrastructure/external/PosIndonesiaApi';
export * from './infrastructure/parsers/HtmlParser';
// Data
export * from './data';
//# sourceMappingURL=main.js.map