export declare class PostalCode {
    readonly code: string;
    readonly name: string;
    readonly province: string;
    readonly regency: string;
    readonly district: string;
    readonly village: string;
    constructor(code: string, name: string, province: string, regency: string, district: string, village: string);
    private validate;
    /**
     * Formats the code into standard Indonesian administrative format (PP.KK.CC.DD).
     */
    get formattedCode(): string;
    /**
     * Check if the postal code matches a set of keywords.
     */
    matches(keywords: string[]): boolean;
}
//# sourceMappingURL=PostalCode.d.ts.map