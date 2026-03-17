"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalCode = void 0;
class PostalCode {
    constructor(code, name, province, regency, district, village) {
        this.code = code;
        this.name = name;
        this.province = province;
        this.regency = regency;
        this.district = district;
        this.village = village;
        this.validate();
    }
    validate() {
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
    get formattedCode() {
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
    matches(keywords) {
        const combinedData = `${this.code} ${this.name} ${this.province} ${this.regency} ${this.district} ${this.village}`.toLowerCase();
        return keywords.every(term => combinedData.includes(term.toLowerCase()));
    }
}
exports.PostalCode = PostalCode;
//# sourceMappingURL=PostalCode.js.map