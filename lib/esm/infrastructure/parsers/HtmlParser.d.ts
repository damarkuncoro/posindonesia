export interface RawPostalCode {
    no: string;
    kodepos: string;
    desa_kelurahan: string;
    kecamatan: string;
    kabupaten_kota: string;
    provinsi: string;
}
/**
 * Parses the raw HTML response from Pos Indonesia CariKodepos.
 */
export declare function parsePostalCodeTable(html: string): RawPostalCode[];
//# sourceMappingURL=HtmlParser.d.ts.map