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

## Cara Penggunaan

### 1. Menggunakan Repository (Rekomendasi)

Gunakan `TsPostalCodeRepository` untuk melakukan pencarian data dengan mudah.

```typescript
import { TsPostalCodeRepository } from '@damarkuncoro/posindonesia';

async function main() {
  const repo = new TsPostalCodeRepository();

  // Cari berdasarkan kata kunci (misal: nama desa dan kota)
  const results = await repo.findByKeywords(['Gambir', 'Jakarta Pusat']);

  results.forEach(data => {
    console.log(`${data.village} - ${data.postalCode}`);
    console.log(`Kecamatan: ${data.district}, Kota: ${data.city}`);
    console.log(`Kode Wilayah: ${data.provinceCode}.${data.cityCode}.${data.districtCode}.${data.villageCode}`);
  });
}

main();
```

### 2. Import Data Langsung (Tree-Shaking)

Jika Anda hanya membutuhkan data provinsi tertentu untuk menghemat ukuran bundle.

```typescript
import { ACEH, JAWA_BARAT, DKI_JAKARTA } from '@damarkuncoro/posindonesia/data';

console.log(`Total data Jawa Barat: ${JAWA_BARAT.length}`);

// Filter manual
const bandungCodes = JAWA_BARAT.filter(item => item.city.includes('BANDUNG'));
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

## Lisensi

MIT
