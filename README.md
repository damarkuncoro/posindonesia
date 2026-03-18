# @damarkuncoro/posindonesia

Library TypeScript berperforma tinggi untuk mencari Kodepos Indonesia berdasarkan database statis internal. Mendukung pencarian fuzzy, pencarian terstruktur, dan pemuatan data yang sangat efisien (Lazy Loading).

[![CI](https://github.com/damarkuncoro/posindonesia/actions/workflows/ci.yml/badge.svg)](https://github.com/damarkuncoro/posindonesia/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@damarkuncoro/posindonesia.svg)](https://badge.fury.io/js/@damarkuncoro/posindonesia)

## Fitur Utama 🚀

- **Offline-First**: Tidak memerlukan koneksi internet untuk pencarian data lokal.
- **Fuzzy Search**: Cerdas menangani typo menggunakan Fuse.js.
- **Lazy Loading**: Hanya memuat data provinsi yang dibutuhkan untuk menghemat RAM.
- **Structured Search**: Pencarian spesifik berdasarkan Provinsi, Kota, Kecamatan, atau Desa.
- **CLI Tool**: Cari kodepos langsung dari terminal.
- **High Performance**: Indexing internal untuk pencarian kodepos instan.

## Instalasi

```bash
npm install @damarkuncoro/posindonesia
```

## Penggunaan (Library)

### **1. Pencarian Cepat (Rekomendasi)**

Gunakan fungsi `search` global yang sudah dioptimalkan dengan cache internal.

```typescript
import { search, searchByCode } from '@damarkuncoro/posindonesia';

// 🔍 Pencarian kata kunci bebas
const results = await search(['Gambir', 'Jakarta Pusat']);

// 🧠 Pencarian Fuzzy (menangani typo: 'Gmbir' -> 'Gambir')
const fuzzy = await search('Gmbir', { useFuzzy: true });

// 📍 Pencarian Terstruktur (Structured)
const structured = await search({ 
  village: 'Gambir', 
  city: 'Jakarta Pusat' 
});

// ⚡ Pencarian Spesifik Provinsi (Hemat Memori)
// '31' adalah kode Kemendagri untuk DKI Jakarta
const dki = await search('Gambir', { provinceCode: '31' });

// 🔢 Pencarian berdasarkan Kodepos (Instan/Indexed)
const byCode = await searchByCode('10110');
```

### **2. Penggunaan Advanced (Repository & Custom Data)**

Untuk skenario yang lebih kompleks, seperti menggunakan sumber data Anda sendiri (misal: dari database), Anda dapat menyuntikkan `DataProvider` custom ke dalam `TsPostalCodeRepository`.

```typescript
import { 
  TsPostalCodeRepository, 
  SearchPostalCode, 
  type DataProvider, 
  type PostalCodeData 
} from '@damarkuncoro/posindonesia';

// 1. Buat DataProvider Anda sendiri
class MyDbProvider implements DataProvider {
  async getAll(): Promise<PostalCodeData[]> {
    // Logika untuk mengambil data dari database Anda
    return []; 
  }
  async getByProvince(provinceCode: string): Promise<PostalCodeData[]> {
    // Logika untuk mengambil data provinsi tertentu dari DB
    return [];
  }
}

// 2. Suntikkan ke Repository
const myProvider = new MyDbProvider();
const repo = new TsPostalCodeRepository({ dataProvider: myProvider });

const searchUseCase = new SearchPostalCode(repo);
const results = await searchUseCase.execute(['Bandung']);
```

## Penggunaan (CLI)

Anda dapat menggunakan library ini langsung dari terminal tanpa menulis kode.

```bash
# Mencari berdasarkan kata kunci
npx posindonesia search Gambir Jakarta

# Mencari dengan filter provinsi dan mode fuzzy
npx posindonesia search Gmbir -p 31 --fuzzy

# Mencari berdasarkan kodepos
npx posindonesia code 10110
```

## Skema Data

Setiap hasil pencarian mengembalikan array objek `PostalCode` dengan struktur:

```typescript
{
  province: string;       // Nama Provinsi
  provinceCode: string;   // Kode Kemendagri Provinsi
  city: string;           // Nama Kabupaten/Kota
  cityCode: string;       // Kode Kemendagri Kabupaten/Kota
  district: string;       // Nama Kecamatan
  districtCode: string;   // Kode Kemendagri Kecamatan
  village: string;        // Nama Desa/Kelurahan
  villageCode: string;    // Kode Kemendagri Desa/Kelurahan
  postalCode: string;     // Kodepos (5 digit)
}
```

## Pengembangan

```bash
npm install
npm test            # Menjalankan unit tests
npm run lint        # Memeriksa standar kode
npm run build       # Build library (ESM & CJS)
```

## Lisensi

MIT
