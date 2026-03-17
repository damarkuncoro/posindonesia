import * as fs from 'fs';
import { fetchPostalCodeHtml } from '../../infrastructure/external/PosIndonesiaApi';
import { parsePostalCodeTable } from '../../infrastructure/parsers/HtmlParser';
import { PostalCodeMatcher } from '../../domain/services/PostalCodeMatcher';
import { PostalCode } from '../../domain/models/PostalCode';
import logger from '../../logger';

export interface ScraperOptions {
    input: string;
    limit: number;
    delay: number;
    cookie?: string;
}

export interface ScrapedVillage {
    code: string;
    name: string;
    districtCode: string;
    type: string;
    provinceName: string;
    regencyName: string;
    districtName: string;
    postalCode: string;
}

export type ProgressCallback = (current: number, total: number, village: string) => void;

/**
 * Use Case: Scrape postal codes for a list of villages.
 */
export class ScrapePostalCode {
  /**
   * Execute the scraper.
   */
  async execute(
    options: ScraperOptions, 
    onProgress: ProgressCallback = () => {}
  ): Promise<ScrapedVillage[]> {
    const { input, limit, delay, cookie } = options;
    
    if (!fs.existsSync(input)) {
        throw new Error(`Input file not found at ${input}`);
    }

    const csvData = fs.readFileSync(input, 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    const rows = lines.slice(1);
    const totalToProcess = Math.min(rows.length, limit);

    const scrapedResults: ScrapedVillage[] = [];

    for (let i = 0; i < totalToProcess; i++) {
        const values = rows[i].split(',');
        
        if (values.length < 5) {
            console.warn(`⚠️ Skip baris invalid (kurang kolom): ${rows[i]}`);
            continue;
        }
        
        const code = values[0]?.trim();
        const name = values[1]?.trim();
        const prov = values[2]?.trim();
        const kab = values[3]?.trim();
        const kec = values[4]?.trim();

        if (!code || !name) {
            console.warn(`⚠️ Skip baris invalid (kode atau nama kosong): ${rows[i]}`);
            continue;
        }

        onProgress(i, totalToProcess, name);

        try {
            const html = await fetchPostalCodeHtml(name, cookie);
            const results = parsePostalCodeTable(html);
            const bestMatch = PostalCodeMatcher.findBestMatch(results, name, kec);

            // Create a domain object to use its formatting/validation
            const domainObj = new PostalCode(code, name, prov, kab, kec, name);

            scrapedResults.push({
                code: domainObj.formattedCode,
                name: name,
                districtCode: domainObj.formattedCode.substring(0, 8), // Assuming PP.KK.CC
                type: "DESA",
                provinceName: prov,
                regencyName: kab,
                districtName: kec,
                postalCode: bestMatch ? bestMatch.kodepos : ""
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n⚠️ Failed to scrape ${name}: ${errorMessage}`);
            logger.error(`Failed to scrape ${name}`, { village: name, error: errorMessage });
        }

        if (i < totalToProcess - 1) {
            await new Promise(r => setTimeout(r, delay));
        }
    }

    onProgress(totalToProcess, totalToProcess, 'Completed!');
    return scrapedResults;
  }
}
