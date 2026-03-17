"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsPostalCodeRepository = void 0;
const PostalCode_1 = require("../../domain/models/PostalCode");
const PROVINCES = __importStar(require("../../data/index"));
/**
 * Implementation of PostalCodeRepository using internal TypeScript data.
 */
class TsPostalCodeRepository {
    constructor() {
        // Gabungkan semua data provinsi menjadi satu array
        const allData = Object.values(PROVINCES).flat();
        this.instances = allData.map((item) => new PostalCode_1.PostalCode(item.postalCode, item.village, item.province, item.city, item.district, item.village, item.provinceCode, item.cityCode, item.districtCode, item.villageCode));
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
exports.TsPostalCodeRepository = TsPostalCodeRepository;
//# sourceMappingURL=TsPostalCodeRepository.js.map