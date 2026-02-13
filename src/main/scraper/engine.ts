import { BrowserWindow } from 'electron';
import { SearchProfile, ScrapeResult, ScrapeProgress, JobSite, IPC_CHANNELS } from '../shared/types';
import { BaseScraper } from './base-scraper';
import { RateLimiter } from './rate-limiter';
import { IndeedScraper } from './sites/indeed-scraper';
import { ReedScraper } from './sites/reed-scraper';
import { TotaljobsScraper } from './sites/totaljobs-scraper';
import { CVLibraryScraper } from './sites/cvlibrary-scraper';
import { LinkedInScraper } from './sites/linkedin-scraper';
import { GlassdoorScraper } from './sites/glassdoor-scraper';
import { insertJob } from '../database';
import { logger } from '../logger';

export class ScrapeEngine {
  private rateLimiter: RateLimiter;
  private scrapers: Map<string, BaseScraper>;
  private isRunning = false;
  private abortControllers: AbortController[] = [];

  constructor(requestDelay: number = 2000, maxRetries: number = 3) {
    this.rateLimiter = new RateLimiter(requestDelay, maxRetries);

    this.scrapers = new Map<string, BaseScraper>();
    this.scrapers.set('indeed', new IndeedScraper(this.rateLimiter));
    this.scrapers.set('reed', new ReedScraper(this.rateLimiter));
    this.scrapers.set('totaljobs', new TotaljobsScraper(this.rateLimiter));
    this.scrapers.set('cvlibrary', new CVLibraryScraper(this.rateLimiter));
    this.scrapers.set('linkedin', new LinkedInScraper(this.rateLimiter));
    this.scrapers.set('glassdoor', new GlassdoorScraper(this.rateLimiter));
  }

  updateSettings(requestDelay: number, maxRetries: number): void {
    this.rateLimiter.setBaseDelay(requestDelay);
    this.rateLimiter.setMaxRetries(maxRetries);
  }

  async scrape(
    profile: SearchProfile,
    mainWindow: BrowserWindow | null
  ): Promise<ScrapeResult[]> {
    if (this.isRunning) {
      throw new Error('A scrape is already in progress');
    }

    this.isRunning = true;
    this.abortControllers = [];
    const results: ScrapeResult[] = [];
    const sites = profile.sites as string[];
    let totalJobsFound = 0;

    logger.info(`Starting scrape for profile: ${profile.name}, sites: ${sites.join(', ')}`);

    try {
      for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        const scraper = this.scrapers.get(site);

        if (!scraper) {
          logger.warn(`No scraper available for site: ${site}`);
          results.push({
            site,
            status: 'failed',
            jobsFound: 0,
            newJobs: 0,
            error: 'Scraper not available',
            duration: 0,
          });
          continue;
        }

        // Send progress update
        const progress: ScrapeProgress = {
          currentSite: site,
          sitesCompleted: i,
          totalSites: sites.length,
          jobsFound: totalJobsFound,
          status: `Scraping ${site}...`,
        };

        mainWindow?.webContents.send(IPC_CHANNELS.SCRAPE_PROGRESS, progress);

        // Run the scraper
        const result = await scraper.scrape(profile, (count) => {
          mainWindow?.webContents.send(IPC_CHANNELS.SCRAPE_PROGRESS, {
            ...progress,
            jobsFound: totalJobsFound + count,
            status: `Scraping ${site}... Found ${count} jobs`,
          });
        });

        // Insert scraped jobs into database with deduplication
        const scrapedJobs = scraper.getScrapedJobs();
        let newJobCount = 0;

        for (const job of scrapedJobs) {
          const { inserted } = insertJob(job);
          if (inserted) {
            newJobCount++;
          }
        }

        result.newJobs = newJobCount;
        totalJobsFound += result.jobsFound;
        results.push(result);

        logger.info(`${site}: Found ${result.jobsFound} jobs, ${newJobCount} new`);
      }

      // Send completion
      mainWindow?.webContents.send(IPC_CHANNELS.SCRAPE_COMPLETE, {
        results,
        totalJobsFound,
        totalNewJobs: results.reduce((sum, r) => sum + r.newJobs, 0),
      });

      return results;
    } finally {
      this.isRunning = false;
      this.rateLimiter.resetCounts();
    }
  }

  stop(): void {
    for (const scraper of this.scrapers.values()) {
      scraper.abort();
    }
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
