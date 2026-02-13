import { BaseScraper } from '../base-scraper';
import { Job, SearchProfile, JobSite } from '../../shared/types';

export class TotaljobsScraper extends BaseScraper {
  readonly siteName: JobSite = 'totaljobs';
  readonly baseUrl = 'https://www.totaljobs.com';
  private jobs: Job[] = [];

  buildSearchUrl(profile: SearchProfile, page: number): string {
    const params = new URLSearchParams();
    params.set('keywords', profile.keywords);

    if (profile.location && profile.location !== 'United Kingdom') {
      params.set('location', profile.location);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    if (profile.salaryMin > 0) {
      params.set('salaryFrom', String(profile.salaryMin));
    }
    if (profile.salaryMax > 0) {
      params.set('salaryTo', String(profile.salaryMax));
    }

    if (profile.datePosted !== 'all') {
      const dateMap: Record<string, string> = { '24h': '1', '7d': '7', '14d': '14', '30d': '30' };
      params.set('postedWithin', dateMap[profile.datePosted] || '');
    }

    // Radius in miles from base location
    if (profile.radiusMiles > 0) {
      params.set('radius', String(profile.radiusMiles));
    }

    return `${this.baseUrl}/jobs/in-uk?${params.toString()}`;
  }

  parseJobListings(html: string, profile: SearchProfile): Job[] {
    const $ = this.loadHtml(html);
    const pageJobs: Job[] = [];
    const now = new Date().toISOString();

    $('[data-testid="job-card"], .res-card, article.job-card').each((_, element) => {
      try {
        const el = $(element);

        const titleEl = el.find('h2 a, .res-card-header a, [data-testid="job-card-title"]').first();
        const title = this.cleanText(titleEl.text());
        const relativeUrl = titleEl.attr('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`;

        const company = this.cleanText(
          el.find('.res-card-company-name, [data-testid="job-card-company"]').first().text()
        );

        const location = this.cleanText(
          el.find('.res-card-location, [data-testid="job-card-location"]').first().text()
        );

        const salary = this.cleanText(
          el.find('.res-card-salary, [data-testid="job-card-salary"]').first().text()
        );

        const description = this.truncateDescription(
          this.cleanText(el.find('.res-card-description, [data-testid="job-card-description"]').first().text())
        );

        const postedDate = this.cleanText(
          el.find('.res-card-posted-date, [data-testid="job-card-date"]').first().text()
        );

        if (title && url) {
          const job: Job = {
            title,
            company: company || 'Not specified',
            location: location || profile.location,
            salary: salary || 'Not specified',
            postedDate,
            description,
            url,
            source: 'totaljobs',
            contractType: profile.contractType,
            workMode: this.detectWorkMode(title + ' ' + location + ' ' + description),
            scrapedAt: now,
            searchProfileId: profile.id,
          };
          pageJobs.push(job);
          this.jobs.push(job);
        }
      } catch {
        // Skip malformed listings
      }
    });

    return pageJobs;
  }

  override getScrapedJobs(): Job[] {
    return this.jobs;
  }

  private detectWorkMode(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('remote')) return 'remote';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'onsite';
  }
}
