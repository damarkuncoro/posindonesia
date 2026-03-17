import { PostalCode } from '../models/PostalCode';

export interface PostalCodeRepository {
  /**
   * Finds postal codes matching the given keywords.
   */
  findByKeywords(keywords: string[]): Promise<PostalCode[]>;

  /**
   * Finds postal codes matching the given code (postal code, village code, etc.).
   */
  findByCode(code: string): Promise<PostalCode[]>;

  /**
   * Fetches the latest postal code data from an external source (e.g., website).
   */
  fetchExternal(villageName: string, cookie?: string): Promise<PostalCode[]>;
}
