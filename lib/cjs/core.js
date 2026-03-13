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
exports.runScraper = runScraper;
const fs = __importStar(require("fs"));
const api_1 = require("./api");
const parser_1 = require("./parser");
const utils_1 = require("./utils");
/**
 * Core scraping logic separated from CLI.
 * @param options - Configuration options
 * @param onProgress - Callback for progress updates
 * @returns Scraped results
 */
async function runScraper(options, onProgress = () => { }) {
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
        const code = values[0];
        const name = values[1];
        const prov = values[2];
        const kab = values[3];
        const kec = values[4];
        onProgress(i, totalToProcess, name);
        try {
            const html = await (0, api_1.fetchPostalCodeHtml)(name, cookie);
            const results = (0, parser_1.parsePostalCodeTable)(html);
            const bestMatch = (0, utils_1.findBestMatch)(results, name, kec);
            scrapedResults.push({
                code: (0, utils_1.formatCode)(code),
                name: name,
                districtCode: (0, utils_1.formatCode)(code.substring(0, 6)),
                type: "DESA",
                provinceName: prov,
                regencyName: kab,
                districtName: kec,
                postalCode: bestMatch ? bestMatch.kodepos : ""
            });
        }
        catch (error) {
            console.error(`\n⚠️ Failed to scrape ${name}: ${error.message}`);
        }
        if (i < totalToProcess - 1) {
            await new Promise(r => setTimeout(r, delay));
        }
    }
    onProgress(totalToProcess, totalToProcess, 'Completed!');
    return scrapedResults;
}
//# sourceMappingURL=core.js.map