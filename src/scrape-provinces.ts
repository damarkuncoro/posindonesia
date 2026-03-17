import * as fs from 'fs';
import * as path from 'path';
import { ScrapePostalCode } from './application/use-cases/ScrapePostalCode';

/**
 * Script to scrape postal codes for each province.
 * It joins data from provinces.csv, regencies.csv, districts.csv, and villages.csv
 * to get the village names and their parent hierarchy.
 */

const BASE_DATA_DIR = "/Users/damarkuncoro/SATU RAYA INTEGRASI/@damarkuncoro/data-wilayah-indonesia/csv";

async function main() {
  const scraper = new ScrapePostalCode();
  const resultsDir = path.resolve(__dirname, '../results/provinces');

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  console.log("📂 Loading administrative data...");

  // 1. Load Provinces and Add missing ones
  const provinces = fs.readFileSync(`${BASE_DATA_DIR}/provinces.csv`, 'utf-8')
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [id, name] = line.split(',');
      return { id, name };
    });

  // Add 4 new provinces manually if missing
  const newProvinces = [
    { id: "93", name: "PAPUA SELATAN" },
    { id: "95", name: "PAPUA PEGUNUNGAN" },
    { id: "96", name: "PAPUA BARAT DAYA" }
  ];
  // Note: 94 is PAPUA (already in CSV), but some sources use 94 for PAPUA TENGAH. 
  // We'll stick to CSV's 94 for PAPUA and add others if they don't exist.
  newProvinces.forEach(np => {
    if (!provinces.find(p => p.id === np.id)) provinces.push(np);
  });

  // 2. Load Regencies
  const regencies = fs.readFileSync(`${BASE_DATA_DIR}/regencies.csv`, 'utf-8')
    .split('\n')
    .filter(line => line.trim() !== '')
    .reduce((acc, line) => {
      const [id, provinceId, name] = line.split(',');
      acc[id] = name;
      return acc;
    }, {} as Record<string, string>);

  // 3. Load Districts
  const districts = fs.readFileSync(`${BASE_DATA_DIR}/districts.csv`, 'utf-8')
    .split('\n')
    .filter(line => line.trim() !== '')
    .reduce((acc, line) => {
      const [id, regencyId, name] = line.split(',');
      acc[id] = name;
      return acc;
    }, {} as Record<string, string>);

  // 4. Load Villages
  const villagesLines = fs.readFileSync(`${BASE_DATA_DIR}/villages.csv`, 'utf-8')
    .split('\n')
    .filter(line => line.trim() !== '');

  console.log(`🚀 Starting scraping for ${provinces.length} provinces...\n`);

  for (const province of provinces) {
    console.log(`📦 Processing: ${province.name}...`);
    
    // Find villages for this province
    const provinceVillages = villagesLines
      .filter(line => line.startsWith(province.id))
      .slice(0, 3) // Take first 3 villages
      .map(line => {
        const [id, districtId, name] = line.split(',');
        const regencyId = districtId.substring(0, 4);
        return {
          kode: id,
          nama: name,
          provinsi: province.name,
          kabupaten: regencies[regencyId] || "KAB.",
          kecamatan: districts[districtId] || "KEC.",
          desa: name
        };
      });

    if (provinceVillages.length === 0) {
      console.log(`⚠️ No villages found for ${province.name}.`);
      continue;
    }

    // Create a temporary CSV for the current province
    const tempCsvPath = path.resolve(__dirname, `../data/temp_${province.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    const header = "kode,nama,provinsi,kabupaten,kecamatan,desa";
    const body = provinceVillages.map(v => `${v.kode},${v.nama},${v.provinsi},${v.kabupaten},${v.kecamatan},${v.desa}`).join('\n');
    fs.writeFileSync(tempCsvPath, `${header}\n${body}`);

    try {
      const results = await scraper.execute({
        input: tempCsvPath,
        limit: 3,
        delay: 500
      });

      const outputPath = path.join(resultsDir, `${province.id}_${province.name.replace(/\s+/g, '_').toLowerCase()}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`✅ Saved ${results.length} results to: ${outputPath}\n`);
    } catch (error: any) {
      console.error(`❌ Error scraping ${province.name}: ${error.message}\n`);
    } finally {
      if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    }
  }

  console.log("✨ All provinces processed.");
}

main().catch(console.error);
