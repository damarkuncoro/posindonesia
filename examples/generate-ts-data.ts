import * as fs from 'fs';
import * as path from 'path';
import { PostalCodeData } from '../src/types.js';

/**
 * Script untuk mengonversi file JSON provinsi menjadi file TypeScript
 * yang dapat diimpor langsung dalam aplikasi, lengkap dengan kode wilayah.
 * 
 * VERSI 5: Mendukung pemuatan dinamis (PROVINCE_LOADERS).
 */

const BASE_DATA_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/data-wilayah-indonesia/csv";

interface RawProvince {
    id: string;
    name: string;
}

interface JsonPostalCode {
    provinsi: string;
    kabupaten_kota: string;
    kecamatan: string;
    desa_kelurahan: string;
    kodepos: string;
}

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
    console.log('--- Memulai Konversi JSON ke TypeScript (Versi 5) ---');
    
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const inputDir = path.resolve(__dirname, '../results/api_provinces');
    const outputDir = path.resolve(__dirname, '../src/data');

    if (!fs.existsSync(inputDir)) {
        console.error('❌ Direktori input tidak ditemukan.');
        return;
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Load Data Administratif (CSV) ke Memori
    const provinces = fs.readFileSync(`${BASE_DATA_DIR}/provinces.csv`, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .reduce((acc, line) => {
            const [id, name] = line.split(',');
            const normName = basicNormalize(name);
            acc[normName] = { id, name: normName };
            const fileKey = name.trim().toLowerCase().replace(/\s+/g, '_');
            acc[fileKey] = { id, name: normName };
            return acc;
        }, {} as Record<string, RawProvince>);

    // Tambahan manual
    provinces['papua_selatan'] = { id: '93', name: 'PAPUA SELATAN' };
    provinces['papua_tengah'] = { id: '94', name: 'PAPUA TENGAH' };
    provinces['papua_pegunungan'] = { id: '95', name: 'PAPUA PEGUNUNGAN' };
    provinces['papua_barat_daya'] = { id: '96', name: 'PAPUA BARAT DAYA' };

    const regenciesMap: Record<string, string> = {};
    const globalRegenciesMap: Record<string, string> = {}; 
    fs.readFileSync(`${BASE_DATA_DIR}/regencies.csv`, 'utf-8').split('\n').filter(l => l.trim() !== '').forEach(l => {
        const [id, provId, name] = l.split(',');
        regenciesMap[`${provId}-${basicNormalize(name)}`] = id;
        regenciesMap[`${provId}-${normalize(name)}`] = id;
        globalRegenciesMap[normalize(name)] = id;
    });

    const districtsMap: Record<string, string> = {};
    fs.readFileSync(`${BASE_DATA_DIR}/districts.csv`, 'utf-8').split('\n').filter(l => l.trim() !== '').forEach(l => {
        const [id, regId, name] = l.split(',');
        districtsMap[`${regId}-${normalize(name)}`] = id;
    });

    const villagesMap: Record<string, string> = {};
    fs.readFileSync(`${BASE_DATA_DIR}/villages.csv`, 'utf-8').split('\n').filter(l => l.trim() !== '').forEach(l => {
        const [id, distId, name] = l.split(',');
        villagesMap[`${distId}-${normalize(name)}`] = id;
    });

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
    
    let loadersContent = "import { PostalCodeData } from '../types.js';\n\nexport type ProvinceLoader = () => Promise<Record<string, PostalCodeData[]>>;\n\nexport const PROVINCE_LOADERS: Record<string, ProvinceLoader> = {\n";
    let aliasContent = "export const PROVINCE_ALIAS_MAP: Record<string, string> = {\n";

    for (const file of files) {
        try {
            const fileData: JsonPostalCode[] = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf-8'));
            const provinceKey = file.replace('.json', '');
            const provinceInfo = provinces[provinceKey];
            if (!provinceInfo) continue;

            const tsFileName = `${provinceInfo.id}-${provinceKey.replace(/_/g, '-')}.ts`;
            const variableName = provinceKey.toUpperCase().replace(/_/g, '_');

            let tsContent = `import { PostalCodeData } from '../types.js';\n\nexport const ${variableName}: PostalCodeData[] = [\n`;
            
            const processedItems = new Set<string>();
            fileData.forEach((item: JsonPostalCode) => {
                const uniqueKey = `${item.provinsi}|${item.kabupaten_kota}|${item.kecamatan}|${item.desa_kelurahan}|${item.kodepos}`.toUpperCase();
                if (processedItems.has(uniqueKey)) return;
                processedItems.add(uniqueKey);

                const cityCode = regenciesMap[`${provinceInfo.id}-${basicNormalize(item.kabupaten_kota)}`] || regenciesMap[`${provinceInfo.id}-${normalize(item.kabupaten_kota)}`] || globalRegenciesMap[normalize(item.kabupaten_kota)];
                const distCode = cityCode ? districtsMap[`${cityCode}-${normalize(item.kecamatan)}`] : '';
                const villCode = distCode ? villagesMap[`${distCode}-${normalize(item.desa_kelurahan)}`] : '';

                tsContent += `  { province: "${item.provinsi}", provinceCode: "${provinceInfo.id}", city: "${item.kabupaten_kota}", cityCode: "${cityCode || ''}", district: "${item.kecamatan}", districtCode: "${distCode || ''}", village: "${item.desa_kelurahan}", villageCode: "${villCode || ''}", postalCode: "${item.kodepos}" },\n`;
            });
            tsContent += `];\n`;
            fs.writeFileSync(path.join(outputDir, tsFileName), tsContent);

            loadersContent += `  '${provinceInfo.id}': () => import('./${tsFileName.replace('.ts', '')}.js'),\n`;
            aliasContent += `  ${variableName}: '${provinceInfo.id}',\n`;
            
            console.log(`✅ ${tsFileName} processed.`);
        } catch (e: any) {
            console.error(`❌ Error ${file}:`, e.message);
        }
    }

    loadersContent += "};\n\n" + aliasContent + "};\n";
    fs.writeFileSync(path.join(outputDir, 'index.ts'), loadersContent);
    console.log(`✅ index.ts updated.`);
}

main().catch(console.error);
