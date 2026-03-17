import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mengambil data kodepos untuk provinsi yang belum mendapatkan data
 * dengan cara mencari berdasarkan Kabupaten/Kota (Regency).
 */
const MISSING_DATA = [
    { province: "Sumatera Utara", regencies: ["KOTA MEDAN", "KOTA BINJAI", "KABUPATEN ASAHAN"] },
    { province: "Jawa Barat", regencies: ["KOTA BANDUNG", "KABUPATEN BOGOR", "KOTA BEKASI"] },
    { province: "Jawa Timur", regencies: ["KOTA SURABAYA", "KOTA MALANG", "KABUPATEN SIDOARJO"] },
    { province: "DKI Jakarta", regencies: ["KOTA JAKARTA SELATAN", "KOTA JAKARTA TIMUR", "KOTA JAKARTA PUSAT"] },
    { province: "DI Yogyakarta", regencies: ["KOTA YOGYAKARTA", "KABUPATEN SLEMAN", "KABUPATEN BANTUL"] }
];

async function runRegencyApiTest() {
    console.log('--- Melengkapi Data Provinsi (Cari per Kabupaten/Kota) ---');
    
    const userCookie = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';
    const outputDir = path.join(__dirname, '../results/api_provinces');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const item of MISSING_DATA) {
        console.log(`\n📦 Memproses Provinsi: ${item.province}...`);
        let allResults: any[] = [];

        for (const regency of item.regencies) {
            try {
                console.log(`   🔍 Mencari Kabupaten/Kota: ${regency}...`);
                
                const html = await fetchPostalCodeHtml(regency, userCookie);
                const results = parsePostalCodeTable(html);

                if (results.length > 0) {
                    console.log(`   ✅ Ditemukan ${results.length} hasil untuk ${regency}.`);
                    allResults = [...allResults, ...results];
                } else {
                    console.log(`   ⚠️ Tidak ada hasil untuk ${regency}.`);
                }

                // Jeda 2 detik antar kabupaten untuk menghindari limit
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error: any) {
                console.error(`   ❌ Gagal memproses ${regency}:`, error.message);
            }
        }

        if (allResults.length > 0) {
            const fileName = `${item.province.toLowerCase().replace(/\s+/g, '_')}.json`;
            const outputPath = path.join(outputDir, fileName);
            
            // Gabungkan dengan data lama jika ada
            let finalData = allResults;
            if (fs.existsSync(outputPath)) {
                const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
                finalData = [...existingData, ...allResults];
            }

            fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
            console.log(`💾 Data ${item.province} diperbarui dengan total ${finalData.length} hasil.`);
        }
    }

    console.log('\n✨ Proses pelengkapan data selesai.');
}

runRegencyApiTest();
