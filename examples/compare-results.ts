import { TsPostalCodeRepository } from '../src/infrastructure/repositories/TsPostalCodeRepository';
import { fetchPostalCodeHtml, parsePostalCodeTable } from '../src/main';

const USER_COOKIE = 'ci_session=siodf5sn3081n9fb1h3pfh7k8r92sjvt; TS011d97f9=01dc40192af9d2c68e0588cf6826f2541733c6f742d0e6382757bb95d8a2f8d27f6da94b22391892939703ae744a8f47fe7d578583';

async function main() {
    console.log('--- PERBANDINGAN HASIL: LOKAL VS INTERNET ---\n');
    
    const repo = new TsPostalCodeRepository();
    
    const testCases = [
        { name: 'Kota Besar', keyword: 'GAMBIR' },
        { name: 'Desa di Jawa', keyword: 'PANGANDARAN' },
        { name: 'Provinsi Baru', keyword: 'MERAUKE' },
        { name: 'Wilayah Spesifik', keyword: 'CILANDAK' }
    ];

    console.log('| Skenario | Keyword | Hasil Lokal | Waktu Lokal | Hasil Internet | Waktu Internet | Status |');
    console.log('|---|---|---|---|---|---|---|');

    for (const test of testCases) {
        // 1. Test Lokal
        const startLocal = performance.now();
        const localResults = await repo.findByKeywords([test.keyword]);
        const timeLocal = (performance.now() - startLocal).toFixed(2);

        // 2. Test Internet
        const startNet = performance.now();
        let netCount = 0;
        let errorMsg = '';
        try {
            const html = await fetchPostalCodeHtml(test.keyword, USER_COOKIE);
            const netResults = parsePostalCodeTable(html);
            netCount = netResults.length;
        } catch (e: any) {
            errorMsg = 'Error';
        }
        const timeNet = (performance.now() - startNet).toFixed(2);

        // Analisis
        const diff = Math.abs(localResults.length - netCount);
        const status = diff === 0 ? '✅ SAMA' : (localResults.length > netCount ? '🚀 LOKAL LEBIH BANYAK' : '⚠️ INTERNET LEBIH BANYAK');

        console.log(`| ${test.name} | ${test.keyword} | ${localResults.length} | ${timeLocal}ms | ${errorMsg || netCount} | ${timeNet}ms | ${status} |`);
        
        // Jeda sedikit agar tidak spam ke server
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\nCatatan:');
    console.log('- Hasil Lokal lebih cepat karena in-memory.');
    console.log('- Jika Hasil Lokal lebih banyak, mungkin karena pencarian lokal lebih fleksibel (fuzzy/partial match).');
    console.log('- Jika Hasil Internet lebih banyak, berarti database lokal perlu di-update.');
}

main().catch(console.error);
