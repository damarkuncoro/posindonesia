import { PostalCode } from '../../domain/models/PostalCode';
import * as PROVINCES from '../../data/index';
/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
export class TsPostalCodeRepository {
    constructor() {
        // Gabungkan semua data provinsi menjadi satu array
        const allData = Object.values(PROVINCES).flat();
        this.instances = allData.map((item) => new PostalCode(item.postalCode, item.village, item.province, item.city, item.district, item.village, item.provinceCode, item.cityCode, item.districtCode, item.villageCode));
    }
    async findByKeywords(keywords) {
        return this.instances.filter((pc) => pc.matches(keywords));
    }
    async findByCode(code) {
        return this.instances.filter((pc) => pc.matchesCode(code));
    }
    async fetchExternal(_villageName, _cookie) {
        throw new Error('External fetch not implemented for TS repository');
    }
}
//# sourceMappingURL=TsPostalCodeRepository.js.map