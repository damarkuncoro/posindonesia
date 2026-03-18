import { PostalCode } from '../../domain/models/PostalCode.js';
import { SearchableRepository, PostalCodeFilter } from '../../domain/repositories/PostalCodeRepository.js';
import { ValidationError } from '../../domain/errors/PostalCodeError.js';

/**
 * Use case to search for postal codes.
 */
export class SearchPostalCode {
  constructor(private readonly repository: SearchableRepository) {}

  /**
   * Execute the search with keywords.
   */
  async execute(keywords: string[], provinceCode?: string): Promise<PostalCode[]> {
    if (!keywords || keywords.length === 0) {
      throw new ValidationError("At least one keyword is required for search");
    }

    const cleanKeywords = keywords
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (cleanKeywords.length === 0) {
      throw new ValidationError("Search keywords cannot be empty strings");
    }

    return this.repository.findByKeywords(cleanKeywords, provinceCode);
  }

  /**
   * Execute the search by a specific code (Postal, Village, etc).
   */
  async executeByCode(code: string, provinceCode?: string): Promise<PostalCode[]> {
    if (!code || code.trim().length === 0) {
      throw new ValidationError("A code is required for search");
    }

    return this.repository.findByCode(code.trim(), provinceCode);
  }

  /**
   * Execute the search with a structured filter.
   */
  async executeByFilter(filter: PostalCodeFilter, provinceCode?: string): Promise<PostalCode[]> {
    if (!filter || Object.keys(filter).length === 0) {
      throw new ValidationError("A filter object is required for structured search");
    }

    return this.repository.findByFilter(filter, provinceCode);
  }
}
