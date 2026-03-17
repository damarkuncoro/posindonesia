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
exports.CsvPostalCodeRepository = void 0;
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const path = __importStar(require("path"));
const PostalCode_1 = require("../../domain/models/PostalCode");
/**
 * Implementation of PostalCodeRepository using CSV files with streaming.
 */
class CsvPostalCodeRepository {
    constructor(filePath) {
        this.filePath = filePath;
    }
    async findByKeywords(keywords) {
        const inputPath = path.resolve(process.cwd(), this.filePath);
        if (!fs.existsSync(inputPath)) {
            throw new Error(`CSV data file not found at: ${inputPath}`);
        }
        const fileStream = fs.createReadStream(inputPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        const results = [];
        let isHeader = true;
        for await (const line of rl) {
            if (isHeader) {
                isHeader = false;
                continue;
            }
            const parts = line.split(',');
            if (parts.length < 6)
                continue;
            const pc = new PostalCode_1.PostalCode(parts[0], // kode
            parts[1], // nama
            parts[2], // provinsi
            parts[3], // kabupaten
            parts[4], // kecamatan
            parts[5] // desa
            );
            if (pc.matches(keywords)) {
                results.push(pc);
            }
        }
        return results;
    }
    async fetchExternal(_villageName, _cookie) {
        throw new Error('External fetch not implemented for CSV repository');
    }
}
exports.CsvPostalCodeRepository = CsvPostalCodeRepository;
//# sourceMappingURL=CsvPostalCodeRepository.js.map