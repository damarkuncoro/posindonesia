import * as cheerio from 'cheerio';

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
export function parsePostalCodeTable(html: string): PostalCodeResult[] {
    const $ = cheerio.load(html);
    const results: PostalCodeResult[] = [];

    $('table tbody tr').each((_i, row) => {
        const cols = $(row).find('td');
        if (cols.length >= 6) {
            results.push({
                no: $(cols[0]).text().trim(),
                kodepos: $(cols[1]).text().trim(),
                desa_kelurahan: $(cols[2]).text().trim(),
                kecamatan: $(cols[3]).text().trim(),
                kabupaten_kota: $(cols[4]).text().trim(),
                provinsi: $(cols[5]).text().trim()
            });
        }
    });

    return results;
}
