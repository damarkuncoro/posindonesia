#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
const program = new Command();
program
    .command('cari <keyword>')
    .description('Mencari kode pos berdasarkan kata kunci')
    .action((keyword) => {
    const filePath = path.join(__dirname, '../../data/sample.csv');
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const lines = fileContent.split('\n');
    const searchTerm = keyword.toLowerCase();
    const results = lines.filter(line => line.toLowerCase().includes(searchTerm));
    if (results.length > 0) {
        console.log(results.join('\n'));
    }
    else {
        console.log(`Tidak ada hasil yang ditemukan untuk: ${keyword}`);
    }
});
program.parse(process.argv);
//# sourceMappingURL=cli.js.map