/**
 * Script untuk mengambil data village code resmi dari BPS API
 * dan mengisi data yang kosong di src/data/33-jawa-tengah.ts
 * 
 * Run: node fill-from-bps.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Fetch village codes from BPS API
function fetchBpsVillageCodes(districtCode) {
  return new Promise((resolve, reject) => {
    const url = `https://sig.bps.go.id/rest-drop-down/getwilayah?level=desa&parent=${districtCode}&periode_merge=2025_1.2025`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.error(`Error parsing BPS data for district ${districtCode}:`, e);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error(`Error fetching BPS data for district ${districtCode}:`, err);
      resolve([]);
    });
  });
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

// Match village names (fuzzy matching)
function matchVillageName(dataVillage, bpsVillage) {
  const normalize = (s) => s.toUpperCase()
    .replace(/KEL\.\s*/g, '')
    .replace(/DESA\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const d = normalize(dataVillage);
  const b = normalize(bpsVillage);
  
  // Exact match
  if (d === b) return true;
  
  // Partial match
  if (d.includes(b) || b.includes(d)) return true;
  
  // Common variations
  if (d.replace('GAMPANG', 'KAMPUNG') === b) return true;
  if (d.replace('KAMPUNG', 'GAMPANG') === b) return true;
  if (d.replace('MENJANGAN', 'MENJANA') === b) return true;
  if (d.replace('-', ' ') === b.replace('-', ' ')) return true;
  
  return false;
}

// Main function
async function fillVillageCodesFromBps() {
  const filePath = path.join(__dirname, 'src/data/33-jawa-tengah.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse records
  const records = parseDataFile(content);
  
  // Find unique district codes with empty villageCode
  const districtMap = new Map();
  records.forEach(record => {
    if (!record.villageCode || record.villageCode.trim() === '') {
      if (!districtMap.has(record.districtCode)) {
        districtMap.set(record.districtCode, []);
      }
      districtMap.get(record.districtCode).push(record);
    }
  });
  
  console.log('=== Pengisian VillageCode dari BPS ===\n');
  console.log(`District dengan villageCode kosong: ${districtMap.size}\n`);
  
  let filledCount = 0;
  
  // Process each district
  for (const [districtCode, emptyRecords] of districtMap) {
    console.log(`\nMengambil data BPS untuk district ${districtCode}...`);
    
    const bpsVillages = await fetchBpsVillageCodes(districtCode);
    console.log(`Ditemukan ${bpsVillages.length} desa dari BPS`);
    
    // Match and fill
    for (const record of emptyRecords) {
      // Try to find matching village in BPS data
      const matched = bpsVillages.find(bps => 
        matchVillageName(record.village, bps.nama)
      );
      
      if (matched) {
        console.log(`  ✓ ${record.village} (${record.district}) => ${matched.kode}`);
        
        // Replace in content
        const searchPattern = new RegExp(
          `("district":\\s*"${record.district}".*?"village":\\s*"${record.village}".*?"villageCode":\\s*)""`,
          's'
        );
        content = content.replace(searchPattern, `$1"${matched.kode}"`);
        filledCount++;
      } else {
        console.log(`  ✗ ${record.village} (${record.district}) => TIDAK KETEMU`);
      }
    }
  }
  
  // Write back to file (uncomment to save)
  fs.writeFileSync(filePath, content);
  
  console.log(`\n=== Hasil ===`);
  console.log(`Total villageCode diisi: ${filledCount}`);
  console.log(`\n✅ File berhasil diupdate!`);
}

// Run
fillVillageCodesFromBps().catch(console.error);
