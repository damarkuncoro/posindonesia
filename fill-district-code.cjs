/**
 * Script untuk mengisi districtCode kosong di src/data/33-jawa-tengah.ts
 * Dengan mengambil data dari BPS API
 * 
 * Run: node fill-district-code.cjs
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

// Fetch districts for a province
async function fetchDistricts(provinceCode) {
  const url = `https://sig.bps.go.id/rest-drop-down/getwilayah?level=kecamatan&parent=${provinceCode}&periode_merge=2025_1.2025`;
  return await fetchBpsData(url);
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

// Match names - more flexible
function matchName(dataName, bpsName) {
  if (!dataName || !bpsName) return false;
  const d = normalize(dataName);
  const b = normalize(bpsName);
  
  if (d === b) return true;
  if (d.includes(b) || b.includes(d)) return true;
  
  // Handle variations
  const variations = [
    ['BARAT', 'WEST'],
    ['TIMUR', 'EAST'],
    ['UTARA', 'NORTH'],
    ['SELATAN', 'SOUTH'],
    ['TENGAH', 'CENTRAL'],
    ['GAMPANG', 'KAMPUNG'],
    ['KAMPUNG', 'GAMPANG'],
  ];
  
  for (const [v1, v2] of variations) {
    if (d.replace(v1, v2) === b) return true;
    if (d.replace(v2, v1) === b) return true;
  }
  
  return false;
}

// Escape regex
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main function
async function main() {
  const filePath = path.join(__dirname, 'src/data/33-jawa-tengah.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  console.log('=== Mengisi districtCode kosong ===\n');
  
  // Get districts with empty districtCode
  const emptyDistrictNames = new Set();
  const lines = content.split('\n');
  
  for (const line of lines) {
    const districtMatch = line.match(/"district":\s*"([^"]*)"/);
    const districtCodeMatch = line.match(/"districtCode":\s*"([^"]*)"/);
    
    if (districtMatch && districtCodeMatch) {
      const districtName = districtMatch[1];
      const districtCode = districtCodeMatch[1];
      
      if (districtCode.trim() === '') {
        emptyDistrictNames.add(districtName);
      }
    }
  }
  
  console.log(`District dengan kode kosong: ${emptyDistrictNames.size}\n`);
  
  // Fetch BPS districts for Jawa Tengah
  console.log('Mengambil data BPS...');
  const bpsDistricts = await fetchDistricts('33');
  console.log(`Ditemukan ${bpsDistricts.length} districts dari BPS\n`);
  
  // Create mapping
  const districtMap = new Map(); // name -> kode
  bpsDistricts.forEach(d => {
    districtMap.set(d.nama, d.kode);
    districtMap.set(normalize(d.nama), d.kode);
  });
  
  // Also create partial match map
  const partialMatches = new Map();
  bpsDistricts.forEach(d => {
    const normName = normalize(d.nama);
    // Store first 2 words for partial matching
    const parts = normName.split(' ');
    if (parts.length >= 2) {
      const shortName = parts.slice(0, 2).join(' ');
      if (!partialMatches.has(shortName)) {
        partialMatches.set(shortName, d.kode);
      }
    }
  });
  
  let filledCount = 0;
  let notFoundCount = 0;
  const notFound = [];
  
  // Try to match each empty district
  for (const districtName of emptyDistrictNames) {
    let matchedKode = null;
    
    // Try exact match
    if (districtMap.has(districtName)) {
      matchedKode = districtMap.get(districtName);
    }
    
    // Try normalized match
    if (!matchedKode && districtMap.has(normalize(districtName))) {
      matchedKode = districtMap.get(normalize(districtName));
    }
    
    // Try partial match
    if (!matchedKode) {
      const normName = normalize(districtName);
      for (const [key, kode] of districtMap) {
        if (key.includes(normName) || normName.includes(key)) {
          matchedKode = kode;
          break;
        }
      }
    }
    
    // Try fuzzy match with key words
    if (!matchedKode) {
      const words = normalize(districtName).split(' ');
      for (const [key, kode] of districtMap) {
        const keyWords = key.split(' ');
        const common = words.filter(w => keyWords.includes(w));
        if (common.length >= Math.min(2, words.length)) {
          matchedKode = kode;
          break;
        }
      }
    }
    
    if (matchedKode) {
      const cityCode = matchedKode.substring(0, 4);
      
      // Replace in content
      const escapedDistrict = escapeRegex(districtName);
      const pattern = new RegExp(
        `("district":\\s*"${escapedDistrict}".*?)"districtCode":\\s*""`,
        's'
      );
      
      if (content.replace(pattern, `$1"districtCode": "${matchedKode}"`) !== content) {
        content = content.replace(pattern, `$1"districtCode": "${matchedKode}"`);
        
        // Also try to fill cityCode if empty
        const cityPattern = new RegExp(
          `("district":\\s*"${escapedDistrict}".*?)"cityCode":\\s*""`,
          's'
        );
        if (content.replace(cityPattern, `$1"cityCode": "${cityCode}"`) !== content) {
          content = content.replace(cityPattern, `$1"cityCode": "${cityCode}"`);
        }
        
        filledCount++;
        console.log(`  ✓ ${districtName} => ${matchedKode}`);
      }
    } else {
      notFoundCount++;
      notFound.push(districtName);
    }
  }
  
  // Save
  fs.writeFileSync(filePath, content);
  
  console.log(`\n=== HASIL ===`);
  console.log(`districtCode diisi: ${filledCount}`);
  console.log(`tidak ketemu: ${notFoundCount}`);
  
  if (notFound.length > 0) {
    console.log(`\nDistrict tidak ditemukan di BPS:`);
    notFound.slice(0, 10).forEach(d => console.log(`  - ${d}`));
    if (notFound.length > 10) {
      console.log(`  ... dan ${notFound.length - 10} lagi`);
    }
  }
  
  console.log(`\n✅ Selesai!`);
}

main().catch(console.error);
