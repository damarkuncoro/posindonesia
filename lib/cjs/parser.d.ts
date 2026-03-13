export interface PostalCodeResult {
    no: string;
    kodepos: string;
    desa_kelurahan: string;
    kecamatan: string;
    kabupaten_kota: string;
    provinsi: string;
}
/**
 * Parses the raw HTML response from Pos Indonesia CariKodepos.
 * @param html - The raw HTML content
 * @returns List of parsed postal code objects
 */
export declare function parsePostalCodeTable(html: string): PostalCodeResult[];
//# sourceMappingURL=parser.d.ts.map