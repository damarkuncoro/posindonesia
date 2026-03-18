import { TsPostalCodeRepository } from '../src/infrastructure/repositories/TsPostalCodeRepository.js';
import { PostalCode } from '../src/domain/models/PostalCode.js';

async function main(): Promise<void> {
    console.log('--- Testing TsPostalCodeRepository Integration ---');
    
    const repo = new TsPostalCodeRepository();
    
    // Test Case 1: Cari data spesifik (misal: Monas)
    const keywords1 = ['GAMBIR', 'JAKARTA PUSAT'];
    console.log(`\n🔍 Mencari: ${keywords1.join(', ')}`);
    const results1: PostalCode[] = await repo.findByKeywords(keywords1);
    console.log(`✅ Ditemukan ${results1.length} hasil.`);
    results1.slice(0, 3).forEach((r: PostalCode) => console.log(`   - ${r.toString()}`));

    // Test Case 2: Cari data di provinsi baru (misal: Papua Selatan)
    const keywords2 = ['MERAUKE', 'PAPUA SELATAN'];
    console.log(`\n🔍 Mencari: ${keywords2.join(', ')}`);
    const results2: PostalCode[] = await repo.findByKeywords(keywords2);
    console.log(`✅ Ditemukan ${results2.length} hasil.`);
    results2.slice(0, 3).forEach((r: PostalCode) => console.log(`   - ${r.toString()}`));

    // Test Case 3: Cari data di Jawa Tengah (yang datanya sangat banyak)
    const keywords3 = ['SEMARANG', 'JAWA TENGAH'];
    console.log(`\n🔍 Mencari: ${keywords3.join(', ')}`);
    const results3: PostalCode[] = await repo.findByKeywords(keywords3);
    console.log(`✅ Ditemukan ${results3.length} hasil.`);
    
    console.log('\n✨ Integrasi Berhasil!');
}

main().catch(console.error);
