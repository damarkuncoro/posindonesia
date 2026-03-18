import { SearchStrategy, SearchStrategyOptions } from './SearchStrategy.js';
import { PostalCodeData } from '../../types.js';

/**
 * Intelligent fuzzy search strategy using Fuse.js.
 * Lazy-loads Fuse.js only when needed to reduce initial bundle size.
 */
export class FuzzySearchStrategy implements SearchStrategy {
  private fuse: any = null;

  async search(data: PostalCodeData[], keywords: string[], options?: SearchStrategyOptions): Promise<PostalCodeData[]> {
    if (!this.fuse) {
      const Fuse = (await import('fuse.js')).default;
      this.fuse = new Fuse(data, {
        keys: ['postalCode', 'province', 'city', 'district', 'village'],
        threshold: options?.threshold ?? 0.4,
      });
    }

    const matches = this.fuse.search(keywords.join(' ')).map((result: any) => result.item);

    if (options?.provinceCode) {
      return matches.filter((m: PostalCodeData) => m.provinceCode === options.provinceCode);
    }

    return matches;
  }
}
