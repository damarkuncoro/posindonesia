import { formatCode, findBestMatch } from '../src/utils';
import { PostalCodeResult } from '../src/parser';

describe('Utils Module', () => {
    describe('formatCode', () => {
        it('should format a raw 10-digit code into PP.KK.CC.DD', () => {
            expect(formatCode('1101012001')).toBe('11.01.01.2001');
        });

        it('should handle codes with existing dots', () => {
            expect(formatCode('11.01.01.2001')).toBe('11.01.01.2001');
        });

        it('should handle 6-digit district codes', () => {
            expect(formatCode('110101')).toBe('11.01.01');
        });

        it('should return empty string for empty input', () => {
            expect(formatCode('')).toBe('');
        });
    });

    describe('findBestMatch', () => {
        const mockResults: PostalCodeResult[] = [
            {
                no: '1',
                kodepos: '23773',
                desa_kelurahan: 'Keude Bakongan',
                kecamatan: 'Bakongan',
                kabupaten_kota: 'Kab. Aceh Selatan',
                provinsi: 'Aceh'
            },
            {
                no: '2',
                kodepos: '23773',
                desa_kelurahan: 'Ujong Padang',
                kecamatan: 'Bakongan',
                kabupaten_kota: 'Kab. Aceh Selatan',
                provinsi: 'Aceh'
            }
        ];

        it('should find an exact match', () => {
            const match = findBestMatch(mockResults, 'Keude Bakongan', 'Bakongan');
            expect(match?.desa_kelurahan).toBe('Keude Bakongan');
        });

        it('should find a fuzzy match for slightly different spelling', () => {
            const match = findBestMatch(mockResults, 'Bakongan Keude', 'Bakongan');
            expect(match?.desa_kelurahan).toBe('Keude Bakongan');
        });

        it('should fallback to first result if no match found', () => {
            const match = findBestMatch(mockResults, 'NonExistent', 'Nowhere');
            expect(match?.no).toBe('1');
        });

        it('should return null if results list is empty', () => {
            expect(findBestMatch([], 'Any', 'Any')).toBeNull();
        });
    });
});
