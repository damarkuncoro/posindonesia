# Script fill-all-from-bps.cjs

## Penjelasan Detail Proses

### 1. BACA FILE DATA
```
Untuk setiap province (37 file):
- Baca file src/data/11-aceh.ts
- Baca file src/data/12-sumatera-utara.ts
- ...dst
```

### 2. PARSING DATA
```
Untuk setiap baris di dalam file:
- Ekstrak: province, provinceCode, city, cityCode, district, districtCode, village, villageCode, postalCode
- Simpan ke array records
```

### 3. IDENTIFIKASI KOSONG
```
Cari record dengan villageCode = ""
Contoh:
{
  "district": "Purbalingga",
  "districtCode": "3303060",
  "village": "Kandanggampang",
  "villageCode": ""  ← KOSONG
}
```

### 4. GROUPING PER DISTRICT
```
Kumpulkan semua villageCode kosong berdasarkan districtCode:
- District 3303060: [Kandanggampang, Kedungmenjangan, ...]
- District 3303110: [Pagerandong, Karangnangka, Mrebet, ...]
```

### 5. FETCH DATA DARI BPS API
```
Untuk setiap district kosong:
GET https://sig.bps.go.id/rest-drop-down/getwilayah?level=desa&parent=3303060&periode_merge=2025_1.2025

Response:
[
  {"kode":"3303060001","nama":"BOJONG"},
  {"kode":"3303060002","nama":"TOYAREJA"},
  {"kode":"3303060003","nama":"KEDUNG MENJANGAN"},
  ...
]
```

### 6. FUZZY MATCHING
```
Untuk setiap village kosong, cari match di data BPS:

Contoh:
- Village di data: "Kandanggampang"
- Dicari di BPS: "KANDANG GAMPANG" 
- Match ditemukan! (fuzzy matching)

Teknik fuzzy matching:
1. Normalisasi uppercase
2. Hapus prefix "DESA ", "KEL. "
3. Cek exact match
4. Cek partial match (includes)
5. Cek variasi umum (GAMPANG vs KAMPUNG, MENJANGAN vs MENJANA)
```

### 7. REPLACE KODE
```
Sebelum:
"village": "Kandanggampang",
"villageCode": ""

Sesudah:
"village": "Kandanggampang", 
"villageCode": "3303060009"
```

### 8. SIMPAN FILE
```
Tulis ulang file dengan villageCode yang sudah terisi
```

---

## Alur Flowchart

```
START
  │
  ▼
┌─────────────────────────────────────┐
│ Loop semua file di src/data/*.ts    │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Parse setiap record                 │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Filter: villageCode == ""          │
└─────────────────────────────────────┘
  │
  ├── Kosong? ──► TIDAK ──► Skip
  │
  ▼
YA
┌─────────────────────────────────────┐
│ Group by districtCode              │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Fetch BPS API untuk district       │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Fuzzy match nama village           │
└─────────────────────────────────────┘
  │
  ├── Ketemu? ──► TIDAK ──► Logging: TIDAK KETEMU
  │
  ▼
YA
┌─────────────────────────────────────┐
│ Replace villageCode dengan kode BPS│
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Simpan file                        │
└─────────────────────────────────────┘
  │
  ▼
END
```

---

## Contoh Log Output

```
=== Pengisian VillageCode untuk SEMUA Province ===

Processing: 11-aceh.ts...
  Districts dengan villageCode kosong: 15
  WARNING: district 1101012 tidak ada di BPS
  => VillageCode diisi: 1200, matched tapi tidak replace: 50

Processing: 12-sumatera-utara.ts...
  Districts dengan villageCode kosong: 20
  => VillageCode diisi: 1600, matched tapi tidak replace: 148

Processing: 33-jawa-tengah.ts...
  Districts dengan villageCode kosong: 29
  => VillageCode diisi: 1800, matched tapi tidak replace: 319
...

=== HASIL AKHIR ===
Total villageCode diisi: 22000
✅ Semua file telah diupdate!
```
