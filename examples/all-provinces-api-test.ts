import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mengambil data kodepos untuk semua 38 provinsi di Indonesia 
 * langsung dari API Pos Indonesia (Mode Massal).
 */
const PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", 
  "Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung", 
  "Kepulauan Riau", "DKI Jakarta", "Jawa Barat", "Jawa Tengah", 
  "DI Yogyakarta", "Jawa Timur", "Banten", "Bali", "Nusa Tenggara Barat", 
  "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah", 
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara", 
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", 
  "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat", "Maluku", 
  "Maluku Utara", "Papua", "Papua Barat", "Papua Selatan", 
  "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"
];

async function runMassApiTest() {
    console.log('--- Pengujian API Massal (Semua Provinsi) ---');
    
    const userCookie = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';
    const outputDir = path.join(__dirname, '../results/api_provinces');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const province of PROVINCES) {
        try {
            console.log(`\n📦 Memproses Provinsi: ${province}...`);
            
            const html = await fetchPostalCodeHtml(province, userCookie);
            const results = parsePostalCodeTable(html);

            if (results.length > 0) {
                const fileName = `${province.toLowerCase().replace(/\s+/g, '_')}.json`;
                const outputPath = path.join(outputDir, fileName);
                
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
                console.log(`✅ Berhasil! Ditemukan ${results.length} hasil. Disimpan ke: ${fileName}`);
            } else {
                console.log(`⚠️ Tidak ada hasil untuk ${province}. Mungkin tidak ada data atau keyword salah.`);
            }

            // Jeda 1 detik antar permintaan untuk stabilitas
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
            console.error(`❌ Gagal memproses ${province}:`, error.message);
        }
    }

    console.log('\n✨ Semua provinsi telah selesai diproses.');
}

runMassApiTest();
