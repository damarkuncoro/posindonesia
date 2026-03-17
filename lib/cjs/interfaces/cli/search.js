#!/usr/bin/env node
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
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TsPostalCodeRepository_1 = require("../../infrastructure/repositories/TsPostalCodeRepository");
const CsvPostalCodeRepository_1 = require("../../infrastructure/repositories/CsvPostalCodeRepository");
const SearchPostalCode_1 = require("../../application/use-cases/SearchPostalCode");
/**
 * CLI untuk mencari kode pos Indonesia (DDD Version).
 * Memisahkan logika infrastruktur (Data Storage) dari logika bisnis (Search Use Case).
 */
const program = new commander_1.Command();
program
    .name('pos-cli')
    .description('Pencarian Kode Pos Indonesia')
    .version('1.0.0');
program
    .command('cari <keywords...>')
    .description('Mencari kode pos berdasarkan satu atau lebih kata kunci (misal: semper timur)')
    .option('-f, --file <path>', 'Path ke file CSV data kodepos (opsional, jika tidak diset menggunakan data TS internal)')
    .option('-o, --output <path>', 'Simpan hasil pencarian ke file JSON (opsional)')
    .action(async (keywords, options) => {
    try {
        // 1. Inisialisasi Repository berdasarkan opsi pengguna (Infrastructure Layer)
        const repository = options.file
            ? new CsvPostalCodeRepository_1.CsvPostalCodeRepository(options.file)
            : new TsPostalCodeRepository_1.TsPostalCodeRepository();
        // 2. Inisialisasi Use Case (Application Layer)
        const searchUseCase = new SearchPostalCode_1.SearchPostalCode(repository);
        console.log(`🔍 Mencari: "${keywords.join(' ')}" ${options.file ? `di file ${options.file}` : 'di data internal (TS)'}...\n`);
        // 3. Eksekusi Use Case
        const results = await searchUseCase.execute(keywords);
        if (results.length === 0) {
            console.log(`⚠️ Tidak ada hasil yang ditemukan untuk: "${keywords.join(' ')}"`);
        }
        else {
            results.forEach(item => {
                console.log(`✅ ${item.formattedCode}, ${item.name}, ${item.province}, ${item.regency}, ${item.district}, ${item.village}`);
            });
            console.log(`\n✨ Selesai. Menemukan ${results.length} hasil.`);
            // 4. Simpan ke JSON jika opsi --output diberikan
            if (options.output) {
                const outputPath = path.resolve(process.cwd(), options.output);
                // Pastikan direktori output ada
                const outputDir = path.dirname(outputPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                // Format data untuk JSON
                const jsonData = results.map(item => ({
                    kode: item.code,
                    kode_format: item.formattedCode,
                    nama: item.name,
                    provinsi: item.province,
                    kabupaten: item.regency,
                    kecamatan: item.district,
                    desa: item.village
                }));
                fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
                console.log(`\n💾 Hasil telah disimpan ke: ${outputPath}`);
            }
        }
    }
    catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=search.js.map