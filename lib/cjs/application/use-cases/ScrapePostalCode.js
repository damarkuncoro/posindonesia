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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapePostalCode = void 0;
const fs = __importStar(require("fs"));
const PosIndonesiaApi_1 = require("../../infrastructure/external/PosIndonesiaApi");
const HtmlParser_1 = require("../../infrastructure/parsers/HtmlParser");
const PostalCodeMatcher_1 = require("../../domain/services/PostalCodeMatcher");
const PostalCode_1 = require("../../domain/models/PostalCode");
const logger_1 = __importDefault(require("../../logger"));
/**
 * Use Case: Scrape postal codes for a list of villages.
 */
class ScrapePostalCode {
    /**
     * Execute the scraper.
     */
    async execute(options, onProgress = () => { }) {
        const { input, limit, delay, cookie } = options;
        if (!fs.existsSync(input)) {
            throw new Error(`Input file not found at ${input}`);
        }
        const csvData = fs.readFileSync(input, 'utf-8');
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        const rows = lines.slice(1);
        const totalToProcess = Math.min(rows.length, limit);
        const scrapedResults = [];
        for (let i = 0; i < totalToProcess; i++) {
            const values = rows[i].split(',');
            if (values.length < 5) {
                console.warn(`⚠️ Skip baris invalid (kurang kolom): ${rows[i]}`);
                continue;
            }
            const code = values[0]?.trim();
            const name = values[1]?.trim();
            const prov = values[2]?.trim();
            const kab = values[3]?.trim();
            const kec = values[4]?.trim();
            if (!code || !name) {
                console.warn(`⚠️ Skip baris invalid (kode atau nama kosong): ${rows[i]}`);
                continue;
            }
            onProgress(i, totalToProcess, name);
            try {
                const html = await (0, PosIndonesiaApi_1.fetchPostalCodeHtml)(name, cookie);
                const results = (0, HtmlParser_1.parsePostalCodeTable)(html);
                const bestMatch = PostalCodeMatcher_1.PostalCodeMatcher.findBestMatch(results, name, kec);
                // Create a domain object to use its formatting/validation
                const domainObj = new PostalCode_1.PostalCode(code, name, prov, kab, kec, name);
                scrapedResults.push({
                    code: domainObj.formattedCode,
                    name: name,
                    districtCode: domainObj.formattedCode.substring(0, 8), // Assuming PP.KK.CC
                    type: "DESA",
                    provinceName: prov,
                    regencyName: kab,
                    districtName: kec,
                    postalCode: bestMatch ? bestMatch.kodepos : ""
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`\n⚠️ Failed to scrape ${name}: ${errorMessage}`);
                logger_1.default.error(`Failed to scrape ${name}`, { village: name, error: errorMessage });
            }
            if (i < totalToProcess - 1) {
                await new Promise(r => setTimeout(r, delay));
            }
        }
        onProgress(totalToProcess, totalToProcess, 'Completed!');
        return scrapedResults;
    }
}
exports.ScrapePostalCode = ScrapePostalCode;
//# sourceMappingURL=ScrapePostalCode.js.map