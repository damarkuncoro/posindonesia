import { PostalCodeData } from '../../types.js';

/**
 * Domain model representing a Postal Code entry with its administrative details.
 */
export class PostalCode {
  public readonly postalCode: string;
  public readonly province: string;
  public readonly provinceCode: string;
  public readonly city: string;
  public readonly cityCode: string;
  public readonly district: string;
  public readonly districtCode: string;
  public readonly village: string;
  public readonly villageCode: string;

  constructor(data: PostalCodeData) {
    this.postalCode = data.postalCode;
    this.province = data.province;
    this.provinceCode = data.provinceCode;
    this.city = data.city;
    this.cityCode = data.cityCode;
    this.district = data.district;
    this.districtCode = data.districtCode;
    this.village = data.village;
    this.villageCode = data.villageCode;
    
    this.validate();
  }

  private validate(): void {
    if (!this.postalCode || !/^\d{5}$/.test(this.postalCode)) {
      throw new Error(`Invalid postal code format: ${this.postalCode}`);
    }
    if (!this.province || !this.city || !this.district || !this.village) {
      throw new Error('Incomplete administrative data for postal code entry');
    }
  }

  /**
   * Static helper to check if raw data matches keywords.
   */
  static matches(data: PostalCodeData, keywords: string[]): boolean {
    if (keywords.length === 0) return true;
    const combinedData = `${data.postalCode} ${data.province} ${data.city} ${data.district} ${data.village}`.toLowerCase();
    return keywords.every(term => combinedData.includes(term.toLowerCase()));
  }

  /**
   * Static helper to check if raw data matches a code.
   */
  static matchesCode(data: PostalCodeData, code: string): boolean {
    const cleanCode = code.trim();
    return (
      data.postalCode === cleanCode ||
      data.villageCode === cleanCode ||
      data.districtCode === cleanCode ||
      data.cityCode === cleanCode ||
      data.provinceCode === cleanCode
    );
  }

  /**
   * Check if the postal code matches a set of keywords.
   */
  matches(keywords: string[]): boolean {
    return PostalCode.matches(this.toJSON(), keywords);
  }

  /**
   * Check if the entry matches a specific code.
   */
  matchesCode(code: string): boolean {
    return PostalCode.matchesCode(this.toJSON(), code);
  }

  /**
   * Returns a human-readable string representation of the postal code.
   */
  toString(): string {
    return `${this.postalCode} - ${this.village}, ${this.district}, ${this.city}, ${this.province}`;
  }

  /**
   * Converts the instance back to a plain data object.
   */
  toJSON(): PostalCodeData {
    return {
      postalCode: this.postalCode,
      province: this.province,
      provinceCode: this.provinceCode,
      city: this.city,
      cityCode: this.cityCode,
      district: this.district,
      districtCode: this.districtCode,
      village: this.village,
      villageCode: this.villageCode
    };
  }
}
