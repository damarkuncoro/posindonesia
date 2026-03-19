/**
 * Validasi data untuk src/data/33-jawa-tengah.ts
 * Mengecek apakah ada field code yang kosong
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

interface ValidationResult {
  field: string;
  record: PostalCodeData;
  line: number;
}

function validateJawaTengahData(): void {
  const filePath = path.join(__dirname, 'src/data/33-jawa-tengah.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract all postalCode records with line numbers
  const lines = content.split('\n');
  const results: ValidationResult[] = [];
  
  let braceCount = 0;
  let currentRecord: Partial<PostalCodeData> = {};
  let recordStartLine = 0;
  let inRecord = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Track if we're inside an object
    if (line.includes('{')) {
      if (!inRecord && line.includes('province')) {
        inRecord = true;
        recordStartLine = lineNum;
        currentRecord = {};
      }
      braceCount += (line.match(/{/g) || []).length;
    }
    
    if (inRecord) {
      // Check each field
      const fieldMatch = line.match(/"(\w+)":\s*"([^"]*)"/);
      if (fieldMatch) {
        const [, field, value] = fieldMatch;
        (currentRecord as any)[field] = value;
        
        // Check if value is empty
        if (value === '' || value.trim() === '') {
          results.push({
            field,
            record: currentRecord as PostalCodeData,
            line: lineNum
          });
        }
      }
    }
    
    if (line.includes('}')) {
      braceCount -= (line.match(/}/g) || []).length;
      if (braceCount === 0 && inRecord) {
        inRecord = false;
      }
    }
  }
  
  // Print results
  console.log('=== Validasi Data src/data/33-jawa-tengah.ts ===\n');
  
  if (results.length === 0) {
    console.log('✅ Tidak ada data yang kosong!');
  } else {
    console.log(`❌ Ditemukan ${results.length} field kosong:\n`);
    
    // Group by field type
    const grouped = results.reduce((acc: Record<string, ValidationResult[]>, r) => {
      if (!acc[r.field]) acc[r.field] = [];
      acc[r.field].push(r);
      return acc;
    }, {});
    
    for (const [field, items] of Object.entries(grouped)) {
      console.log(`\n--- ${field} (${items.length} kosong) ---`);
      items.slice(0, 5).forEach(item => {
        console.log(`  Line ${item.line}: ${item.record.village || item.record.district || item.record.city}`);
      });
      if (items.length > 5) {
        console.log(`  ... dan ${items.length - 5} lainnya`);
      }
    }
  }
  
  // Summary
  console.log('\n=== Ringkasan ===');
  console.log(`Total field kosong: ${results.length}`);
  console.log(`- villageCode kosong: ${results.filter(r => r.field === 'villageCode').length}`);
  console.log(`- cityCode kosong: ${results.filter(r => r.field === 'cityCode').length}`);
  console.log(`- districtCode kosong: ${results.filter(r => r.field === 'districtCode').length}`);
  console.log(`- villageCode kosong: ${results.filter(r => r.field === 'villageCode').length}`);
}

validateJawaTengahData();
