/**
 * Script untuk mengisi villageCode yang kosong di src/data/33-jawa-tengah.ts
 * Menggunakan logika: mencari nomor urut yang tersedia dalam setiap district
 */

import * as fs from 'fs';
import * as path from 'path';

interface PostalCodeData {
  province: string;
  provinceCode: string;
  city: string;
  cityCode: string;
  district: string;
  districtCode: string;
  village: string;
  villageCode: string;
  postalCode: string;
}

function fillEmptyVillageCodes(): void {
  const filePath = path.join(__dirname, 'src/data/33-jawa-tengah.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse all records
  const records: PostalCodeData[] = [];
  const lines = content.split('\n');
  let currentRecord: Partial<PostalCodeData> = {};
  
  for (const line of lines) {
    const provinceMatch = line.match(/"province":\s*"([^"]*)"/);
    const provinceCodeMatch = line.match(/"provinceCode":\s*"([^"]*)"/);
    const cityMatch = line.match(/"city":\s*"([^"]*)"/);
    const cityCodeMatch = line.match(/"cityCode":\s*"([^"]*)"/);
    const districtMatch = line.match(/"district":\s*"([^"]*)"/);
    const districtCodeMatch = line.match(/"districtCode":\s*"([^"]*)"/);
    const villageMatch = line.match(/"village":\s*"([^"]*)"/);
    const villageCodeMatch = line.match(/"villageCode":\s*"([^"]*)"/);
    const postalCodeMatch = line.match(/"postalCode":\s*"([^"]*)"/);
    
    if (provinceMatch) currentRecord = {};
    if (provinceMatch) currentRecord.province = provinceMatch[1];
    if (provinceCodeMatch) currentRecord.provinceCode = provinceCodeMatch[1];
    if (cityMatch) currentRecord.city = cityMatch[1];
    if (cityCodeMatch) currentRecord.cityCode = cityCodeMatch[1];
    if (districtMatch) currentRecord.district = districtMatch[1];
    if (districtCodeMatch) currentRecord.districtCode = districtCodeMatch[1];
    if (villageMatch) currentRecord.village = villageMatch[1];
    if (villageCodeMatch) currentRecord.villageCode = villageCodeMatch[1];
    if (postalCodeMatch) {
      currentRecord.postalCode = postalCodeMatch[1];
      if (currentRecord.province && currentRecord.districtCode) {
        records.push(currentRecord as PostalCodeData);
      }
    }
  }
  
  // Group by districtCode
  const districtMap = new Map<string, Set<string>>();
  const emptyVillageRecords: { record: PostalCodeData, index: number }[] = [];
  
  records.forEach((record, index) => {
    if (!districtMap.has(record.districtCode)) {
      districtMap.set(record.districtCode, new Set());
    }
    if (record.villageCode && record.villageCode.length > 0) {
      districtMap.get(record.districtCode)!.add(record.villageCode);
    } else {
      emptyVillageRecords.push({ record, index });
    }
  });
  
  console.log('=== Proses Pengisian VillageCode ===\n');
  console.log(`Total records: ${records.length}`);
  console.log(`Records dengan villageCode kosong: ${emptyVillageRecords.length}\n`);
  
  // Fill empty villageCodes
  let filledCount = 0;
  
  emptyVillageRecords.forEach(({ record }) => {
    const usedCodes = districtMap.get(record.districtCode) || new Set();
    
    // Find available code (001-999)
    for (let i = 1; i <= 999; i++) {
      const newCode = record.districtCode + i.toString().padStart(4, '0');
      if (!usedCodes.has(newCode)) {
        usedCodes.add(newCode);
        console.log(`MENGISI: ${record.village} (${record.district}) => ${newCode}`);
        
        // Replace in content
        const searchPattern = new RegExp(
          `("district":\\s*"${record.district}".*?"village":\\s*"${record.village}".*?"villageCode":\\s*)""`,
          's'
        );
        content = content.replace(searchPattern, `$1"${newCode}"`);
        filledCount++;
        break;
      }
    }
  });
  
  // Write back to file
  // fs.writeFileSync(filePath, content);
  console.log(`\n=== Hasil ===`);
  console.log(`VillageCode diisi: ${filledCount}`);
  console.log(`\nNote: File belum diubah. Uncomment fs.writeFileSync untuk menyimpan.`);
}

fillEmptyVillageCodes();
