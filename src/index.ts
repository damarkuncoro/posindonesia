#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as cliProgress from 'cli-progress';
import { runScraper } from './core';

program
  .name('@damarkuncoro/posindonesia')
  .description('Professional Indonesian Postal Code Scraper')
  .version('1.0.0')
  .option('-i, --input <path>', 'Input CSV file path', path.join(__dirname, '../../../docs/database_final.csv'))
  .option('-o, --output <path>', 'Output JSON file path', path.join(__dirname, '../results/scraped_villages_detailed.json'))
  .option('-l, --limit <number>', 'Number of rows to process', '10')
  .option('-d, --delay <ms>', 'Delay between requests in milliseconds', '1000')
  .option('-c, --cookie <string>', 'Custom session cookie for Pos Indonesia site')
  .action(async (options) => {
    const { output, limit, delay } = options;
    
    console.log(chalk.blue.bold('\n🚀 Starting Indonesian Postal Code Scraper (TypeScript)\n'));

    const progressBar = new cliProgress.SingleBar({
      format: chalk.green('Progress |') + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Villages || {village}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    try {
        const results = await runScraper({
            ...options,
            limit: parseInt(limit),
            delay: parseInt(delay)
        }, (current, total, village) => {
            if (current === 0) {
                progressBar.start(total, 0, { village });
            } else {
                progressBar.update(current, { village });
            }
        });

        progressBar.stop();
        
        // Ensure output directory exists
        const outputDir = path.dirname(output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(output, JSON.stringify(results, null, 2));
        
        console.log(chalk.green.bold(`\n✅ Success! Scraped data saved to:`));
        console.log(chalk.underline(output));
        console.log('\n');
    } catch (error: any) {
        if (progressBar.isActive) progressBar.stop();
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
        process.exit(1);
    }
  });

program.parse(process.argv);
