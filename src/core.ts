import * as fs from 'fs';
import { fetchPostalCodeHtml } from './api';
import { parsePostalCodeTable } from './parser';
import { formatCode, findBestMatch } from './utils';

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
 * Core scraping logic separated from CLI.
 * @param options - Configuration options
 * @param onProgress - Callback for progress updates
 * @returns Scraped results
 */
export async function runScraper(
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
        const code = values[0];
        const name = values[1];
        const prov = values[2];
        const kab = values[3];
        const kec = values[4];

        onProgress(i, totalToProcess, name);

        try {
            const html = await fetchPostalCodeHtml(name, cookie);
            const results = parsePostalCodeTable(html);
            const bestMatch = findBestMatch(results, name, kec);

            scrapedResults.push({
                code: formatCode(code),
                name: name,
                districtCode: formatCode(code.substring(0, 6)),
                type: "DESA",
                provinceName: prov,
                regencyName: kab,
                districtName: kec,
                postalCode: bestMatch ? bestMatch.kodepos : ""
            });
        } catch (error: any) {
            console.error(`\n⚠️ Failed to scrape ${name}: ${error.message}`);
        }

        if (i < totalToProcess - 1) {
            await new Promise(r => setTimeout(r, delay));
        }
    }

    onProgress(totalToProcess, totalToProcess, 'Completed!');
    return scrapedResults;
}
