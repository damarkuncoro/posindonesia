import * as fs from 'fs';
import * as path from 'path';

/**
 * Script untuk menganalisis database.json dan menemukan entri
 * yang tidak memiliki kodepos (postalCode kosong).
 */

async function main() {
    console.log('--- Memulai Analisis Data Kosong ---');
    
    const dbPath = path.join(__dirname, '../results/database.json');
    const reportPath = path.join(__dirname, '../results/missing_data_report.log');

    if (!fs.existsSync(dbPath)) {
        console.error('❌ File database.json tidak ditemukan.');
        return;
    }

    console.log('Membaca database.json...');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    
    console.log(`Total data: ${data.length} records`);

    // Cari data dengan kodepos kosong atau tidak valid
    const missingData = data.filter((d: any) => !d.kodepos || d.kodepos.trim() === '');

    console.log(`Ditemukan ${missingData.length} data tanpa kodepos.`);

    if (missingData.length > 0) {
        // Kelompokkan berdasarkan provinsi
        const groupedByProvince = missingData.reduce((acc: any, curr: any) => {
            const prov = curr.provinsi || 'TIDAK DIKETAHUI';
            if (!acc[prov]) acc[prov] = [];
            acc[prov].push(curr);
            return acc;
        }, {});

        let reportContent = '=== LAPORAN DATA KODEPOS KOSONG ===\n';
        reportContent += `Tanggal Analisis: ${new Date().toISOString()}\n`;
        reportContent += `Total Data Kosong: ${missingData.length} dari ${data.length} records\n\n`;

        for (const [prov, items] of Object.entries(groupedByProvince)) {
            const typedItems = items as any[];
            reportContent += `\n[ ${prov} ] - ${typedItems.length} data kosong\n`;
            reportContent += `--------------------------------------------------\n`;
            
            // Tampilkan maksimal 10 contoh per provinsi di log agar tidak terlalu panjang
            const sample = typedItems.slice(0, 10);
            sample.forEach((item: any) => {
                reportContent += `- Desa: ${item.desa_kelurahan}, Kec: ${item.kecamatan}, Kab: ${item.kabupaten_kota}\n`;
            });
            
            if (typedItems.length > 10) {
                reportContent += `... dan ${typedItems.length - 10} data lainnya.\n`;
            }
        }

        fs.writeFileSync(reportPath, reportContent);
        console.log(`✅ Laporan berhasil disimpan ke: ${reportPath}`);
    } else {
        console.log('🎉 Luar biasa! Semua data memiliki kodepos.');
        fs.writeFileSync(reportPath, 'Semua data lengkap. Tidak ada kodepos yang kosong.');
    }
}

main().catch(console.error);
