"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsPostalCodeRepository = void 0;
const PostalCode_1 = require("../../domain/models/PostalCode");
const data_1 = require("../../data");
/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
class TsPostalCodeRepository {
    constructor() {
        this.instances = data_1.SAMPLE_POSTAL_CODES.map((item) => new PostalCode_1.PostalCode(item.kode, item.nama, item.provinsi, item.kabupaten, item.kecamatan, item.desa));
    }
    async findByKeywords(keywords) {
        return this.instances.filter((pc) => pc.matches(keywords));
    }
    async fetchExternal(_villageName, _cookie) {
        throw new Error('External fetch not implemented for TS repository');
    }
}
exports.TsPostalCodeRepository = TsPostalCodeRepository;
//# sourceMappingURL=TsPostalCodeRepository.js.map