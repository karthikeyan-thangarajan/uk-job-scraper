import { BaseScraper } from '../base-scraper';
import { Job, SearchProfile, JobSite } from '../../shared/types';

export class CVLibraryScraper extends BaseScraper {
  readonly siteName: JobSite = 'cvlibrary';
  readonly baseUrl = 'https://www.cv-library.co.uk';
  private jobs: Job[] = [];

  buildSearchUrl(profile: SearchProfile, page: number): string {
    const params = new URLSearchParams();
    params.set('q', profile.keywords);

    if (profile.location && profile.location !== 'United Kingdom') {
      params.set('geo', profile.location);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    if (profile.salaryMin > 0) {
      params.set('salarymin', String(profile.salaryMin));
    }
    if (profile.salaryMax > 0) {
      params.set('salarymax', String(profile.salaryMax));
    }

    if (profile.datePosted !== 'all') {
      const dateMap: Record<string, string> = { '24h': '1', '7d': '7', '14d': '14', '30d': '30' };
      params.set('posted', dateMap[profile.datePosted] || '');
    }

    if (profile.contractType !== 'all') {
      const typeMap: Record<string, string> = {
        permanent: 'Permanent',
        contract: 'Contract',
        temporary: 'Temporary',
        'part-time': 'Part Time',
      };
      params.set('tempperm', typeMap[profile.contractType] || '');
    }

    // Radius in miles from base location
    if (profile.radiusMiles > 0) {
      params.set('distance', String(profile.radiusMiles));
    }

    return `${this.baseUrl}/search-jobs?${params.toString()}`;
  }

  parseJobListings(html: string, profile: SearchProfile): Job[] {
    const $ = this.loadHtml(html);
    const pageJobs: Job[] = [];
    const now = new Date().toISOString();

    $('.job-result, .results__item, [data-job-id]').each((_, element) => {
      try {
        const el = $(element);

        const titleEl = el.find('.job-result__anchor, h2 a, .results__item-title a').first();
        const title = this.cleanText(titleEl.text());
        const relativeUrl = titleEl.attr('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`;

        const company = this.cleanText(
          el.find('.job-result__company, .results__item-company').first().text()
        );

        const location = this.cleanText(
          el.find('.job-result__location, .results__item-location').first().text()
        );

        const salary = this.cleanText(
          el.find('.job-result__salary, .results__item-salary').first().text()
        );

        const description = this.truncateDescription(
          this.cleanText(el.find('.job-result__description, .results__item-description').first().text())
        );

        const postedDate = this.cleanText(
          el.find('.job-result__date, .results__item-date').first().text()
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
            source: 'cvlibrary',
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
    if (lower.includes('remote') || lower.includes('work from home')) return 'remote';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'onsite';
  }
}
