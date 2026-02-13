import { BaseScraper } from '../base-scraper';
import { Job, SearchProfile, JobSite } from '../../../shared/types';

export class LinkedInScraper extends BaseScraper {
  readonly siteName: JobSite = 'linkedin';
  readonly baseUrl = 'https://www.linkedin.com';
  private jobs: Job[] = [];

  buildSearchUrl(profile: SearchProfile, page: number): string {
    const params = new URLSearchParams();
    params.set('keywords', profile.keywords);
    params.set('location', profile.location || 'United Kingdom');
    params.set('geoId', '101165590'); // UK geo ID

    if (page > 1) {
      params.set('start', String((page - 1) * 25));
    }

    if (profile.datePosted !== 'all') {
      const dateMap: Record<string, string> = {
        '24h': 'r86400',
        '7d': 'r604800',
        '14d': 'r1209600',
        '30d': 'r2592000',
      };
      params.set('f_TPR', dateMap[profile.datePosted] || '');
    }

    if (profile.contractType !== 'all') {
      const typeMap: Record<string, string> = {
        permanent: 'F',
        contract: 'C',
        temporary: 'T',
        'part-time': 'P',
      };
      if (typeMap[profile.contractType]) {
        params.set('f_JT', typeMap[profile.contractType]);
      }
    }

    if (profile.workMode !== 'all') {
      const workModeMap: Record<string, string> = {
        remote: '2',
        hybrid: '3',
        onsite: '1',
      };
      if (workModeMap[profile.workMode]) {
        params.set('f_WT', workModeMap[profile.workMode]);
      }
    }

    // Use the public jobs page (no login required)
    return `${this.baseUrl}/jobs/search?${params.toString()}`;
  }

  parseJobListings(html: string, profile: SearchProfile): Job[] {
    const $ = this.loadHtml(html);
    const pageJobs: Job[] = [];
    const now = new Date().toISOString();

    // LinkedIn public job listings
    $('.base-card, .job-search-card, .jobs-search__results-list li').each((_, element) => {
      try {
        const el = $(element);

        const titleEl = el.find('.base-card__full-link, .base-search-card__title, h3.base-search-card__title a').first();
        const title = this.cleanText(titleEl.text() || el.find('h3').first().text());
        const url = titleEl.attr('href') || el.find('a').first().attr('href') || '';

        const company = this.cleanText(
          el.find('.base-search-card__subtitle, h4.base-search-card__subtitle a').first().text()
        );

        const location = this.cleanText(
          el.find('.job-search-card__location, .base-search-card__metadata span').first().text()
        );

        const postedDate = this.cleanText(
          el.find('.job-search-card__listdate, time').first().text() ||
          el.find('time').first().attr('datetime') || ''
        );

        if (title && url) {
          const job: Job = {
            title,
            company: company || 'Not specified',
            location: location || profile.location,
            salary: 'Not specified',
            postedDate,
            description: '',
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            source: 'linkedin',
            contractType: profile.contractType,
            workMode: profile.workMode !== 'all' ? profile.workMode : this.detectWorkMode(title + ' ' + location),
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
