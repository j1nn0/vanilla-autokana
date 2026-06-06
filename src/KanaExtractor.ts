export class KanaExtractor {
  // eslint-disable-next-line no-irregular-whitespace
  private static readonly EXTRACTION_PATTERN = /[^ 　ぁあ-んゔー]/g;
  private static readonly COMPACTING_PATTERN = /[ぁぃぅぇぉっゃゅょ]/g;

  static extract(input: string): string[] {
    return input.replace(this.EXTRACTION_PATTERN, '').split('');
  }

  static compact(input: string): string {
    return input.replace(this.COMPACTING_PATTERN, '');
  }

  static containsNonKana(input: string): boolean {
    return input.search(this.EXTRACTION_PATTERN) !== -1;
  }
}
