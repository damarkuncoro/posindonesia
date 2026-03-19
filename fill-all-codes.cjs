/**
 * Script untuk mengisi SEMUA kode kosong di src/data
 * - cityCode (ambil dari 4 digit pertama districtCode)
 * - districtCode (ambil dari BPS API)  
 * - villageCode (ambil dari BPS API)
 * 
 * Menggunakan data resmi dari BPS API
 * 
 * Run: node fill-all-codes.cjs
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
  // Handle common variations
  if (d.replace('GAMPANG', 'KAMPUNG') === b) return true;
  if (d.replace('KAMPUNG', 'GAMPANG') === b) return true;
  return false;
}

// Escape regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process a single file
async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const records = parseDataFile(content);
  
  const stats = { cityCode: 0, districtCode: 0, villageCode: 0 };
  
  // Group records by district for processing
  const districtMap = new Map(); // districtCode -> { records, bpsVillages }
  const districtNeedsCode = new Map(); // districtName -> records with empty districtCode
  
  records.forEach(record => {
    // Handle empty districtCode
    if (!record.districtCode || record.districtCode.trim() === '') {
      if (!districtNeedsCode.has(record.district)) {
        districtNeedsCode.set(record.district, []);
      }
      districtNeedsCode.get(record.district).push(record);
    }
    
    // Handle empty villageCode
    if (!record.villageCode || record.villageCode.trim() === '') {
      if (record.districtCode && record.districtCode.trim() !== '') {
        if (!districtMap.has(record.districtCode)) {
          districtMap.set(record.districtCode, { records: [], fetched: false, data: [] });
        }
        districtMap.get(record.districtCode).records.push(record);
      }
    }
  });
  
  // Process districtCode (find from BPS based on district name)
  if (districtNeedsCode.size > 0) {
    const provinceCode = records[0]?.provinceCode;
    if (provinceCode) {
      const bpsDistricts = await fetchDistricts(provinceCode);
      
      for (const [districtName, emptyRecords] of districtNeedsCode) {
        const matched = bpsDistricts.find(d => matchName(districtName, d.nama));
        
        if (matched) {
          const newDistrictCode = matched.kode;
          const newCityCode = newDistrictCode.substring(0, 4); // Extract cityCode
          
          for (const record of emptyRecords) {
            const escapedDistrict = escapeRegex(record.district);
            
            // Replace districtCode
            const districtPattern = new RegExp(
              `("district":\\s*"${escapedDistrict}".*?)"districtCode":\\s*""`,
              's'
            );
            if (content.replace(districtPattern, `$1"districtCode": "${newDistrictCode}"`) !== content) {
              content = content.replace(districtPattern, `$1"districtCode": "${newDistrictCode}"`);
              stats.districtCode++;
              
              // Also fill cityCode from districtCode
              const cityPattern = new RegExp(
                `("city":\\s*"${escapeRegex(record.city)}".*?)"cityCode":\\s*""`,
                's'
              );
              if (content.replace(cityPattern, `$1"cityCode": "${newCityCode}"`) !== content) {
                content = content.replace(cityPattern, `$1"cityCode": "${newCityCode}"`);
                stats.cityCode++;
              }
            }
          }
        }
      }
    }
  }
  
  // Process villageCode (fetch from BPS)
  for (const [districtCode, districtData] of districtMap) {
    const bpsVillages = await fetchVillages(districtCode);
    districtData.data = bpsVillages;
    districtData.fetched = true;
  }
  
  // Now process village codes with fresh fetch
  for (const record of records) {
    if ((!record.villageCode || record.villageCode.trim() === '') && 
        record.districtCode && record.districtCode.trim() !== '') {
      
      const bpsVillages = await fetchVillages(record.districtCode);
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
        }
      }
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`  Filled: villageCode=${stats.villageCode}, districtCode=${stats.districtCode}, cityCode=${stats.cityCode}`);
  return stats;
}

// Main function
async function main() {
  const dataDir = path.join(__dirname, 'src/data');
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .sort();
  
  console.log('=== Pengisian Semua Kode (cityCode, districtCode, villageCode) ===\n');
  console.log('⚠️  Proses ini akan mengambil data dari BPS API untuk setiap district');
  console.log('⏱️  Mungkin memakan waktu beberapa menit...\n');
  
  let totalStats = { cityCode: 0, districtCode: 0, villageCode: 0 };
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`Processing: ${file}`);
    
    try {
      const stats = await processFile(filePath);
      totalStats.cityCode += stats.cityCode;
      totalStats.districtCode += stats.districtCode;
      totalStats.villageCode += stats.villageCode;
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }
  
  console.log(`\n=== HASIL AKHIR ===`);
  console.log(`Total villageCode diisi: ${totalStats.villageCode}`);
  console.log(`Total districtCode diisi: ${totalStats.districtCode}`);
  console.log(`Total cityCode diisi: ${totalStats.cityCode}`);
  console.log(`\n✅ Selesai!`);
}

main().catch(console.error);
