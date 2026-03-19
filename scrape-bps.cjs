/**
 * Script untuk scrape semua data wilayah dari BPS API
 * dan simpan ke data/sig.bps.go.id/2025_1.2025/
 * 
 * Struktur:
 * data/sig.bps.go.id/2025_1.2025/
 *   ├── provinces.json
 *   ├── 11-aceh/
 *   │   ├── cities.json
 *   │   ├── districts.json
 *   │   └── villages.json
 *   ├── 12-sumatera-utara/
 *   │   └── ...
 * 
 * Run: node scrape-bps.cjs
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
          console.error(`Error fetching ${url}:`, e.message);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error(`Error fetching ${url}:`, err.message);
      resolve([]);
    });
  });
}

// Get province list
async function getProvinces() {
  console.log('Fetching provinces...');
  const provinces = await fetchBpsData('provinsi', PERIODE);
  return provinces;
}

// Get cities for a province
async function getCities(provinceCode) {
  return await fetchBpsData('kabupaten', provinceCode);
}

// Get districts for a city
async function getDistricts(cityCode) {
  return await fetchBpsData('kecamatan', cityCode);
}

// Get villages for a district
async function getVillages(districtCode) {
  return await fetchBpsData('desa', districtCode);
}

// Save JSON to file
function saveJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✓ Saved: ${filePath}`);
}

// Main function
async function main() {
  console.log('=== SCRAPE DATA WILAYAH BPS ===\n');
  console.log(`Output: ${OUTPUT_DIR}\n`);
  
  // Create base directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Get provinces
  const provinces = await getProvinces();
  console.log(`Ditemukan ${provinces.length} provinces\n`);
  
  // Save provinces list
  saveJson(path.join(OUTPUT_DIR, 'provinces.json'), provinces);
  
  // Process each province
  for (const province of provinces) {
    const provCode = province.kode;
    const provName = province.nama;
    console.log(`\n[${provCode}] ${provName}`);
    
    const provDir = path.join(OUTPUT_DIR, `${provCode}-${provName.toLowerCase().replace(/\s+/g, '-')}`);
    
    // Get cities
    console.log(`  Fetching cities...`);
    const cities = await getCities(provCode);
    saveJson(path.join(provDir, 'cities.json'), cities);
    console.log(`  Found ${cities.length} cities`);
    
    // Process each city
    for (const city of cities) {
      const cityCode = city.kode;
      
      // Get districts
      const districts = await getDistricts(cityCode);
      
      // Save districts
      const cityDir = path.join(provDir, `${cityCode}-${city.nama.toLowerCase().replace(/\s+/g, '-')}`);
      saveJson(path.join(cityDir, 'districts.json'), districts);
      
      // Get villages for each district
      for (const district of districts) {
        const villages = await getVillages(district.kode);
        const districtDir = path.join(cityDir, `${district.kode}-${district.nama.toLowerCase().replace(/\s+/g, '-')}`);
        saveJson(path.join(districtDir, 'villages.json'), villages);
      }
      
      console.log(`    ✓ ${city.nama}: ${districts.length} districts`);
    }
  }
  
  console.log('\n=== SCRAPING COMPLETE ===');
  console.log(`Data saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
