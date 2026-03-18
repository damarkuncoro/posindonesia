import { PostalCode } from '../../../src/domain/models/PostalCode.js';
import { PostalCodeData } from '../../../src/types.js';

describe('PostalCode', () => {
  const sampleData: PostalCodeData = {
    province: 'DKI JAKARTA',
    provinceCode: '31',
    city: 'JAKARTA PUSAT',
    cityCode: '3171',
    district: 'GAMBIR',
    districtCode: '3171010',
    village: 'GAMBIR',
    villageCode: '3171010001',
    postalCode: '10110',
  };

  it('should correctly initialize with valid data', () => {
    const pc = new PostalCode(sampleData);
    expect(pc.postalCode).toBe('10110');
    expect(pc.province).toBe('DKI JAKARTA');
    expect(pc.city).toBe('JAKARTA PUSAT');
  });

  it('should match keywords correctly (case-insensitive)', () => {
    const pc = new PostalCode(sampleData);
    expect(pc.matches(['gambir'])).toBe(true);
    expect(pc.matches(['GAMBIR'])).toBe(true);
    expect(pc.matches(['jakarta', 'pusat'])).toBe(true);
    expect(pc.matches(['10110'])).toBe(true);
    expect(pc.matches(['bogor'])).toBe(false);
  });

  it('should match codes correctly', () => {
    const pc = new PostalCode(sampleData);
    expect(pc.matchesCode('10110')).toBe(true);
    expect(pc.matchesCode('31')).toBe(true);
    expect(pc.matchesCode('3171010')).toBe(true);
    expect(pc.matchesCode('99')).toBe(false);
  });

  it('should return a readable string representation', () => {
    const pc = new PostalCode(sampleData);
    expect(pc.toString()).toBe('10110 - GAMBIR, GAMBIR, JAKARTA PUSAT, DKI JAKARTA');
  });

  it('should convert to JSON correctly', () => {
    const pc = new PostalCode(sampleData);
    expect(pc.toJSON()).toEqual(sampleData);
  });
});
