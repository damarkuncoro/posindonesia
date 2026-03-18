import { DataProvider } from '../../domain/repositories/DataProvider.js';
import { PostalCodeData } from '../../types.js';
import { PROVINCE_LOADERS } from '../../data/index.js';

/**
 * A DataProvider implementation that loads data from the internal TypeScript files.
 */
export class TsDataProvider implements DataProvider {
  private provinceCache: Map<string, PostalCodeData[]> = new Map();
  private provinceLoadPromises: Map<string, Promise<PostalCodeData[]>> = new Map();

  async getByProvince(provinceCode: string): Promise<PostalCodeData[]> {
    if (this.provinceCache.has(provinceCode)) {
      return this.provinceCache.get(provinceCode)!;
    }

    let loadPromise = this.provinceLoadPromises.get(provinceCode);
    if (!loadPromise) {
      loadPromise = (async () => {
        const loader = PROVINCE_LOADERS[provinceCode];
        if (!loader) return [];

        try {
          const module = await loader();
          const exportKey = Object.keys(module).find(k => k !== 'default');
          if (!exportKey) return [];

          const rawData = module[exportKey] as PostalCodeData[];
          this.provinceCache.set(provinceCode, rawData);
          return rawData;
        } catch (error) {
          return [];
        } finally {
          this.provinceLoadPromises.delete(provinceCode);
        }
      })();
      this.provinceLoadPromises.set(provinceCode, loadPromise);
    }

    return loadPromise;
  }

  async getAll(): Promise<PostalCodeData[]> {
    const codes = Object.keys(PROVINCE_LOADERS);
    const results = await Promise.allSettled(
      codes.map(code => this.getByProvince(code))
    );
    
    return results
      .filter((r): r is PromiseFulfilledResult<PostalCodeData[]> => r.status === 'fulfilled')
      .map(r => r.value)
      .flat();
  }

  clearCache(): void {
    this.provinceCache.clear();
    this.provinceLoadPromises.clear();
  }
}
