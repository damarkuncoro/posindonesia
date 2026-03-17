import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script untuk melengkapi database kodepos untuk provinsi-provinsi yang masih minim data
 * dengan cara mencari data berdasarkan tingkat Kecamatan (District).
 */

const BASE_DATA_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/data-wilayah-indonesia/csv";
const USER_COOKIE = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';

// Daftar ID Provinsi yang datanya masih minim
const TARGET_PROVINCE_IDS = ["14", "31", "33", "34", "36", "94"];

async function main() {
    console.log('--- Melengkapi Database Kodepos (Tingkat Kecamatan) ---');
    
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

    // 2. Load Mapping Kecamatan
    const districtsRaw = fs.readFileSync(`${BASE_DATA_DIR}/districts.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '');

    for (const provinceId of TARGET_PROVINCE_IDS) {
        const provinceName = provinces[provinceId];
        if (!provinceName) continue;

        console.log(`\n📦 Memproses Provinsi: ${provinceName} (ID: ${provinceId})...`);
        
        // Filter kecamatan untuk provinsi ini
        const provinceDistricts = districtsRaw
            .filter(line => line.startsWith(provinceId))
            .map(line => line.split(',')[2].trim())
            .slice(0, 10); // Ambil 10 kecamatan pertama per provinsi untuk tes awal

        let provinceData: any[] = [];

        for (const districtName of provinceDistricts) {
            try {
                console.log(`   🔍 Mencari Kecamatan: ${districtName}...`);
                const html = await fetchPostalCodeHtml(districtName, USER_COOKIE);
                const results = parsePostalCodeTable(html);

                if (results.length > 0) {
                    console.log(`   ✅ Ditemukan ${results.length} hasil.`);
                    provinceData = [...provinceData, ...results];
                } else {
                    console.log(`   ⚠️ Tidak ada hasil untuk ${districtName}.`);
                }

                // Jeda 3 detik antar kecamatan
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error: any) {
                console.error(`   ❌ Gagal untuk ${districtName}:`, error.message);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }

        if (provinceData.length > 0) {
            const fileName = `${provinceName.toLowerCase().replace(/\s+/g, '_')}.json`;
            const outputPath = path.join(outputDir, fileName);
            
            // Gabungkan dengan data lama jika ada
            let finalData = provinceData;
            if (fs.existsSync(outputPath)) {
                try {
                    const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
                    // Gunakan Set untuk menghindari duplikasi berdasarkan kodepos + desa + kecamatan
                    const seen = new Set(existingData.map((d: any) => `${d.kodepos}-${d.desa_kelurahan}-${d.kecamatan}`));
                    const newData = provinceData.filter(d => !seen.has(`${d.kodepos}-${d.desa_kelurahan}-${d.kecamatan}`));
                    finalData = [...existingData, ...newData];
                } catch (e) {
                    console.error(`   ⚠️ Gagal menggabungkan data lama untuk ${provinceName}`);
                }
            }

            fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
            console.log(`💾 Berhasil memperbarui total ${finalData.length} data untuk ${provinceName}.`);
        }
    }

    console.log('\n✨ Proses pelengkapan tingkat kecamatan selesai.');
}

main().catch(console.error);
