#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * CLI untuk mencari kode pos Indonesia.
 * Mendukung pencarian dengan streaming untuk efisiensi memori
 * dan mendukung banyak kata kunci pencarian.
 */

const program = new Command();

program
  .name('pos-cli')
  .description('Pencarian Kode Pos Indonesia')
  .version('1.0.0');

program
  .command('cari <keywords...>')
  .description('Mencari kode pos berdasarkan satu atau lebih kata kunci (misal: semper timur)')
  .option('-f, --file <path>', 'Path ke file CSV data kodepos', 'data/sample.csv')
  .action(async (keywords: string[], options) => {
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
    } else {
      console.log(`\n✨ Selesai. Menemukan ${foundCount} hasil.`);
    }
  });

program.parse(process.argv);
