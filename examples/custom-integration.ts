import { fetchPostalCodeHtml, parsePostalCodeTable, findBestMatch } from '../src/main';

/**
 * Contoh integrasi kustom SDK @damarkuncoro/posindonesia
 * Menggunakan komponen-komponen SDK secara terpisah (API, Parser, Utils).
 */
async function runCustomExample() {
    console.log('--- Contoh Integrasi Kustom (Low-level API) ---');

    const keyword = 'Bakongan';
    const districtName = 'Bakongan';

    try {
        console.log(`\n1. Memanggil API Pos Indonesia untuk: ${keyword}...`);
        const html = await fetchPostalCodeHtml(keyword);

        console.log('2. Mem-parsing tabel hasil dari HTML...');
        const results = parsePostalCodeTable(html);
        console.log(`Ditemukan ${results.length} entri mentah.`);

        console.log(`3. Mencari kecocokan terbaik (Fuzzy Match) untuk Kecamatan ${districtName}...`);
        const bestMatch = findBestMatch(results, keyword, districtName);

        if (bestMatch) {
            console.log('\n✅ Kecocokan Terbaik Ditemukan:');
            console.log(`- Desa/Kelurahan : ${bestMatch.desa_kelurahan}`);
            console.log(`- Kecamatan      : ${bestMatch.kecamatan}`);
            console.log(`- Kode Pos       : ${bestMatch.kodepos}`);
        } else {
            console.log('\n❌ Tidak ditemukan kecocokan yang akurat.');
        }

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

runCustomExample();
