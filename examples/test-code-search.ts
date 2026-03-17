import { TsPostalCodeRepository } from '../src/infrastructure/repositories/TsPostalCodeRepository';

async function main() {
    console.log('--- Testing Code Search Feature ---\n');
    
    const repo = new TsPostalCodeRepository();
    
    // Test Case 1: Cari berdasarkan Kodepos (Postal Code)
    const postalCode = '10110'; // Gambir
    console.log(`🔍 Mencari Kodepos: ${postalCode}`);
    const results1 = await repo.findByCode(postalCode);
    console.log(`✅ Ditemukan ${results1.length} hasil.`);
    results1.forEach(r => console.log(`   - ${r.toString()}`));

    // Test Case 2: Cari berdasarkan Kode Provinsi (Province Code)
    const provCode = '31'; // DKI Jakarta
    console.log(`\n🔍 Mencari Kode Provinsi: ${provCode}`);
    const results2 = await repo.findByCode(provCode);
    console.log(`✅ Ditemukan ${results2.length} hasil.`);
    console.log(`   (Menampilkan 3 sampel pertama)`);
    results2.slice(0, 3).forEach(r => console.log(`   - ${r.toString()}`));

    // Test Case 3: Cari berdasarkan Kode Kota (City Code)
    const cityCode = '3171'; // Jakarta Pusat
    console.log(`\n🔍 Mencari Kode Kota: ${cityCode}`);
    const results3 = await repo.findByCode(cityCode);
    console.log(`✅ Ditemukan ${results3.length} hasil.`);
    console.log(`   (Menampilkan 3 sampel pertama)`);
    results3.slice(0, 3).forEach(r => console.log(`   - ${r.toString()}`));

    // Test Case 4: Cari berdasarkan Kode Kecamatan (District Code)
    const distCode = '3171010'; // Gambir
    console.log(`\n🔍 Mencari Kode Kecamatan: ${distCode}`);
    const results4 = await repo.findByCode(distCode);
    console.log(`✅ Ditemukan ${results4.length} hasil.`);
    results4.forEach(r => console.log(`   - ${r.toString()}`));

    console.log('\n✨ Fitur Pencarian Kode Berhasil!');
}

main().catch(console.error);
