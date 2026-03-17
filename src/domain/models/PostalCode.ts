export class PostalCode {
  constructor(
    public readonly postalCode: string,
    public readonly name: string, // Nama Desa/Kelurahan (untuk kompatibilitas)
    public readonly province: string,
    public readonly city: string,
    public readonly district: string,
    public readonly village: string,
    // Field opsional untuk kode wilayah
    public readonly provinceCode: string = '',
    public readonly cityCode: string = '',
    public readonly districtCode: string = '',
    public readonly villageCode: string = ''
  ) {
    this.validate();
  }

  private validate() {
    if (!this.postalCode || this.postalCode.length < 5) {
      // throw new Error(`Invalid postal code: ${this.postalCode}`);
      // Relax validation for now as some scraped data might be partial
    }
  }

  /**
   * Check if the postal code matches a set of keywords.
   */
  matches(keywords: string[]): boolean {
    const combinedData = `${this.postalCode} ${this.province} ${this.city} ${this.district} ${this.village}`.toLowerCase();
    return keywords.every(term => combinedData.includes(term.toLowerCase()));
  }

  /**
   * Check if the entry matches a specific code (postal, village, district, etc.)
   */
  matchesCode(code: string): boolean {
    const cleanCode = code.trim();
    return (
      this.postalCode === cleanCode ||
      this.villageCode === cleanCode ||
      this.districtCode === cleanCode ||
      this.cityCode === cleanCode ||
      this.provinceCode === cleanCode
    );
  }

  toString(): string {
    return `${this.postalCode} - ${this.village}, ${this.district}, ${this.city}, ${this.province}`;
  }
}
