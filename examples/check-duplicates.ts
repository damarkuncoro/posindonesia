import * as PROVINCES from '../src/data/index.js';
import { PostalCodeData } from '../src/types.js';

async function main(): Promise<void> {
    console.log('--- PENGECEKAN DUPLIKASI DATA ---\n');
    
    const provincesData = PROVINCES as Record<string, PostalCodeData[]>;
    const allData: PostalCodeData[] = Object.values(provincesData).flat();
    console.log(`Total Data: ${allData.length} records`);

    // 1. Cek Duplikasi Eksak (Semua field sama)
    const exactDuplicates = new Map<string, number>();
    const uniqueData = new Set<string>();

    allData.forEach((item: PostalCodeData) => {
        // Normalisasi string untuk perbandingan
        const key = JSON.stringify({
            p: item.province.trim().toUpperCase(),
            c: item.city.trim().toUpperCase(),
            d: item.district.trim().toUpperCase(),
            v: item.village.trim().toUpperCase(),
            pc: item.postalCode.trim()
        });

        if (uniqueData.has(key)) {
            exactDuplicates.set(key, (exactDuplicates.get(key) || 1) + 1);
        } else {
            uniqueData.add(key);
        }
    });

    console.log(`\n1. Duplikasi Eksak: ${exactDuplicates.size} kasus`);
    if (exactDuplicates.size > 0) {
        console.log('   Contoh:');
        let count = 0;
        for (const [key, num] of exactDuplicates) {
            if (count++ >= 5) break;
            const obj = JSON.parse(key);
            console.log(`   - ${obj.v}, ${obj.d} (${num}x)`);
        }
    }

    // 2. Cek Konflik Kodepos (Desa+Kecamatan sama, tapi Kodepos beda)
    const locationMap = new Map<string, Set<string>>();
    
    allData.forEach((item: PostalCodeData) => {
        const key = `${item.province.trim()}|${item.city.trim()}|${item.district.trim()}|${item.village.trim()}`.toUpperCase();
        
        if (!locationMap.has(key)) {
            locationMap.set(key, new Set());
        }
        locationMap.get(key)?.add(item.postalCode);
    });

    let conflictCount = 0;
    console.log('\n2. Konflik Kodepos (Satu lokasi punya >1 kodepos):');
    
    for (const [loc, codes] of locationMap) {
        if (codes.size > 1) {
            conflictCount++;
            if (conflictCount <= 10) {
                const [prov, city, dist, vill] = loc.split('|');
                console.log(`   - ${vill}, ${dist}, ${city}: [${Array.from(codes).join(', ')}]`);
            }
        }
    }
    console.log(`   Total Konflik: ${conflictCount} kasus`);

    // 3. Cek Duplikasi Kodepos (Satu kodepos dipakai >1 lokasi - ini wajar, tapi menarik untuk dilihat)
    const postalMap = new Map<string, number>();
    allData.forEach((item: PostalCodeData) => {
        postalMap.set(item.postalCode, (postalMap.get(item.postalCode) || 0) + 1);
    });

    const sharedCodes = Array.from(postalMap.entries()).filter(([_, count]) => count > 1);
    console.log(`\n3. Berbagi Kodepos: ${sharedCodes.length} kodepos digunakan oleh lebih dari 1 desa.`);
    
    // Cari kodepos yang paling banyak dipakai
    const mostShared = sharedCodes.sort((a, b) => b[1] - a[1])[0];
    if (mostShared) {
        console.log(`   Kodepos paling umum: ${mostShared[0]} (dipakai oleh ${mostShared[1]} desa)`);
    }
}

main().catch(console.error);
