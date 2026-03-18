import { PostalCode } from '../../domain/models/PostalCode.js';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository.js';
import { ValidationError } from '../../domain/errors/PostalCodeError.js';

/**
 * Use case to search for postal codes.
 */
export class SearchPostalCode {
  constructor(private readonly repository: PostalCodeRepository) {}

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
}
