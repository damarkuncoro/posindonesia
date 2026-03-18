import * as cheerio from 'cheerio';
import { ParseError } from '../../domain/errors/PostalCodeError.js';

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
export function parsePostalCodeTable(html: string): RawPostalCode[] {
    if (!html) {
        throw new ParseError('Cannot parse empty HTML content');
    }

    try {
        const $ = cheerio.load(html);
        const results: RawPostalCode[] = [];

        // Check for common error messages in the HTML from the server
        const bodyText = $('body').text().toLowerCase();
        if (bodyText.includes('object moved') || bodyText.includes('runtime error')) {
            throw new ParseError('The server returned an HTML error page instead of data');
        }

        const rows = $('table tbody tr');
        
        rows.each((_i, row) => {
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
    } catch (error) {
        if (error instanceof ParseError) throw error;
        throw new ParseError(`Failed to parse HTML table: ${error instanceof Error ? error.message : String(error)}`);
    }
}
