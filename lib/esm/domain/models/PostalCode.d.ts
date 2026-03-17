export declare class PostalCode {
    readonly postalCode: string;
    readonly name: string;
    readonly province: string;
    readonly city: string;
    readonly district: string;
    readonly village: string;
    readonly provinceCode: string;
    readonly cityCode: string;
    readonly districtCode: string;
    readonly villageCode: string;
    constructor(postalCode: string, name: string, // Nama Desa/Kelurahan (untuk kompatibilitas)
    province: string, city: string, district: string, village: string, provinceCode?: string, cityCode?: string, districtCode?: string, villageCode?: string);
    private validate;
    /**
     * Check if the postal code matches a set of keywords.
     */
    matches(keywords: string[]): boolean;
    /**
     * Check if the entry matches a specific code (postal, village, district, etc.)
     */
    matchesCode(code: string): boolean;
    toString(): string;
}
//# sourceMappingURL=PostalCode.d.ts.map