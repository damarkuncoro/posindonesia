import * as fs from 'fs';
import { fetchPostalCodeHtml } from './api';
import { parsePostalCodeTable } from './parser';
import { formatCode, findBestMatch } from './utils';
import logger from './logger';
/**
 * Core scraping logic separated from CLI.
 * @param options - Configuration options
 * @param onProgress - Callback for progress updates
 * @returns Scraped results
 */
export async function runScraper(options, onProgress = () => { }) {
    const { input, limit, delay, cookie } = options;
    if (!fs.existsSync(input)) {
        throw new Error(`Input file not found at ${input}`);
    }
    const csvData = fs.readFileSync(input, 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    const rows = lines.slice(1);
    const totalToProcess = Math.min(rows.length, limit);
    const scrapedResults = [];
    for (let i = 0; i < totalToProcess; i++) {
        const values = rows[i].split(',');
        // Validate CSV row structure
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
        }
        catch (error) {
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
//# sourceMappingURL=core.js.map