#!/usr/bin/env node
import { Command } from 'commander';
import { search, searchByCode } from './main.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('posindonesia')
  .description('CLI tool to search Indonesian postal codes')
  .version('1.0.2');

program
  .command('search')
  .description('Search postal codes by keywords')
  .argument('<keywords...>', 'Keywords to search (e.g. Gambir Jakarta)')
  .option('-p, --province <code2>', 'Limit search to specific province code (e.g. 31)')
  .option('-f, --fuzzy', 'Enable fuzzy search')
  .option('-r, --remote', 'Fetch real-time data from Pos Indonesia')
  .action(async (keywords, options) => {
    try {
      console.log(chalk.blue(`Searching for: ${keywords.join(', ')} (${options.remote ? 'Remote' : 'Local'})...`));
      const results = await search(keywords, { 
        provinceCode: options.province,
        useFuzzy: options.fuzzy,
        source: options.remote ? 'remote' : 'local'
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      console.log(chalk.green(`Found ${results.length} results:\n`));
      results.forEach(r => {
        console.log(`${chalk.bold(r.postalCode)} - ${r.village}, ${r.district}, ${r.city}, ${r.province}`);
      });
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('code')
  .description('Search by specific postal code or administrative code')
  .argument('<code>', 'The code to search for')
  .option('-p, --province <code2>', 'Limit search to specific province code')
  .option('-r, --remote', 'Fetch real-time data from Pos Indonesia')
  .action(async (code, options) => {
    try {
      console.log(chalk.blue(`Searching for code: ${code} (${options.remote ? 'Remote' : 'Local'})...`));
      const results = await searchByCode(code, {
        provinceCode: options.province,
        source: options.remote ? 'remote' : 'local'
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      console.log(chalk.green(`Found ${results.length} results:\n`));
      results.forEach(r => {
        console.log(`${chalk.bold(r.postalCode)} - ${r.village}, ${r.district}, ${r.city}, ${r.province}`);
      });
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();
