import * as fs from 'fs';
import * as path from 'path';

/**
 * Script untuk mengonversi file JSON provinsi menjadi file TypeScript
 * yang dapat diimpor langsung dalam aplikasi, lengkap dengan kode wilayah.
 * 
 * VERSI 3: Dengan logika pencocokan khusus untuk Jakarta & Papua.
 */

const BASE_DATA_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/data-wilayah-indonesia/csv";

// Helper untuk normalisasi nama agar pencarian lebih akurat
function normalize(str: string): string {
    if (!str) return '';
    return str.trim().toUpperCase()
        .replace(/\s+/g, ' ') // Spasi ganda jadi satu
        .replace(/[.,]/g, '') // Hapus titik dan koma
        .replace(/KABUPATEN |KAB |KOTA |KECAMATAN |KEC |KELURAHAN |KEL |DESA |DS |ADM /g, '') // Hapus awalan umum
        .trim();
}

// Helper untuk normalisasi dasar (hanya uppercase dan trim)
function basicNormalize(str: string): string {
    if (!str) return '';
    return str.trim().toUpperCase().replace(/\s+/g, ' ');
}

async function main() {
    console.log('--- Memulai Konversi JSON ke TypeScript (Mapping V3) ---');
    
    const inputDir = path.join(__dirname, '../results/api_provinces');
    const outputDir = path.join(__dirname, '../src/data');

    if (!fs.existsSync(inputDir)) {
        console.error('❌ Direktori input tidak ditemukan.');
        return;
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Load Data Administratif (CSV) ke Memori
    console.log('📂 Memuat data administratif...');
    
    // Provinces
    const provinces = fs.readFileSync(`${BASE_DATA_DIR}/provinces.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .reduce((acc, line) => {
            const [id, name] = line.split(',');
            const normName = basicNormalize(name);
            acc[normName] = { id, name: normName };
            // Mapping untuk nama file
            const fileKey = name.trim().toLowerCase().replace(/\s+/g, '_');
            acc[fileKey] = { id, name: normName };
            return acc;
        }, {} as Record<string, { id: string, name: string }>);

    // Tambahan manual untuk provinsi baru
    provinces['papua_selatan'] = { id: '93', name: 'PAPUA SELATAN' };
    provinces['papua_tengah'] = { id: '94', name: 'PAPUA TENGAH' };
    provinces['papua_pegunungan'] = { id: '95', name: 'PAPUA PEGUNUNGAN' };
    provinces['papua_barat_daya'] = { id: '96', name: 'PAPUA BARAT DAYA' };

    // Regencies (Kabupaten/Kota)
    // Key: ProvinceID + NormalizedName -> RegencyID
    // Global Key: NormalizedName -> RegencyID (untuk pencarian lintas provinsi)
    const regenciesMap: Record<string, string> = {};
    const globalRegenciesMap: Record<string, string> = {}; // Peta global nama kabupaten -> ID

    fs.readFileSync(`${BASE_DATA_DIR}/regencies.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .forEach(line => {
            const [id, provinceId, name] = line.split(',');
            // Simpan versi normalisasi penuh (tanpa KAB/KOTA)
            const normName = normalize(name);
            const key = `${provinceId}-${normName}`;
            regenciesMap[key] = id;
            
            // Simpan ke peta global (jika nama unik, ini sangat membantu)
            // Jika ada duplikasi nama kabupaten antar provinsi, yang terakhir akan menang (risiko kecil)
            globalRegenciesMap[normName] = id;

            // Simpan juga versi basic (dengan KAB/KOTA tapi uppercase)
            const basicKey = `${provinceId}-${basicNormalize(name)}`;
            regenciesMap[basicKey] = id;
        });

    // Districts (Kecamatan)
    // Key: RegencyID + NormalizedName -> DistrictID
    const districtsMap: Record<string, string> = {};
    fs.readFileSync(`${BASE_DATA_DIR}/districts.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .forEach(line => {
            const [id, regencyId, name] = line.split(',');
            const key = `${regencyId}-${normalize(name)}`;
            districtsMap[key] = id;
        });

    // Villages (Desa/Kelurahan)
    // Key: DistrictID + NormalizedName -> VillageID
    const villagesMap: Record<string, string> = {};
    fs.readFileSync(`${BASE_DATA_DIR}/villages.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .forEach(line => {
            const [id, districtId, name] = line.split(',');
            const key = `${districtId}-${normalize(name)}`;
            villagesMap[key] = id;
        });

    console.log('✅ Data administratif dimuat.');

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
    let indexContent = '';

    for (const file of files) {
        try {
            const filePath = path.join(inputDir, file);
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            // Hapus duplikasi
            const uniqueData = Array.from(new Set(fileData.map((d: any) => JSON.stringify(d))))
                                    .map((str: any) => JSON.parse(str));

            const provinceKey = file.replace('.json', '');
            const provinceInfo = provinces[provinceKey];

            if (!provinceInfo) {
                console.warn(`⚠️ Tidak menemukan ID untuk provinsi: ${provinceKey}`);
                continue;
            }

            const tsFileName = `${provinceInfo.id}-${provinceKey.replace(/_/g, '-')}.ts`;
            const tsFilePath = path.join(outputDir, tsFileName);
            const variableName = provinceKey.toUpperCase().replace(/_/g, '_');

            let tsContent = `import { PostalCode } from '../types';\n\n`;
            tsContent += `export const ${variableName}: PostalCode[] = [\n`;
            
            let mappedCount = 0;

            uniqueData.forEach((item: any) => {
                // Gunakan normalisasi penuh untuk pencarian
                const provCode = provinceInfo.id;
                const normCity = normalize(item.kabupaten_kota);
                
                // 1. Cari City Code
                // Strategi 1: Cari di provinsi yang sama (Basic & Normalized)
                let cityCode = regenciesMap[`${provCode}-${basicNormalize(item.kabupaten_kota)}`];
                if (!cityCode) {
                    cityCode = regenciesMap[`${provCode}-${normCity}`];
                }

                // Strategi 2: Cari Global (Lintas Provinsi)
                // Ini sangat berguna untuk provinsi baru Papua yang datanya masih di ID provinsi lama
                if (!cityCode) {
                    cityCode = globalRegenciesMap[normCity];
                }

                // 2. Cari District Code
                let distCode = '';
                if (cityCode) {
                    distCode = districtsMap[`${cityCode}-${normalize(item.kecamatan)}`];
                }

                // 3. Cari Village Code
                let villCode = '';
                if (distCode) {
                    villCode = villagesMap[`${distCode}-${normalize(item.desa_kelurahan)}`];
                }

                if (villCode) mappedCount++;

                tsContent += `  {\n`;
                tsContent += `    province: "${item.provinsi}",\n`;
                tsContent += `    provinceCode: "${provCode}",\n`;
                tsContent += `    city: "${item.kabupaten_kota}",\n`;
                tsContent += `    cityCode: "${cityCode || ''}",\n`;
                tsContent += `    district: "${item.kecamatan}",\n`;
                tsContent += `    districtCode: "${distCode || ''}",\n`;
                tsContent += `    village: "${item.desa_kelurahan}",\n`;
                tsContent += `    villageCode: "${villCode || ''}",\n`;
                tsContent += `    postalCode: "${item.kodepos}"\n`;
                tsContent += `  },\n`;
            });

            tsContent += `];\n`;

            fs.writeFileSync(tsFilePath, tsContent);
            console.log(`✅ ${tsFileName}: ${uniqueData.length} records (Mapped: ${mappedCount})`);

            const importName = variableName;
            indexContent += `export { ${importName} } from './${tsFileName.replace('.ts', '')}';\n`;

        } catch (error: any) {
            console.error(`❌ Gagal memproses file ${file}:`, error.message);
        }
    }

    fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
    console.log(`✅ Berhasil membuat index.ts`);
}

main().catch(console.error);
