import { PostalCodeMatcher } from '../../../src/domain/services/PostalCodeMatcher.js';
import { RawPostalCode } from '../../../src/infrastructure/parsers/HtmlParser.js';

describe('PostalCodeMatcher', () => {
  const mockData: RawPostalCode[] = [
    {
      no: '1',
      kodepos: '10110',
      desa_kelurahan: 'GAMBIR',
      kecamatan: 'GAMBIR',
      kabupaten_kota: 'JAKARTA PUSAT',
      provinsi: 'DKI JAKARTA',
    },
    {
      no: '2',
      kodepos: '10120',
      desa_kelurahan: 'PETOJO SELATAN',
      kecamatan: 'GAMBIR',
      kabupaten_kota: 'JAKARTA PUSAT',
      provinsi: 'DKI JAKARTA',
    },
    {
      no: '3',
      kodepos: '10130',
      desa_kelurahan: 'PETOJO UTARA',
      kecamatan: 'GAMBIR',
      kabupaten_kota: 'JAKARTA PUSAT',
      provinsi: 'DKI JAKARTA',
    },
  ];

  it('should find exact match first', () => {
    const result = PostalCodeMatcher.findBestMatch(mockData, 'GAMBIR', 'GAMBIR');
    expect(result).toBeDefined();
    expect(result?.kodepos).toBe('10110');
  });

  it('should find fuzzy match for village name', () => {
    const result = PostalCodeMatcher.findBestMatch(mockData, 'PETOJO', 'GAMBIR');
    expect(result?.desa_kelurahan).toMatch(/PETOJO/);
  });

  it('should return null if no results provided', () => {
    const result = PostalCodeMatcher.findBestMatch([], 'GAMBIR', 'GAMBIR');
    expect(result).toBeNull();
  });

  it('should handle partial village names even if combined fuzzy search fails', () => {
    const result = PostalCodeMatcher.findBestMatch(mockData, 'PETOJO', 'UNKNOWN');
    expect(result?.desa_kelurahan).toMatch(/PETOJO/);
  });

  it('should fallback to first result if no good match found', () => {
    const result = PostalCodeMatcher.findBestMatch(mockData, 'XYZ', 'ABC');
    expect(result).toBe(mockData[0]);
  });
});
