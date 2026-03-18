import { search } from './lib/esm/main.js';
import { TsPostalCodeRepository } from './lib/esm/infrastructure/repositories/TsPostalCodeRepository.js';

async function test() {
  const repo = new TsPostalCodeRepository();
  const results = await repo.findByKeywords(['Gambir'], '31');
  console.log('Results count:', results.length);
  results.forEach((r, i) => {
    if (i < 10) console.log(`${i+1}. ${r.postalCode} - ${r.province}`);
  });
}

test();
