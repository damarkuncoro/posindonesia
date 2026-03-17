#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const cliProgress = __importStar(require("cli-progress"));
const ScrapePostalCode_1 = require("../../application/use-cases/ScrapePostalCode");
const program = new commander_1.Command();
program
    .name('kodepos')
    .description('Professional Indonesian Postal Code Scraper (DDD)')
    .version('1.0.0')
    .option('-i, --input <path>', 'Input CSV file path', path.join(__dirname, '../../../docs/database_final.csv'))
    .option('-o, --output <path>', 'Output JSON file path', path.join(__dirname, '../results/scraped_villages_detailed.json'))
    .option('-l, --limit <number>', 'Number of rows to process', '10')
    .option('-d, --delay <ms>', 'Delay between requests in milliseconds', '1000')
    .option('-c, --cookie <string>', 'Custom session cookie for Pos Indonesia site')
    .action(async (options) => {
    const { output, limit, delay } = options;
    console.log(chalk_1.default.blue.bold('\n🚀 Starting Indonesian Postal Code Scraper (DDD Version)\n'));
    const progressBar = new cliProgress.SingleBar({
        format: chalk_1.default.green('Progress |') + chalk_1.default.cyan('{bar}') + '| {percentage}% || {value}/{total} Villages || {village}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });
    try {
        const scrapeUseCase = new ScrapePostalCode_1.ScrapePostalCode();
        const results = await scrapeUseCase.execute({
            ...options,
            limit: parseInt(limit),
            delay: parseInt(delay)
        }, (current, total, village) => {
            if (current === 0) {
                progressBar.start(total, 0, { village });
            }
            else {
                progressBar.update(current, { village });
            }
        });
        progressBar.stop();
        const outputDir = path.dirname(output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(output, JSON.stringify(results, null, 2));
        console.log(chalk_1.default.green.bold(`\n✅ Success! Scraped data saved to:`));
        console.log(chalk_1.default.underline(output));
        console.log('\n');
    }
    catch (error) {
        if (progressBar.isActive)
            progressBar.stop();
        console.error(chalk_1.default.red(`\n❌ Error: ${error.message}`));
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=scrape.js.map