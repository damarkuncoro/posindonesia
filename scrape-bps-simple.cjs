/**
 * Script scrape data BPS - VERSI SEDERHANA
 * Hanya mengambil: Province -> District -> Village
 * (Tanpa intermediate city level untuk mempercepat)
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
          resolve([]);
        }
      });
    }).on('error', () => {
      resolve([]);
    });
  });
}

// Delay between requests (avoid rate limit)
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
  console.log('=== SCRAPE DATA WILAYAH BPS (Simple) ===\n');
  
  // Get provinces
  const provinces = await fetchBpsData('provinsi', PERIODE);
  console.log(`Provinces: ${provinces.length}`);
  
  saveJson(path.join(OUTPUT_DIR, 'provinces.json'), provinces);
  
  let totalDistricts = 0;
  let totalVillages = 0;
  
  for (const province of provinces) {
    console.log(`\n[${province.kode}] ${province.nama}...`);
    
    // Get districts directly from province
    const districts = await fetchBpsData('kecamatan', province.kode);
    
    // Save districts for this province
    const provDir = path.join(OUTPUT_DIR, province.kode);
    saveJson(path.join(provDir, 'districts.json'), districts);
    
    totalDistricts += districts.length;
    console.log(`  Districts: ${districts.length}`);
    
    // Get villages for each district
    for (const district of districts) {
      const villages = await fetchBpsData('desa', district.kode);
      
      const distDir = path.join(provDir, district.kode);
      saveJson(path.join(distDir, 'villages.json'), villages);
      
      totalVillages += villages.length;
      
      // Small delay to avoid rate limit
      await delay(50);
    }
    
    await delay(100);
  }
  
  console.log('\n=== COMPLETE ===');
  console.log(`Total Provinces: ${provinces.length}`);
  console.log(`Total Districts: ${totalDistricts}`);
  console.log(`Total Villages: ${totalVillages}`);
  console.log(`\nSaved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
