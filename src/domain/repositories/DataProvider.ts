import { PostalCodeData } from '../../types.js';

/**
 * An interface for any class that can provide postal code data.
 * This allows the repository to be decoupled from the data source.
 */
export interface DataProvider {
  /**
   * Retrieves all postal code data.
   */
  getAll(): Promise<PostalCodeData[]>;

  /**
   * Retrieves postal code data for a specific province.
   * @param provinceCode The 2-digit province code.
   */
  getByProvince(provinceCode: string): Promise<PostalCodeData[]>;
}
