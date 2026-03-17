import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { PostalCode } from '../../domain/models/PostalCode';
/**
 * Implementation of PostalCodeRepository using CSV files with streaming.
 */
export class CsvPostalCodeRepository {
    constructor(filePath) {
        this.filePath = filePath;
    }
    async findByKeywords(keywords) {
        const inputPath = path.resolve(process.cwd(), this.filePath);
        if (!fs.existsSync(inputPath)) {
            throw new Error(`CSV data file not found at: ${inputPath}`);
        }
        const fileStream = fs.createReadStream(inputPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        const results = [];
        let isHeader = true;
        for await (const line of rl) {
            if (isHeader) {
                isHeader = false;
                continue;
            }
            const parts = line.split(',');
            if (parts.length < 6)
                continue;
            const pc = new PostalCode(parts[0], // kode
            parts[1], // nama
            parts[2], // provinsi
            parts[3], // kabupaten
            parts[4], // kecamatan
            parts[5] // desa
            );
            if (pc.matches(keywords)) {
                results.push(pc);
            }
        }
        return results;
    }
    async fetchExternal(_villageName, _cookie) {
        throw new Error('External fetch not implemented for CSV repository');
    }
}
//# sourceMappingURL=CsvPostalCodeRepository.js.map