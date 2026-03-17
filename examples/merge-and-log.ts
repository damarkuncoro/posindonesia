import * as fs from 'fs';
import * as path from 'path';

/**
 * Script untuk menggabungkan semua file JSON provinsi menjadi satu database besar
 * dan membuat file log yang berisi ringkasan data.
 */

async function main() {
    console.log('--- Memulai Konsolidasi Database Kodepos ---');
    
    const inputDir = path.join(__dirname, '../results/api_provinces');
    const outputJsonPath = path.join(__dirname, '../results/database.json');
    const outputLogPath = path.join(__dirname, '../results/database.log');

    if (!fs.existsSync(inputDir)) {
        console.error('❌ Direktori input tidak ditemukan.');
        return;
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
    let allData: any[] = [];
    let logContent = '=== RINGKASAN DATABASE KODEPOS INDONESIA ===\n';
    logContent += `Tanggal Konsolidasi: ${new Date().toISOString()}\n\n`;
    logContent += '| No | Provinsi | Jumlah Data |\n';
    logContent += '|---|---|---|\n';

    let totalRecords = 0;
    let index = 1;

    for (const file of files) {
        try {
            const filePath = path.join(inputDir, file);
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            // Hapus duplikasi berdasarkan kodepos + desa + kecamatan
            const uniqueData = Array.from(new Set(fileData.map((d: any) => JSON.stringify(d))))
                                    .map((str: any) => JSON.parse(str));

            allData = [...allData, ...uniqueData];
            
            const provinceName = file.replace('.json', '').replace(/_/g, ' ').toUpperCase();
            logContent += `| ${index} | ${provinceName} | ${uniqueData.length} |\n`;
            
            totalRecords += uniqueData.length;
            index++;
        } catch (error: any) {
            console.error(`❌ Gagal memproses file ${file}:`, error.message);
        }
    }

    logContent += '\n=============================================\n';
    logContent += `TOTAL KESELURUHAN DATA: ${totalRecords} records\n`;
    logContent += '=============================================\n';

    // Simpan file JSON gabungan
    fs.writeFileSync(outputJsonPath, JSON.stringify(allData, null, 2));
    console.log(`✅ Berhasil membuat database.json dengan ${totalRecords} data.`);

    // Simpan file Log
    fs.writeFileSync(outputLogPath, logContent);
    console.log(`✅ Berhasil membuat database.log.`);
}

main().catch(console.error);
