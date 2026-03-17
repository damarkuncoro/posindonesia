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
export declare class ScrapePostalCode {
    /**
     * Execute the scraper.
     */
    execute(options: ScraperOptions, onProgress?: ProgressCallback): Promise<ScrapedVillage[]>;
}
//# sourceMappingURL=ScrapePostalCode.d.ts.map