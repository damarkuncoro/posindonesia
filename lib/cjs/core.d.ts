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
export declare function runScraper(options: ScraperOptions, onProgress?: ProgressCallback): Promise<ScrapedVillage[]>;
//# sourceMappingURL=core.d.ts.map