/**
 * Script scrape data WILAYAH (province, district, village) dari BPS
 * Tanpa kode pos - karena data kode pos sudah ada di src/data/
 * 
 * Struktur Output:
 * data/sig.bps.go.id/2025_1.2025/
 *   ├── provinces.json
 *   ├── 11/
 *   │   ├── districts.json
 *   │   └── 1101010/villages.json
 *   └── ...
 * 
 * Run: node scrape-bps-simple.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://sig.bps.go.id/rest-drop-down/getwilayah';
const PERIODE = '2025_1.2025';
const OUTPUT_DIR = path.join(__dirname, 'data/sig.bps.go.id', PERIODE);

// Fetch data from BPS API
function fetchBpsData(level, parentCode) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}?level=${level}&parent=${parentCode}&periode_merge=${PERIODE}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.error(`Error: ${url}`);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error(`Error: ${url} - ${err.message}`);
      resolve([]);
    });
  });
}

// Delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Save JSON
function saveJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function main() {
  console.log('=== SCRAPE DATA WILAYAH BPS ===');
  console.log(`Output: ${OUTPUT_DIR}\n`);
  
  // Create base directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Get provinces
  console.log('Fetching provinces...');
  const provinces = await fetchBpsData('provinsi', PERIODE);
  console.log(`Found ${provinces.length} provinces\n`);
  
  saveJson(path.join(OUTPUT_DIR, 'provinces.json'), provinces);
  
  let totalDistricts = 0;
  let totalVillages = 0;
  
  // Process each province
  for (const province of provinces) {
    const provCode = province.kode;
    console.log(`[${provCode}] ${province.nama}...`);
    
    // Get districts
    const districts = await fetchBpsData('kecamatan', provCode);
    
    // Save districts
    const provDir = path.join(OUTPUT_DIR, provCode);
    saveJson(path.join(provDir, 'districts.json'), districts);
    
    totalDistricts += districts.length;
    console.log(`  Districts: ${districts.length}`);
    
    // Get villages for each district
    for (const district of districts) {
      await delay(30); // Rate limiting
      
      const villages = await fetchBpsData('desa', district.kode);
      
      const distDir = path.join(provDir, district.kode);
      saveJson(path.join(distDir, 'villages.json'), villages);
      
      totalVillages += villages.length;
    }
    
    await delay(50); // Rate limiting between provinces
  }
  
  console.log('\n=== COMPLETE ===');
  console.log(`Provinces: ${provinces.length}`);
  console.log(`Districts: ${totalDistricts}`);
  console.log(`Villages: ${totalVillages}`);
  console.log(`\nSaved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
