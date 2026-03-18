import { parsePostalCodeTable } from '../../../src/infrastructure/parsers/HtmlParser.js';
import { ParseError } from '../../../src/domain/errors/PostalCodeError.js';

describe('HtmlParser', () => {
  const sampleHtml = `
    <table>
      <tbody>
        <tr>
          <td>1</td>
          <td>10110</td>
          <td>GAMBIR</td>
          <td>GAMBIR</td>
          <td>JAKARTA PUSAT</td>
          <td>DKI JAKARTA</td>
        </tr>
        <tr>
          <td>2</td>
          <td>10120</td>
          <td>PETOJO SELATAN</td>
          <td>GAMBIR</td>
          <td>JAKARTA PUSAT</td>
          <td>DKI JAKARTA</td>
        </tr>
      </tbody>
    </table>
  `;

  it('should correctly parse valid HTML table', () => {
    const results = parsePostalCodeTable(sampleHtml);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      no: '1',
      kodepos: '10110',
      desa_kelurahan: 'GAMBIR',
      kecamatan: 'GAMBIR',
      kabupaten_kota: 'JAKARTA PUSAT',
      provinsi: 'DKI JAKARTA',
    });
  });

  it('should throw ParseError on empty HTML', () => {
    expect(() => parsePostalCodeTable('')).toThrow(ParseError);
    expect(() => parsePostalCodeTable('')).toThrow('Cannot parse empty HTML content');
  });

  it('should throw ParseError on server error page', () => {
    const errorHtml = '<html><body>Object Moved</body></html>';
    expect(() => parsePostalCodeTable(errorHtml)).toThrow(ParseError);
    expect(() => parsePostalCodeTable(errorHtml)).toThrow('The server returned an HTML error page');
  });

  it('should return empty array if no table rows found', () => {
    const emptyHtml = '<html><body><table><tbody></tbody></table></body></html>';
    const results = parsePostalCodeTable(emptyHtml);
    expect(results).toEqual([]);
  });

  it('should skip rows with insufficient columns', () => {
    const partialHtml = `
      <table>
        <tbody>
          <tr>
            <td>1</td>
            <td>10110</td>
          </tr>
        </tbody>
      </table>
    `;
    const results = parsePostalCodeTable(partialHtml);
    expect(results).toEqual([]);
  });
});
