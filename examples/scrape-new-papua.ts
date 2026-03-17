import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script untuk mengambil data kodepos bagi 4 provinsi baru di Papua
 * yang belum ada di database administratif standar.
 */

const NEW_PAPUA_MAPPING = [
    { name: "PAPUA SELATAN", regencies: ["MERAUKE", "BOVEN DIGOEL", "MAPPI", "ASMAT"] },
    { name: "PAPUA TENGAH", regencies: ["NABIRE", "PANIAI", "MIMIKA", "PUNCAK JAYA", "DOGIYAI", "INTAN JAYA", "DEIYAI", "PUNCAK"] },
    { name: "PAPUA PEGUNUNGAN", regencies: ["JAYAWIJAYA", "PEGUNUNGAN BINTANG", "YAHUKIMO", "TOLIKARA", "LANNY JAYA", "MAMBERAMO TENGAH", "YALIMO", "NDUGA"] },
    { name: "PAPUA BARAT DAYA", regencies: ["SORONG", "RAJA AMPAT", "TAMBRAUW", "MAYBRAT"] }
];

const USER_COOKIE = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';

async function main() {
    console.log('--- Scraping 4 Provinsi Baru Papua ---');
    
    const outputDir = path.join(__dirname, '../results/api_provinces');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    for (const province of NEW_PAPUA_MAPPING) {
        console.log(`\n📦 Memproses: ${province.name}...`);
        let provinceData: any[] = [];

        for (const regency of province.regencies) {
            try {
                console.log(`   🔍 Mencari Kabupaten: ${regency}...`);
                const html = await fetchPostalCodeHtml(regency, USER_COOKIE);
                const results = parsePostalCodeTable(html);

                if (results.length > 0) {
                    console.log(`   ✅ Ditemukan ${results.length} hasil.`);
                    // Update province name in data
                    const updatedResults = results.map(r => ({ ...r, provinsi: province.name }));
                    provinceData = [...provinceData, ...updatedResults];
                } else {
                    console.log(`   ⚠️ Tidak ada hasil.`);
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: any) {
                console.error(`   ❌ Gagal:`, error.message);
            }
        }

        if (provinceData.length > 0) {
            const fileName = `${province.name.toLowerCase().replace(/\s+/g, '_')}.json`;
            const outputPath = path.join(outputDir, fileName);
            fs.writeFileSync(outputPath, JSON.stringify(provinceData, null, 2));
            console.log(`💾 Berhasil menyimpan total ${provinceData.length} data untuk ${province.name}.`);
        }
    }
}

main().catch(console.error);
