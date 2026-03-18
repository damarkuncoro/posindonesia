import { SearchStrategy, SearchStrategyOptions } from './SearchStrategy.js';
import { PostalCodeData } from '../../types.js';

/**
 * Fast search strategy using an Inverted Index for exact keyword matches.
 */
export class InvertedIndexStrategy implements SearchStrategy {
  private invertedIndex: Map<string, number[]> = new Map();
  private dataArray: PostalCodeData[] = [];

  constructor(data: PostalCodeData[]) {
    this.buildIndex(data);
  }

  private buildIndex(data: PostalCodeData[]): void {
    data.forEach((item, idx) => {
      this.dataArray.push(item);
      const text = `${item.province} ${item.city} ${item.district} ${item.village}`.toLowerCase();
      const tokens = text.split(/[\s,.-]+/).filter(t => t.length > 0);
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(token => {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, []);
        }
        this.invertedIndex.get(token)!.push(idx);
      });
    });
  }

  async search(data: PostalCodeData[], keywords: string[], options?: SearchStrategyOptions): Promise<PostalCodeData[]> {
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const resultIndices = new Set<number>();

    if (lowerKeywords.length > 0) {
      const firstKeyword = lowerKeywords[0];
      const initialDocs = this.invertedIndex.get(firstKeyword) || [];
      initialDocs.forEach(idx => resultIndices.add(idx));

      for (let i = 1; i < lowerKeywords.length; i++) {
        const keyword = lowerKeywords[i];
        const docsForKeyword = new Set(this.invertedIndex.get(keyword) || []);
        resultIndices.forEach(idx => {
          if (!docsForKeyword.has(idx)) {
            resultIndices.delete(idx);
          }
        });
      }
    }
    
    let results = Array.from(resultIndices).map(idx => this.dataArray[idx]);

    if (options?.provinceCode) {
      results = results.filter(m => m.provinceCode === options.provinceCode);
    }

    return results;
  }
}
