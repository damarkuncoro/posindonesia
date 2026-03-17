import { PostalCode } from '../../domain/models/PostalCode';
import { SAMPLE_POSTAL_CODES } from '../../data';
/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
export class TsPostalCodeRepository {
    constructor() {
        this.instances = SAMPLE_POSTAL_CODES.map((item) => new PostalCode(item.kode, item.nama, item.provinsi, item.kabupaten, item.kecamatan, item.desa));
    }
    async findByKeywords(keywords) {
        return this.instances.filter((pc) => pc.matches(keywords));
    }
    async fetchExternal(_villageName, _cookie) {
        throw new Error('External fetch not implemented for TS repository');
    }
}
//# sourceMappingURL=TsPostalCodeRepository.js.map