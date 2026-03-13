import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pengujian integrasi langsung menggunakan parameter dari `curl` user.
 * Skrip ini akan mensimulasikan permintaan yang persis sama dengan curl yang diberikan.
 */
async function testDirectCurlIntegration() {
    console.log('--- Pengujian Integrasi Langsung (CariKodepos) ---');

    const keyword = 'ACEH';
    // Menggunakan cookie aktif dari input user
    const userCookie = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';

    try {
        console.log(`1. Mengirim permintaan POST ke CariKodepos untuk keyword: ${keyword}...`);
        const html = await fetchPostalCodeHtml(keyword, userCookie);

        console.log('2. Mem-parsing respons HTML...');
        const results = parsePostalCodeTable(html);

        if (results.length > 0) {
            console.log(`\n✅ Berhasil! Ditemukan ${results.length} hasil.`);
            
            // Simpan hasil ke folder results
            const outputPath = path.join(__dirname, '../results/curl_test_result.json');
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            console.log(`\n📂 Hasil lengkap disimpan di: ${outputPath}`);
            
            console.log('\nPratinjau 3 hasil pertama:');
            console.table(results.slice(0, 3));
        } else {
            console.log('\n❌ Tidak ada hasil yang ditemukan. Mungkin cookie telah kedaluwarsa.');
            // Simpan HTML untuk debugging jika gagal
            fs.writeFileSync(path.join(__dirname, '../results/debug_failed_curl.html'), html);
        }

    } catch (error: any) {
        console.error('\n❌ Terjadi kesalahan saat integrasi:', error.message);
    }
}

testDirectCurlIntegration();
