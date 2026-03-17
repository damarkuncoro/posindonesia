import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script untuk melengkapi database kodepos untuk provinsi-provinsi yang masih kosong
 * dengan cara mencari data berdasarkan seluruh Kabupaten/Kota (Regency) di dalamnya.
 */

const BASE_DATA_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/data-wilayah-indonesia/csv";
const USER_COOKIE = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';

// Daftar ID Provinsi yang ingin dilengkapi secara menyeluruh
const TARGET_PROVINCE_IDS = [
    "12", "13", "16", "19", "21", "31", "32", "35", 
    "52", "53", "61", "62", "63", "64", "65", 
    "71", "72", "73", "74", "76", "82", "91"
];

async function main() {
    console.log('--- Melengkapi Database Kodepos Indonesia (Seluruh Provinsi & Kabupaten) ---');
    
    const outputDir = path.join(__dirname, '../results/api_provinces');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // 1. Load Mapping Provinsi
    const provinces = fs.readFileSync(`${BASE_DATA_DIR}/provinces.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .reduce((acc, line) => {
            const [id, name] = line.split(',');
            acc[id] = name.trim();
            return acc;
        }, {} as Record<string, string>);

    // 2. Load Mapping Kabupaten/Kota
    const regenciesRaw = fs.readFileSync(`${BASE_DATA_DIR}/regencies.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '');

    for (const provinceId of TARGET_PROVINCE_IDS) {
        const provinceName = provinces[provinceId];
        if (!provinceName) continue;

        console.log(`\n📦 Memproses Provinsi: ${provinceName} (ID: ${provinceId})...`);
        
        // Filter kabupaten untuk provinsi ini
        const provinceRegencies = regenciesRaw
            .filter(line => line.split(',')[1] === provinceId)
            .map(line => line.split(',')[2].trim());

        let provinceData: any[] = [];

        for (const fullRegencyName of provinceRegencies) {
            // Gunakan nama tanpa KABUPATEN/KOTA sebagai keyword utama
            const keyword = fullRegencyName.replace(/KABUPATEN |KOTA /g, '');

            try {
                console.log(`   🔍 Mencari: ${keyword}...`);
                const html = await fetchPostalCodeHtml(keyword, USER_COOKIE);
                const results = parsePostalCodeTable(html);

                if (results.length > 0) {
                    console.log(`   ✅ Ditemukan ${results.length} hasil.`);
                    provinceData = [...provinceData, ...results];
                } else {
                    console.log(`   ⚠️ Tidak ada hasil untuk ${keyword}.`);
                }

                // Jeda 2 detik antar kabupaten
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: any) {
                console.error(`   ❌ Gagal untuk ${keyword}:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (provinceData.length > 0) {
            const fileName = `${provinceName.toLowerCase().replace(/\s+/g, '_')}.json`;
            const outputPath = path.join(outputDir, fileName);
            
            // Simpan data (overwriting atau merging bisa dilakukan di sini, kita overwrite untuk clean)
            fs.writeFileSync(outputPath, JSON.stringify(provinceData, null, 2));
            console.log(`💾 Berhasil menyimpan total ${provinceData.length} data untuk ${provinceName}.`);
        }
    }

    console.log('\n✨ Batch pemrosesan selesai.');
}

main().catch(console.error);
