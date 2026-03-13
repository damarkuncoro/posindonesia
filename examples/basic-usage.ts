import { runScraper } from '../src/main';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Contoh penggunaan dasar SDK @damarkuncoro/posindonesia
 * Menggunakan API `runScraper` untuk memproses data dari file CSV.
 */
async function runBasicExample() {
    console.log('--- Contoh Penggunaan Dasar SDK ---');

    const options = {
        input: path.join(__dirname, '../../../docs/database_final.csv'), // Gunakan database utama
        limit: 10, // Memproses 10 baris agar hasil lebih terlihat
        delay: 1500, // Beri jeda 1.5 detik agar aman
        output: path.join(__dirname, '../results/example_output.json')
    };

    try {
        const results = await runScraper(options, (current, total, village) => {
            if (village === 'Completed!') {
                console.log(`\n✅ Selesai! Memproses ${total} desa.`);
            } else {
                console.log(`Sedang memproses: ${village} (${current + 1}/${total})`);
            }
        });

        // Ensure output directory exists
        const outputDir = path.dirname(options.output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(options.output, JSON.stringify(results, null, 2));

        console.log('\nPratinjau Hasil Sinkronisasi (2 pertama):');
        console.log(JSON.stringify(results.slice(0, 2), null, 2));
        
        console.log(`\n📂 Hasil lengkap telah disimpan di:`);
        console.log(options.output);
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

runBasicExample();
