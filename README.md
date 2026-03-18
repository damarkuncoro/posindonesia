# Pos Indonesia Postal Codes

Library TypeScript yang menyediakan database kodepos Indonesia terlengkap, akurat, dan siap pakai. Data diambil langsung dari sumber resmi dan dilengkapi dengan kode wilayah administratif (Provinsi, Kota/Kabupaten, Kecamatan, Desa/Kelurahan).

## Fitur Utama

- 📦 **Database Lengkap**: Mencakup 38 provinsi (termasuk 4 provinsi baru di Papua) dengan total >120.000 data.
- 🚀 **Cepat & Ringan**: Data tersimpan lokal dalam format TypeScript yang teroptimasi dan *tree-shakable*.
- 🔍 **Pencarian Fleksibel**: Mendukung pencarian berdasarkan kata kunci (Desa, Kecamatan, Kota, dll).
- 🆔 **Kode Wilayah**: Dilengkapi dengan kode wilayah administratif (Kemendagri) untuk integrasi sistem.
- 🛡️ **Type-Safe**: Sepenuhnya ditulis dalam TypeScript dengan definisi tipe yang jelas.

## Instalasi

```bash
npm install @damarkuncoro/posindonesia
# atau
yarn add @damarkuncoro/posindonesia
```

## Penggunaan

### **1. Pencarian Cepat (Rekomendasi)**

Cara termudah untuk mencari kodepos adalah menggunakan fungsi `search` global yang sudah dioptimalkan dengan cache dan *lazy loading*.

```typescript
import { search, searchByCode } from '@damarkuncoro/posindonesia';

// Pencarian berbasis kata kunci (Provinsi, Kota, Kecamatan, Desa, atau Kodepos)
const results = await search(['Gambir', 'Jakarta Pusat']);

// Pencarian dengan mode Fuzzy (Lebih cerdas dalam menangani typo)
const fuzzyResults = await search('Gmbir', { useFuzzy: true });

// Pencarian cepat hanya di satu provinsi tertentu (Hemat memori & CPU)
// Gunakan kode provinsi Kemendagri (misal: '31' untuk DKI Jakarta)
const dkiResults = await search('Gambir', { provinceCode: '31' });

// Pencarian berdasarkan kode spesifik (Kodepos atau Kode Wilayah)
const byCode = await searchByCode('10110');
```

### **2. Penggunaan Advanced (Repository)**

Jika Anda memerlukan kontrol lebih dalam, Anda bisa menggunakan `TsPostalCodeRepository`.

```typescript
import { TsPostalCodeRepository, SearchPostalCode } from '@damarkuncoro/posindonesia';

const repo = new TsPostalCodeRepository({ 
  useFuzzy: true, 
  fuzzyThreshold: 0.3 
});

const searchUseCase = new SearchPostalCode(repo);
const results = await searchUseCase.execute(['Bandung']);

// Bebaskan memori jika tidak digunakan lagi
repo.clearMemory();
```

## Struktur Data

Setiap entri data memiliki format berikut:

```typescript
interface PostalCode {
  province: string;       // Nama Provinsi
  provinceCode: string;   // Kode Provinsi (misal: 31)
  city: string;           // Nama Kabupaten/Kota
  cityCode: string;       // Kode Kab/Kota (misal: 3171)
  district: string;       // Nama Kecamatan
  districtCode: string;   // Kode Kecamatan (misal: 3171010)
  village: string;        // Nama Desa/Kelurahan
  villageCode: string;    // Kode Desa (misal: 3171010001)
  postalCode: string;     // Kode Pos (5 digit)
}
```

## Pengembangan

Jika Anda ingin berkontribusi atau menjalankan tes secara lokal:

```bash
# Instalasi dependensi
npm install

# Menjalankan unit test
npm test

# Menjalankan linter
npm run lint

# Menjalankan formatter
npm run format

# Build library (CJS & ESM)
npm run build
```

## Lisensi

MIT
