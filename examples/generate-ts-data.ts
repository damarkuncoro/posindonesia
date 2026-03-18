import * as fs from 'fs';
import * as path from 'path';
import { PostalCodeData } from '../src/types.js';

/**
 * Script untuk mengonversi file JSON provinsi menjadi file TypeScript
 * yang dapat diimpor langsung dalam aplikasi, lengkap dengan kode wilayah.
 * 
 * VERSI 6: Menjamin data ter-group berdasarkan Provinsi yang benar dan ID Wilayah yang akurat.
 */

const BASE_DATA_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/data-wilayah-indonesia/csv";
const INPUT_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/posindonesia/results/api_provinces";
const OUTPUT_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/posindonesia/src/data";

interface JsonPostalCode {
    provinsi: string;
    kabupaten_kota: string;
    kecamatan: string;
    desa_kelurahan: string;
    kodepos: string;
}

function normalize(str: string): string {
    if (!str) return '';
    return str.trim().toUpperCase()
        .replace(/\s+/g, ' ')
        .replace(/[.,]/g, '')
        .replace(/KABUPATEN |KAB |KOTA |KECAMATAN |KEC |KELURAHAN |KEL |DESA |DS |ADM /g, '')
        .trim();
}

function basicNormalize(str: string): string {
    if (!str) return '';
    return str.trim().toUpperCase().replace(/\s+/g, ' ');
}

async function main() {
    console.log('--- Memulai Konversi JSON ke TypeScript (Versi 6) ---');
    
    if (!fs.existsSync(INPUT_DIR)) {
        console.error('❌ Direktori input tidak ditemukan.');
        return;
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Load Mappings
    const provincesMap = new Map<string, string>();
    const provinceInfoMap = new Map<string, string>();
    fs.readFileSync(`${BASE_DATA_DIR}/provinces.csv`, 'utf-8').split('\n').filter(l => l.trim() !== '').forEach(l => {
        const [id, name] = l.split(',');
        const norm = basicNormalize(name);
        provincesMap.set(norm, id);
        provinceInfoMap.set(id, norm);
    });

    const extra = { 'PAPUA SELATAN': '93', 'PAPUA TENGAH': '94', 'PAPUA PEGUNUNGAN': '95', 'PAPUA BARAT DAYA': '96' };
    Object.entries(extra).forEach(([n, id]) => { provincesMap.set(n, id); provinceInfoMap.set(id, n); });

    const regenciesMap = new Map<string, string>(); 
    fs.readFileSync(`${BASE_DATA_DIR}/regencies.csv`, 'utf-8').split('\n').filter(l => l.trim() !== '').forEach(l => {
        const [id, provId, name] = l.split(',');
        regenciesMap.set(`${provId}-${basicNormalize(name)}`, id);
        regenciesMap.set(`${provId}-${normalize(name)}`, id);
    });

    const districtsMap = new Map<string, string>();
    fs.readFileSync(`${BASE_DATA_DIR}/districts.csv`, 'utf-8').split('\n').filter(l => l.trim() !== '').forEach(l => {
        const [id, regId, name] = l.split(',');
        districtsMap.set(`${regId}-${normalize(name)}`, id);
    });

    const villagesMap = new Map<string, string>();
    fs.readFileSync(`${BASE_DATA_DIR}/villages.csv`, 'utf-8').split('\n').filter(l => l.trim() !== '').forEach(l => {
        const [id, distId, name] = l.split(',');
        villagesMap.set(`${distId}-${normalize(name)}`, id);
    });

    // 2. Load and Group
    const allRecords = new Map<string, PostalCodeData>();
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const raw: JsonPostalCode[] = JSON.parse(fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8'));
        raw.forEach(item => {
            const key = `${item.provinsi}|${item.kabupaten_kota}|${item.kecamatan}|${item.desa_kelurahan}|${item.kodepos}`.toUpperCase();
            if (allRecords.has(key)) return;

            const provNorm = basicNormalize(item.provinsi);
            const provId = provincesMap.get(provNorm) || '99';
            
            const cityNorm = normalize(item.kabupaten_kota);
            const cityId = regenciesMap.get(`${provId}-${basicNormalize(item.kabupaten_kota)}`) || regenciesMap.get(`${provId}-${cityNorm}`) || '';
            
            const distId = cityId ? districtsMap.get(`${cityId}-${normalize(item.kecamatan)}`) || '' : '';
            const villId = distId ? villagesMap.get(`${distId}-${normalize(item.desa_kelurahan)}`) || '' : '';

            allRecords.set(key, {
                province: item.provinsi,
                provinceCode: provId,
                city: item.kabupaten_kota,
                cityCode: cityId,
                district: item.kecamatan,
                districtCode: distId,
                village: item.desa_kelurahan,
                villageCode: villId,
                postalCode: item.kodepos
            });
        });
    }

    const grouped = new Map<string, PostalCodeData[]>();
    allRecords.forEach(record => {
        const id = record.provinceCode;
        if (!grouped.has(id)) grouped.set(id, []);
        grouped.get(id)!.push(record);
    });

    // 3. Write
    let loadersContent = "import { PostalCodeData } from '../types.js';\n\nexport type ProvinceLoader = () => Promise<Record<string, PostalCodeData[]>>;\n\nexport const PROVINCE_LOADERS: Record<string, ProvinceLoader> = {\n";
    let aliasContent = "export const PROVINCE_ALIAS_MAP: Record<string, string> = {\n";

    grouped.forEach((data, id) => {
        const provName = provinceInfoMap.get(id) || 'UNKNOWN';
        const fileBase = `${id}-${provName.toLowerCase().replace(/\s+/g, '-')}`;
        const variableName = provName.toUpperCase().replace(/\s+/g, '_');

        let tsContent = `import { PostalCodeData } from '../types.js';\n\nexport const ${variableName}: PostalCodeData[] = ${JSON.stringify(data, null, 2)};\n`;
        fs.writeFileSync(path.join(OUTPUT_DIR, `${fileBase}.ts`), tsContent);

        loadersContent += `  '${id}': () => import('./${fileBase}.js'),\n`;
        aliasContent += `  ${variableName}: '${id}',\n`;
    });

    loadersContent += "};\n\n" + aliasContent + "};\n";
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), loadersContent);
    console.log(`✨ Selesai! Berhasil mengonversi ${allRecords.size} data ke ${grouped.size} file.`);
}

main().catch(console.error);
