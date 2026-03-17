export class PostalCode {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly province: string,
    public readonly regency: string,
    public readonly district: string,
    public readonly village: string
  ) {
    this.validate();
  }

  private validate() {
    if (!this.code || this.code.length < 5) {
      throw new Error(`Invalid postal code: ${this.code}`);
    }
    if (!this.name || !this.province) {
      throw new Error("Postal code must have a name and province");
    }
  }

  /**
   * Formats the code into standard Indonesian administrative format (PP.KK.CC.DD).
   */
  get formattedCode(): string {
    const cleanCode = this.code.replace(/\./g, '');
    const p1 = cleanCode.substring(0, 2);
    const p2 = cleanCode.substring(2, 4);
    const p3 = cleanCode.substring(4, 6);
    const p4 = cleanCode.substring(6);
    return [p1, p2, p3, p4].filter(Boolean).join('.');
  }

  /**
   * Check if the postal code matches a set of keywords.
   */
  matches(keywords: string[]): boolean {
    const combinedData = `${this.code} ${this.name} ${this.province} ${this.regency} ${this.district} ${this.village}`.toLowerCase();
    return keywords.every(term => combinedData.includes(term.toLowerCase()));
  }
}
