"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchPostalCode = void 0;
/**
 * Use case to search for postal codes.
 */
class SearchPostalCode {
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Execute the search with keywords.
     */
    async execute(keywords) {
        if (!keywords || keywords.length === 0) {
            throw new Error("At least one keyword is required for search");
        }
        return this.repository.findByKeywords(keywords);
    }
}
exports.SearchPostalCode = SearchPostalCode;
//# sourceMappingURL=SearchPostalCode.js.map