/**
 * StudyMate Sarkari — Step 5: Parser Registry & Auto-Dispatcher
 */

import { ParserInput, ParserResult, SourceParser } from '../../../types/parser';
import { GenericHtmlParser } from './genericHtmlParser';
import { GenericPdfParser } from './genericPdfParser';
import { GenericRssParser } from './genericRssParser';
import { GenericJsonParser } from './genericJsonParser';
import { UpscAdapter } from './adapters/upscAdapter';
import { SscAdapter } from './adapters/sscAdapter';
import { NtaAdapter } from './adapters/ntaAdapter';
import { StatePscAdapter } from './adapters/statePscAdapter';

export class ParserRegistry {
  private static instance: ParserRegistry;
  private parsers: SourceParser[] = [];

  private constructor() {
    // Register specific authority adapters first (higher priority)
    this.registerParser(new UpscAdapter());
    this.registerParser(new SscAdapter());
    this.registerParser(new NtaAdapter());
    this.registerParser(new StatePscAdapter());

    // Register generic format parsers as fallbacks
    this.registerParser(new GenericHtmlParser());
    this.registerParser(new GenericPdfParser());
    this.registerParser(new GenericRssParser());
    this.registerParser(new GenericJsonParser());
  }

  public static getInstance(): ParserRegistry {
    if (!ParserRegistry.instance) {
      ParserRegistry.instance = new ParserRegistry();
    }
    return ParserRegistry.instance;
  }

  public registerParser(parser: SourceParser): void {
    // Avoid duplicate registration
    if (!this.parsers.some((p) => p.parserKey === parser.parserKey)) {
      this.parsers.push(parser);
    }
  }

  public getRegisteredParsers(): SourceParser[] {
    return [...this.parsers];
  }

  public getAvailableKeys(): string[] {
    return this.parsers.map((p) => p.parserKey);
  }

  public getParserByKey(parserKey?: string | null): SourceParser | undefined {
    if (!parserKey) return undefined;
    return this.parsers.find((p) => p.parserKey === parserKey);
  }

  public selectParser(input: ParserInput): SourceParser | undefined {
    // 1. Exact match by parser_key if explicitly set and not generic
    if (input.parserKey && input.parserKey !== 'generic_html' && input.parserKey !== 'generic_pdf') {
      const explicit = this.getParserByKey(input.parserKey);
      if (explicit) return explicit;
    }

    // 2. Specialized adapter detection
    for (const parser of this.parsers) {
      if (parser.canHandle(input)) {
        return parser;
      }
    }

    // 3. Fallback based on sourceType
    if (input.sourceType === 'pdf') {
      return this.getParserByKey('generic_pdf');
    }
    if (input.sourceType === 'rss') {
      return this.getParserByKey('generic_rss');
    }
    if (input.sourceType === 'api') {
      return this.getParserByKey('generic_json');
    }

    return this.getParserByKey('generic_html');
  }

  public async parseContent(input: ParserInput): Promise<ParserResult> {
    const parser = this.selectParser(input);

    if (!parser) {
      return {
        success: false,
        parserKey: 'unknown',
        items: [],
        error: `No parser available for source type "${input.sourceType}" or parser key "${input.parserKey}"`,
        errorCode: 'PARSER_REQUIRED',
      };
    }

    return await parser.parse(input);
  }
}

export const parserRegistry = ParserRegistry.getInstance();
