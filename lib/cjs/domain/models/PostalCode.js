"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostalCode = void 0;
class PostalCode {
    constructor(postalCode, name, // Nama Desa/Kelurahan (untuk kompatibilitas)
    province, city, district, village, 
    // Field opsional untuk kode wilayah
    provinceCode = '', cityCode = '', districtCode = '', villageCode = '') {
        this.postalCode = postalCode;
        this.name = name;
        this.province = province;
        this.city = city;
        this.district = district;
        this.village = village;
        this.provinceCode = provinceCode;
        this.cityCode = cityCode;
        this.districtCode = districtCode;
        this.villageCode = villageCode;
        this.validate();
    }
    validate() {
        if (!this.postalCode || this.postalCode.length < 5) {
            // throw new Error(`Invalid postal code: ${this.postalCode}`);
            // Relax validation for now as some scraped data might be partial
        }
    }
    /**
     * Check if the postal code matches a set of keywords.
     */
    matches(keywords) {
        const combinedData = `${this.postalCode} ${this.province} ${this.city} ${this.district} ${this.village}`.toLowerCase();
        return keywords.every(term => combinedData.includes(term.toLowerCase()));
    }
    /**
     * Check if the entry matches a specific code (postal, village, district, etc.)
     */
    matchesCode(code) {
        const cleanCode = code.trim();
        return (this.postalCode === cleanCode ||
            this.villageCode === cleanCode ||
            this.districtCode === cleanCode ||
            this.cityCode === cleanCode ||
            this.provinceCode === cleanCode);
    }
    toString() {
        return `${this.postalCode} - ${this.village}, ${this.district}, ${this.city}, ${this.province}`;
    }
}
exports.PostalCode = PostalCode;
//# sourceMappingURL=PostalCode.js.map