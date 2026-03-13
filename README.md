# @damarkuncoro/posindonesia

[![NPM Version](https://img.shields.io/npm/v/@damarkuncoro/posindonesia.svg)](https://www.npmjs.com/package/@damarkuncoro/posindonesia)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Layanan Integrasi Data Kode Pos Indonesia**

Pustaka Node.js profesional yang menyediakan akses programatik ke database kode pos resmi Indonesia. Dirancang untuk keandalan tinggi, akurasi data, dan kemudahan integrasi ke dalam sistem skala perusahaan (*enterprise*).

## Ikhtisar Layanan

Paket ini memungkinkan pengembang untuk melakukan sinkronisasi data wilayah administrasi Indonesia (Provinsi, Kabupaten/Kota, Kecamatan, Desa/Kelurahan) dengan database kode pos terbaru melalui jalur integrasi yang dioptimalkan.

### Fitur Utama

- **Akurasi Data Terjamin**: Mengambil informasi langsung dari sumber data primer integrasi wilayah.
- **Smart Validation Engine**: Algoritma pencocokan cerdas yang mengoreksi variasi penulisan nama daerah untuk memastikan kode pos yang tepat.
- **Efisiensi Batch**: Kemampuan pemrosesan data masal (*bulk processing*) dengan manajemen beban kerja (*rate limiting*) otomatis.
- **Arsitektur Modular**: Mendukung penggunaan sebagai Command Line Interface (CLI) maupun sebagai Library (SDK) dalam aplikasi Node.js/TypeScript.

## Instalasi

Gunakan pengelola paket npm untuk menginstal SDK ini ke dalam proyek Anda:

```bash
npm install @damarkuncoro/posindonesia
```

## Panduan Penggunaan

### Integrasi SDK (Library Mode)

SDK ini dirancang dengan dukungan TypeScript penuh untuk pengalaman pengembangan yang maksimal.

```typescript
import { runScraper } from '@damarkuncoro/posindonesia';

async function syncPostalData() {
  const results = await runScraper({
    input: './data/villages.csv',
    limit: 100,
    delay: 1000
  }, (current, total, village) => {
    console.log(`Sinkronisasi: ${village} (${current}/${total})`);
  });
}
```

### Antarmuka Baris Perintah (CLI Mode)

Gunakan perintah `scrape-pos` untuk menjalankan sinkronisasi data secara langsung melalui terminal:

```bash
# Menjalankan sinkronisasi default
npm start

# Menjalankan dengan konfigurasi kustom
npm start -- --input ./data_input.csv --output ./hasil_sinkronisasi.json --limit 500 --delay 2000
```

## Spesifikasi Data Output

Hasil integrasi akan disajikan dalam format JSON standar industri:

```json
{
  "code": "11.01.01.2001",
  "name": "Keude Bakongan",
  "districtCode": "11.01.01",
  "type": "DESA",
  "provinceName": "Aceh",
  "regencyName": "Kab. Aceh Selatan",
  "districtName": "Bakongan",
  "postalCode": "23773"
}
```

## Keamanan & Kepatuhan

Kami sangat menghargai integritas data dan keberlangsungan layanan. Pengguna diharapkan untuk:
1. Mematuhi kebijakan penggunaan data wilayah yang berlaku.
2. Menggunakan jeda waktu (`delay`) yang wajar dalam pemrosesan masal untuk menjaga stabilitas layanan.

## Lisensi

Didistribusikan di bawah lisensi [MIT](LICENSE).

---
*Dikembangkan secara profesional untuk mendukung digitalisasi data wilayah Indonesia.*
