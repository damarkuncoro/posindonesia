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
const readline = __importStar(require("readline"));
/**
 * CLI untuk mencari kode pos Indonesia.
 * Mendukung pencarian dengan streaming untuk efisiensi memori
 * dan mendukung banyak kata kunci pencarian.
 */
const program = new commander_1.Command();
program
    .name('pos-cli')
    .description('Pencarian Kode Pos Indonesia')
    .version('1.0.0');
program
    .command('cari <keywords...>')
    .description('Mencari kode pos berdasarkan satu atau lebih kata kunci (misal: semper timur)')
    .option('-f, --file <path>', 'Path ke file CSV data kodepos', 'data/sample.csv')
    .action(async (keywords, options) => {
    // Resolusi path file data relatif terhadap direktori kerja saat ini (CWD)
    // agar CLI benar-benar independen dari struktur internal proyek.
    const inputPath = path.resolve(process.cwd(), options.file);
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Error: File data tidak ditemukan di: ${inputPath}`);
        process.exit(1);
    }
    console.log(`🔍 Mencari: "${keywords.join(' ')}" di ${options.file}...\n`);
    const fileStream = fs.createReadStream(inputPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    let foundCount = 0;
    const searchTerms = keywords.map(k => k.toLowerCase());
    for await (const line of rl) {
        const lowerLine = line.toLowerCase();
        // Logika pencarian: Pastikan SEMUA kata kunci ada di dalam baris tersebut
        const isMatch = searchTerms.every(term => lowerLine.includes(term));
        if (isMatch) {
            console.log(`✅ ${line}`);
            foundCount++;
        }
    }
    if (foundCount === 0) {
        console.log(`⚠️ Tidak ada hasil yang ditemukan untuk: "${keywords.join(' ')}"`);
    }
    else {
        console.log(`\n✨ Selesai. Menemukan ${foundCount} hasil.`);
    }
});
program.parse(process.argv);
//# sourceMappingURL=cli.js.map