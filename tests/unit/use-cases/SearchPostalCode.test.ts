import { SearchPostalCode } from '../../../src/application/use-cases/SearchPostalCode.js';
import { SearchableRepository } from '../../../src/domain/repositories/PostalCodeRepository.js';
import { ValidationError } from '../../../src/domain/errors/PostalCodeError.js';
import { PostalCode } from '../../../src/domain/models/PostalCode.js';

describe('SearchPostalCode Use Case', () => {
  let mockRepository: jest.Mocked<SearchableRepository>;
  let useCase: SearchPostalCode;

  beforeEach(() => {
    mockRepository = {
      findByKeywords: jest.fn(),
      findByCode: jest.fn(),
    };
    useCase = new SearchPostalCode(mockRepository);
  });

  it('should call repository with cleaned keywords', async () => {
    const mockResults = [
      new PostalCode({
        postalCode: '10110',
        province: 'DKI JAKARTA',
        provinceCode: '31',
        city: 'JAKARTA PUSAT',
        cityCode: '3171',
        district: 'GAMBIR',
        districtCode: '3171010',
        village: 'GAMBIR',
        villageCode: '3171010001',
      }),
    ];
    mockRepository.findByKeywords.mockResolvedValue(mockResults);

    const results = await useCase.execute(['  gambir  ', '']);
    
    expect(mockRepository.findByKeywords).toHaveBeenCalledWith(['gambir'], undefined);
    expect(results).toEqual(mockResults);
  });

  it('should throw ValidationError if no keywords provided', async () => {
    await expect(useCase.execute([])).rejects.toThrow(ValidationError);
    await expect(useCase.execute([])).rejects.toThrow('At least one keyword is required');
  });

  it('should throw ValidationError if keywords are only empty strings', async () => {
    await expect(useCase.execute([' ', '  '])).rejects.toThrow(ValidationError);
    await expect(useCase.execute([' ', '  '])).rejects.toThrow('Search keywords cannot be empty strings');
  });

  it('should call repository findByCode with trimmed code', async () => {
    mockRepository.findByCode.mockResolvedValue([]);
    await useCase.executeByCode(' 10110 ');
    expect(mockRepository.findByCode).toHaveBeenCalledWith('10110', undefined);
  });
});
