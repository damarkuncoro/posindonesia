import { SearchPostalCode } from './SearchPostalCode.js';
import { PostalCodeRepository } from '../../domain/repositories/PostalCodeRepository.js';
import { ValidationError } from '../../domain/errors/PostalCodeError.js';
import { PostalCode } from '../../domain/models/PostalCode.js';

describe('SearchPostalCode Use Case', () => {
  let mockRepository: jest.Mocked<PostalCodeRepository>;
  let useCase: SearchPostalCode;

  beforeEach(() => {
    mockRepository = {
      findByKeywords: jest.fn(),
      findByCode: jest.fn(),
      fetchExternal: jest.fn(),
    };
    useCase = new SearchPostalCode(mockRepository);
  });

  it('should call repository with cleaned keywords', async () => {
    const mockResults = [
      new PostalCode({
        postalCode: '10110',
        province: 'DKI',
        provinceCode: '31',
        city: 'JKT',
        cityCode: '3171',
        district: 'GAMBIR',
        districtCode: '3171010',
        village: 'GAMBIR',
        villageCode: '3171010001',
      }),
    ];
    mockRepository.findByKeywords.mockResolvedValue(mockResults);

    const results = await useCase.execute(['  gambir  ', '']);
    
    expect(mockRepository.findByKeywords).toHaveBeenCalledWith(['gambir']);
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
});
