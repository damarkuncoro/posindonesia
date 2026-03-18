import { PostalCode } from '../../domain/models/PostalCode.js';
import { SearchableRepository, PostalCodeFilter } from '../../domain/repositories/PostalCodeRepository.js';
import { fetchPostalCodeHtml, ApiConfig } from '../external/PosIndonesiaApi.js';
import { parsePostalCodeTable } from '../parsers/HtmlParser.js';

/**
 * Implementation of SearchableRepository that fetches data directly from Pos Indonesia website.
 * This is useful for real-time data but requires an internet connection.
 */
export class RemotePostalCodeRepository implements SearchableRepository {
  private readonly apiConfig: ApiConfig;

  constructor(apiConfig: ApiConfig = {}) {
    this.apiConfig = apiConfig;
  }

  /**
   * Search by keywords via remote scraping.
   */
  async findByKeywords(keywords: string[], _provinceCode?: string): Promise<PostalCode[]> {
    // Pos Indonesia API takes a single keyword string
    const searchString = keywords.join(' ');
    const html = await fetchPostalCodeHtml(searchString, undefined, this.apiConfig);
    const rawData = parsePostalCodeTable(html);

    return rawData.map(item => new PostalCode({
      postalCode: item.kodepos,
      province: item.provinsi,
      provinceCode: '', // Remote doesn't provide Kemendagri codes easily
      city: item.kabupaten_kota,
      cityCode: '',
      district: item.kecamatan,
      districtCode: '',
      village: item.desa_kelurahan,
      villageCode: ''
    }));
  }

  /**
   * Search by specific code via remote scraping.
   */
  async findByCode(code: string, provinceCode?: string): Promise<PostalCode[]> {
    return this.findByKeywords([code], provinceCode);
  }

  /**
   * Filtered search via remote scraping (approximated by keywords).
   */
  async findByFilter(filter: PostalCodeFilter, provinceCode?: string): Promise<PostalCode[]> {
    const keywords = [
      filter.postalCode,
      filter.village,
      filter.district,
      filter.city,
      filter.province
    ].filter(Boolean) as string[];

    return this.findByKeywords(keywords, provinceCode);
  }
}
