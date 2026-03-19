/**
 * Script untuk mengisi villageCode kosong di SEMUA file src/data
 * Menggunakan data resmi dari BPS API
 * 
 * Run: node fill-all-from-bps.cjs
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

// Match village names with fuzzy matching
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
  
  // Partial match (one contains the other)
  if (d.includes(b) || b.includes(d)) return true;
  
  // Common variations
  if (d.replace('GAMPANG', 'KAMPUNG') === b) return true;
  if (d.replace('KAMPUNG', 'GAMPANG') === b) return true;
  if (d.replace('MENJANGAN', 'MENJANA') === b) return true;
  if (d.replace('-', ' ') === b.replace('-', ' ')) return true;
  if (d.replace(/[^A-Z]/g, '') === b.replace(/[^A-Z]/g, '')) return true;
  
  return false;
}

// Escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process a single file
async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const records = parseDataFile(content);
  
  const districtMap = new Map();
  records.forEach(record => {
    if (!record.villageCode || record.villageCode.trim() === '') {
      if (!districtMap.has(record.districtCode)) {
        districtMap.set(record.districtCode, []);
      }
      districtMap.get(record.districtCode).push(record);
    }
  });
  
  if (districtMap.size === 0) return 0;
  
  console.log(`  Districts dengan villageCode kosong: ${districtMap.size}`);
  
  let filledCount = 0;
  let matchedNotReplaced = 0;
  
  for (const [districtCode, emptyRecords] of districtMap) {
    const bpsVillages = await fetchBpsVillageCodes(districtCode);
    
    if (bpsVillages.length === 0) {
      console.log(`  WARNING: Tidak ada data BPS untuk district ${districtCode}`);
    }
    
    for (const record of emptyRecords) {
      const matched = bpsVillages.find(bps => 
        matchVillageName(record.village, bps.nama)
      );
      
      if (matched) {
        const escapedDistrict = escapeRegex(record.district);
        const escapedVillage = escapeRegex(record.village);
        
        const searchPattern = new RegExp(
          `("district":\\s*"${escapedDistrict}".*?"village":\\s*"${escapedVillage}".*?"villageCode":\\s*)""`,
          's'
        );
        const result = content.replace(searchPattern, `$1"${matched.kode}"`);
        if (result !== content) {
          content = result;
          filledCount++;
        } else {
          matchedNotReplaced++;
        }
      }
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`  => VillageCode diisi: ${filledCount}, matched tapi tidak replace: ${matchedNotReplaced}`);
  return filledCount;
}

// Main function
async function main() {
  const dataDir = path.join(__dirname, 'src/data');
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .sort();
  
  console.log('=== Pengisian VillageCode untuk SEMUA Province ===\n');
  
  let totalFilled = 0;
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`\nProcessing: ${file}...`);
    
    const filled = await processFile(filePath);
    totalFilled += filled;
  }
  
  console.log(`\n=== HASIL AKHIR ===`);
  console.log(`Total villageCode diisi: ${totalFilled}`);
  console.log(`\n✅ Semua file telah diupdate!`);
}

main().catch(console.error);
