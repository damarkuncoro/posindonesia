import { PostalCode } from '../../domain/models/PostalCode';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository';

/**
 * Use case to search for postal codes.
 */
export class SearchPostalCode {
  constructor(private readonly repository: PostalCodeRepository) {}

  /**
   * Execute the search with keywords.
   */
  async execute(keywords: string[]): Promise<PostalCode[]> {
    if (!keywords || keywords.length === 0) {
      throw new Error("At least one keyword is required for search");
    }
    return this.repository.findByKeywords(keywords);
  }
}
