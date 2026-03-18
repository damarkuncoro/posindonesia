import { PostalCodeMatcher } from './PostalCodeMatcher.js';
import { RawPostalCode } from '../../infrastructure/parsers/HtmlParser.js';

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

  it('should find best match based on village name', () => {
    const matcher = new PostalCodeMatcher(mockData);
    const result = matcher.findBestMatch('GAMBIR');
    expect(result).toBeDefined();
    expect(result?.kodepos).toBe('10110');
  });

  it('should handle partial village names', () => {
    const matcher = new PostalCodeMatcher(mockData);
    const result = matcher.findBestMatch('PETOJO');
    // Fuse.js might return PETOJO SELATAN or PETOJO UTARA
    expect(result?.desa_kelurahan).toMatch(/PETOJO/);
  });

  it('should return null if no matches found in empty list', () => {
    const matcher = new PostalCodeMatcher([]);
    const result = matcher.findBestMatch('GAMBIR');
    expect(result).toBeNull();
  });

  it('should return null for completely unrelated search term', () => {
    const matcher = new PostalCodeMatcher(mockData);
    const result = matcher.findBestMatch('XYZABC');
    // Threshold should filter out poor matches
    expect(result).toBeNull();
  });
});
