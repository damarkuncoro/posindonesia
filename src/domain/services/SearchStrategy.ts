import { PostalCodeData } from '../../types.js';

/**
 * Interface for search strategies used by the repository.
 */
export interface SearchStrategy {
  /**
   * Search for matches within the provided data.
   */
  search(data: PostalCodeData[], keywords: string[], options?: SearchStrategyOptions): Promise<PostalCodeData[]>;
}

export interface SearchStrategyOptions {
  threshold?: number;
  provinceCode?: string;
}
