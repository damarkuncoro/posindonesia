export interface PostalCodeData {
  kode: string;
  nama: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
}

/**
 * Data contoh kodepos dalam format TypeScript (Typed Data).
 * Memungkinkan akses data yang lebih aman dan terintegrasi dengan logika domain.
 */
export const SAMPLE_POSTAL_CODES: PostalCodeData[] = [
  {
    kode: "1101012001",
    nama: "Keude Bakongan",
    provinsi: "Aceh",
    kabupaten: "Kab. Aceh Selatan",
    kecamatan: "Bakongan",
    desa: "Keude Bakongan"
  }
];
