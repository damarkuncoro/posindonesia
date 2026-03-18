import { TsPostalCodeRepository } from './infrastructure/repositories/TsPostalCodeRepository';
import { SearchPostalCode } from './application/use-cases/SearchPostalCode';
import { ValidationError } from './domain/errors/PostalCodeError';

async function testErrorHandling() {
    console.log('--- Testing Error Handling ---\n');
    
    const repo = new TsPostalCodeRepository();
    const searchUseCase = new SearchPostalCode(repo);

    // Test Validation Error
    try {
        console.log('🔍 Testing empty keywords...');
        await searchUseCase.execute([]);
    } catch (error) {
        if (error instanceof ValidationError) {
            console.log('✅ Caught expected ValidationError:', error.message);
        } else {
            console.log('❌ Caught unexpected error type:', error);
        }
    }

    try {
        console.log('\n🔍 Testing whitespace keywords...');
        await searchUseCase.execute(['   ', ' ']);
    } catch (error) {
        if (error instanceof ValidationError) {
            console.log('✅ Caught expected ValidationError:', error.message);
        } else {
            console.log('❌ Caught unexpected error type:', error);
        }
    }

    console.log('\n✨ Error handling tests completed.');
}

testErrorHandling().catch(console.error);
