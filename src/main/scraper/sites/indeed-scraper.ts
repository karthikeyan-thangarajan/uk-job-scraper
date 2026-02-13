import { BaseScraper } from '../base-scraper';
import { Job, SearchProfile, JobSite } from '../../shared/types';

export class IndeedScraper extends BaseScraper {
  readonly siteName: JobSite = 'indeed';
  readonly baseUrl = 'https://uk.indeed.com';
  private jobs: Job[] = [];

  buildSearchUrl(profile: SearchProfile, page: number): string {
    const params = new URLSearchParams();
    params.set('q', profile.keywords);
    params.set('l', profile.location || 'United Kingdom');

    if (page > 1) {
      params.set('start', String((page - 1) * 10));
    }

    if (profile.datePosted !== 'all') {
      const dateMap: Record<string, string> = { '24h': '1', '7d': '7', '14d': '14', '30d': '30' };
      params.set('fromage', dateMap[profile.datePosted] || '');
    }

    if (profile.contractType !== 'all') {
      params.set('jt', profile.contractType);
    }

    if (profile.salaryMin > 0) {
      params.set('salary', String(profile.salaryMin));
    }

    // Radius in miles from base location
    if (profile.radiusMiles > 0) {
      params.set('radius', String(profile.radiusMiles));
    }

    return `${this.baseUrl}/jobs?${params.toString()}`;
  }

  parseJobListings(html: string, profile: SearchProfile): Job[] {
    const $ = this.loadHtml(html);
    const pageJobs: Job[] = [];
    const now = new Date().toISOString();

    // Indeed uses various selectors, trying common ones
    $('div.job_seen_beacon, div.jobsearch-ResultsList > div, .resultContent').each((_, element) => {
      try {
        const el = $(element);

        const titleEl = el.find('h2.jobTitle a, a.jcs-JobTitle, [data-jk] a').first();
        const title = this.cleanText(titleEl.text());
        const relativeUrl = titleEl.attr('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`;

        const company = this.cleanText(
          el.find('[data-testid="company-name"], .companyName, .company').first().text()
        );

        const location = this.cleanText(
          el.find('[data-testid="text-location"], .companyLocation, .location').first().text()
        );

        const salary = this.cleanText(
          el.find('.salary-snippet-container, .salaryText, [data-testid="attribute_snippet_testid"]').first().text()
        );

        const description = this.truncateDescription(
          this.cleanText(el.find('.job-snippet, .jobCardShelfContainer, .underShelfFooter').first().text())
        );

        const postedDate = this.cleanText(
          el.find('.date, [data-testid="myJobsStateDate"]').first().text()
        );

        if (title && (company || url)) {
          const job: Job = {
            title,
            company: company || 'Not specified',
            location: location || profile.location,
            salary: salary || 'Not specified',
            postedDate,
            description,
            url,
            source: 'indeed',
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
