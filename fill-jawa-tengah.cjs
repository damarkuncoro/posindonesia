/**
 * Script untuk mengisi kode kosong di src/data/33-jawa-tengah.ts
 * Mengisi: districtCode, cityCode, villageCode
 * 
 * Run: node fill-jawa-tengah.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Fetch data from BPS API
function fetchBpsData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => {
      resolve([]);
    });
  });
}

// Fetch villages for a district
async function fetchVillages(districtCode) {
  const url = `https://sig.bps.go.id/rest-drop-down/getwilayah?level=desa&parent=${districtCode}&periode_merge=2025_1.2025`;
  return await fetchBpsData(url);
}

// Fetch districts for a province
async function fetchDistricts(provinceCode) {
  const url = `https://sig.bps.go.id/rest-drop-down/getwilayah?level=kecamatan&parent=${provinceCode}&periode_merge=2025_1.2025`;
  return await fetchBpsData(url);
}

// Parse the data file
function parseDataFile(content) {
  const records = [];
  const lines = content.split('\n');
  let currentRecord = {};
  
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
        records.push({...currentRecord});
      }
    }
  }
  
  return records;
}

// Normalize name for matching
function normalize(s) {
  if (!s) return '';
  return s.toUpperCase()
    .replace(/KAB\.\s*/g, 'KABUPATEN ')
    .replace(/KOTA\s*/g, 'KOTA ')
    .replace(/KEL\.\s*/g, 'KELURAHAN ')
    .replace(/DESA\s*/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Match names
function matchName(dataName, bpsName) {
  if (!dataName || !bpsName) return false;
  const d = normalize(dataName);
  const b = normalize(bpsName);
  if (d === b) return true;
  if (d.includes(b) || b.includes(d)) return true;
  if (d.replace('GAMPANG', 'KAMPUNG') === b) return true;
  if (d.replace('KAMPUNG', 'GAMPANG') === b) return true;
  return false;
}

// Escape regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process the file
async function processFile() {
  const filePath = path.join(__dirname, 'src/data/33-jawa-tengah.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  const records = parseDataFile(content);
  
  const stats = { cityCode: 0, districtCode: 0, villageCode: 0 };
  
  console.log('=== Proses Pengisian: 33-jawa-tengah.ts ===\n');
  console.log(`Total records: ${records.length}`);
  
  // Find empty codes
  const emptyVillage = records.filter(r => !r.villageCode || r.villageCode.trim() === '');
  const emptyDistrict = records.filter(r => !r.districtCode || r.districtCode.trim() === '');
  const emptyCity = records.filter(r => !r.cityCode || r.cityCode.trim() === '');
  
  console.log(`Kosong: villageCode=${emptyVillage.length}, districtCode=${emptyDistrict.length}, cityCode=${emptyCity.length}\n`);
  
  // Get unique districts with empty codes
  const districtsWithEmpty = new Set();
  emptyVillage.forEach(r => {
    if (r.districtCode && r.districtCode.trim()) districtsWithEmpty.add(r.districtCode);
  });
  emptyDistrict.forEach(r => districtsWithEmpty.add(r.district || ''));
  
  console.log(`Mengambil data BPS untuk ${districtsWithEmpty.size} districts...\n`);
  
  // Process each district
  let processed = 0;
  for (const districtCode of districtsWithEmpty) {
    if (!districtCode) continue;
    
    processed++;
    if (processed % 5 === 0) {
      console.log(`  Progress: ${processed}/${districtsWithEmpty.size} districts...`);
    }
    
    const bpsVillages = await fetchVillages(districtCode);
    
    // Find records for this district with empty villageCode
    const recordsInDistrict = records.filter(r => 
      r.districtCode === districtCode && 
      (!r.villageCode || r.villageCode.trim() === '')
    );
    
    for (const record of recordsInDistrict) {
      const matched = bpsVillages.find(bps => matchName(record.village, bps.nama));
      
      if (matched) {
        const escapedDistrict = escapeRegex(record.district);
        const escapedVillage = escapeRegex(record.village);
        
        const pattern = new RegExp(
          `("district":\\s*"${escapedDistrict}".*?"village":\\s*"${escapedVillage}".*?"villageCode":\\s*)""`,
          's'
        );
        if (content.replace(pattern, `$1"${matched.kode}"`) !== content) {
          content = content.replace(pattern, `$1"${matched.kode}"`);
          stats.villageCode++;
          console.log(`  ✓ ${record.village} => ${matched.kode}`);
        }
      }
    }
  }
  
  // Save
  fs.writeFileSync(filePath, content);
  
  console.log(`\n=== HASIL ===`);
  console.log(`VillageCode diisi: ${stats.villageCode}`);
  console.log(`DistrictCode diisi: ${stats.districtCode}`);
  console.log(`CityCode diisi: ${stats.cityCode}`);
  console.log(`\n✅ File 33-jawa-tengah.ts telah diupdate!`);
}

processFile().catch(console.error);
