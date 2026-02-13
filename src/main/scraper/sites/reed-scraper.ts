import { BaseScraper } from '../base-scraper';
import { Job, SearchProfile, JobSite } from '../../shared/types';

export class ReedScraper extends BaseScraper {
  readonly siteName: JobSite = 'reed';
  readonly baseUrl = 'https://www.reed.co.uk';
  private jobs: Job[] = [];

  buildSearchUrl(profile: SearchProfile, page: number): string {
    const keywords = encodeURIComponent(profile.keywords).replace(/%20/g, '-');
    let url = `${this.baseUrl}/jobs/${keywords}-jobs`;

    if (profile.location && profile.location !== 'United Kingdom') {
      url += `-in-${encodeURIComponent(profile.location).replace(/%20/g, '-')}`;
    }

    const params = new URLSearchParams();

    if (page > 1) {
      params.set('pageno', String(page));
    }

    if (profile.salaryMin > 0) {
      params.set('salaryfrom', String(profile.salaryMin));
    }
    if (profile.salaryMax > 0) {
      params.set('salaryto', String(profile.salaryMax));
    }

    if (profile.datePosted !== 'all') {
      const dateMap: Record<string, string> = { '24h': 'Today', '7d': 'LastWeek', '14d': 'Last2Weeks', '30d': 'LastMonth' };
      params.set('dateCreatedOffSet', dateMap[profile.datePosted] || '');
    }

    if (profile.contractType !== 'all') {
      params.set('employment', profile.contractType);
    }

    // Radius in miles from base location
    if (profile.radiusMiles > 0) {
      params.set('proximity', String(profile.radiusMiles));
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  parseJobListings(html: string, profile: SearchProfile): Job[] {
    const $ = this.loadHtml(html);
    const pageJobs: Job[] = [];
    const now = new Date().toISOString();

    $('article.job-card_jobCard, .job-result-card, [data-qa="job-card"]').each((_, element) => {
      try {
        const el = $(element);

        const titleEl = el.find('h2 a, .job-card_jobResultHeading a, a[data-qa="job-card-title"]').first();
        const title = this.cleanText(titleEl.text());
        const relativeUrl = titleEl.attr('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`;

        const company = this.cleanText(
          el.find('.job-card_jobResultCompany, [data-qa="job-card-company"]').first().text()
        );

        const location = this.cleanText(
          el.find('.job-card_jobResultLocation, [data-qa="job-card-location"]').first().text()
        );

        const salary = this.cleanText(
          el.find('.job-card_jobResultSalary, [data-qa="job-card-salary"]').first().text()
        );

        const description = this.truncateDescription(
          this.cleanText(el.find('.job-card_jobResultDescription, [data-qa="job-card-description"]').first().text())
        );

        const postedDate = this.cleanText(
          el.find('.job-card_jobResultPosted, [data-qa="job-card-posted-date"]').first().text()
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
            source: 'reed',
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
