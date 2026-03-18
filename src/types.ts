/**
 * Raw data structure for a postal code entry.
 * Used for static data files and internal mapping.
 */
export interface PostalCodeData {
  province: string;
  provinceCode: string;
  city: string;
  cityCode: string;
  district: string;
  districtCode: string;
  village: string;
  villageCode: string;
  postalCode: string;
}
