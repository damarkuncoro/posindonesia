#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { TsPostalCodeRepository } from '../../infrastructure/repositories/TsPostalCodeRepository';
import { CsvPostalCodeRepository } from '../../infrastructure/repositories/CsvPostalCodeRepository';
import { SearchPostalCode } from '../../application/use-cases/SearchPostalCode';

/**
 * CLI untuk mencari kode pos Indonesia (DDD Version).
 * Memisahkan logika infrastruktur (Data Storage) dari logika bisnis (Search Use Case).
 */

const program = new Command();

program
  .name('pos-cli')
  .description('Pencarian Kode Pos Indonesia')
  .version('1.0.0');

program
  .command('cari <keywords...>')
  .description('Mencari kode pos berdasarkan satu atau lebih kata kunci (misal: semper timur)')
  .option('-f, --file <path>', 'Path ke file CSV data kodepos (opsional, jika tidak diset menggunakan data TS internal)')
  .option('-o, --output <path>', 'Simpan hasil pencarian ke file JSON (opsional)')
  .action(async (keywords: string[], options) => {
    try {
      // 1. Inisialisasi Repository berdasarkan opsi pengguna (Infrastructure Layer)
      const repository = options.file 
        ? new CsvPostalCodeRepository(options.file) 
        : new TsPostalCodeRepository();

      // 2. Inisialisasi Use Case (Application Layer)
      const searchUseCase = new SearchPostalCode(repository);

      console.log(`🔍 Mencari: "${keywords.join(' ')}" ${options.file ? `di file ${options.file}` : 'di data internal (TS)'}...\n`);

      // 3. Eksekusi Use Case
      const results = await searchUseCase.execute(keywords);

      if (results.length === 0) {
        console.log(`⚠️ Tidak ada hasil yang ditemukan untuk: "${keywords.join(' ')}"`);
      } else {
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
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
