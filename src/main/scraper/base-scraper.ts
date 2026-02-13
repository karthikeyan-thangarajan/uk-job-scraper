import * as cheerio from 'cheerio';
import { Job, SearchProfile, ScrapeResult, JobSite } from '../shared/types';
import { getRandomUserAgent } from './user-agents';
import { RateLimiter } from './rate-limiter';
import { logger } from '../logger';

export abstract class BaseScraper {
  protected rateLimiter: RateLimiter;
  protected abortController: AbortController | null = null;
  abstract readonly siteName: JobSite;
  abstract readonly baseUrl: string;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  abstract buildSearchUrl(profile: SearchProfile, page: number): string;
  abstract parseJobListings(html: string, profile: SearchProfile): Job[];

  async scrape(profile: SearchProfile, onProgress?: (count: number) => void): Promise<ScrapeResult> {
    const startTime = Date.now();
    const allJobs: Job[] = [];
    this.abortController = new AbortController();

    try {
      let page = 1;
      const maxPages = 5; // Limit pages to avoid excessive requests
      let hasMore = true;

      while (hasMore && page <= maxPages) {
        if (this.abortController.signal.aborted) {
          return {
            site: this.siteName,
            status: 'partial',
            jobsFound: allJobs.length,
            newJobs: 0,
            duration: Date.now() - startTime,
          };
        }

        await this.rateLimiter.waitForSlot(this.siteName);
        const url = this.buildSearchUrl(profile, page);

        let html: string;
        let retries = 0;

        while (retries <= this.rateLimiter.getMaxRetries()) {
          try {
            html = await this.fetchPage(url);
            break;
          } catch (error) {
            retries++;
            if (retries > this.rateLimiter.getMaxRetries()) {
              throw error;
            }
            const backoff = this.rateLimiter.getBackoffDelay(retries);
            logger.warn(`Retry ${retries} for ${this.siteName} page ${page}, waiting ${backoff}ms`);
            await new Promise(resolve => setTimeout(resolve, backoff));
          }
        }

        const jobs = this.parseJobListings(html!, profile);

        if (jobs.length === 0) {
          hasMore = false;
        } else {
          allJobs.push(...jobs);
          onProgress?.(allJobs.length);
          page++;
        }
      }

      return {
        site: this.siteName,
        status: 'success',
        jobsFound: allJobs.length,
        newJobs: 0, // Will be calculated after dedup in the engine
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Scrape error for ${this.siteName}: ${errorMessage}`);

      const isBlocked = errorMessage.includes('403') || errorMessage.includes('429') || errorMessage.includes('blocked');

      return {
        site: this.siteName,
        status: isBlocked ? 'blocked' : 'failed',
        jobsFound: allJobs.length,
        newJobs: 0,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  getScrapedJobs(): Job[] {
    return [];
  }

  abort(): void {
    this.abortController?.abort();
  }

  protected async fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
  }

  protected loadHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  protected truncateDescription(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }
}
