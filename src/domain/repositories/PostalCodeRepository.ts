import { PostalCode } from '../models/PostalCode.js';

export interface PostalCodeFilter {
  province?: string;
  city?: string;
  district?: string;
  village?: string;
  postalCode?: string;
}

/**
 * Interface for repositories that support searching postal codes.
 */
export interface SearchableRepository<T = PostalCode> {
  /**
   * Finds postal codes matching the given keywords.
   * @param keywords Array of search terms
   * @param provinceCode Optional 2-digit province code to limit search scope
   */
  findByKeywords(keywords: string[], provinceCode?: string): Promise<T[]>;

  /**
   * Finds postal codes matching the given code (postal code, village code, etc.).
   * @param code The code to search for
   * @param provinceCode Optional 2-digit province code to limit search scope
   */
  findByCode(code: string, provinceCode?: string): Promise<T[]>;

  /**
   * Finds postal codes matching the given structured filter.
   * @param filter The filter object
   * @param provinceCode Optional 2-digit province code to limit search scope
   */
  findByFilter(filter: PostalCodeFilter, provinceCode?: string): Promise<T[]>;
}

/**
 * Interface for repositories that support fetching from external sources.
 */
export interface ScrapableRepository<T = PostalCode> {
  /**
   * Fetches the latest postal code data from an external source.
   */
  fetchExternal(villageName: string, cookie?: string): Promise<T[]>;
}

/**
 * Combined interface for backward compatibility.
 */
export interface PostalCodeRepository<T = PostalCode> extends SearchableRepository<T>, ScrapableRepository<T> {}
