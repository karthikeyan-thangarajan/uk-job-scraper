import { BaseScraper } from '../base-scraper';
import { Job, SearchProfile, JobSite } from '../../../shared/types';

export class GlassdoorScraper extends BaseScraper {
  readonly siteName: JobSite = 'glassdoor';
  readonly baseUrl = 'https://www.glassdoor.co.uk';
  private jobs: Job[] = [];

  buildSearchUrl(profile: SearchProfile, page: number): string {
    const params = new URLSearchParams();
    params.set('sc.keyword', profile.keywords);

    if (profile.location && profile.location !== 'United Kingdom') {
      params.set('locT', 'C');
      params.set('locKeyword', profile.location);
    }

    if (page > 1) {
      params.set('p', String(page));
    }

    if (profile.datePosted !== 'all') {
      const dateMap: Record<string, string> = { '24h': '1', '7d': '7', '14d': '14', '30d': '30' };
      params.set('fromAge', dateMap[profile.datePosted] || '');
    }

    return `${this.baseUrl}/Job/jobs.htm?${params.toString()}`;
  }

  parseJobListings(html: string, profile: SearchProfile): Job[] {
    const $ = this.loadHtml(html);
    const pageJobs: Job[] = [];
    const now = new Date().toISOString();

    // Glassdoor job listing selectors
    $('[data-test="jobListing"], .jobCard, .react-job-listing').each((_, element) => {
      try {
        const el = $(element);

        const titleEl = el.find('[data-test="job-title"], .jobCard__title a, .job-title a').first();
        const title = this.cleanText(titleEl.text());
        const relativeUrl = titleEl.attr('href') || el.find('a').first().attr('href') || '';
        const url = relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`;

        const company = this.cleanText(
          el.find('[data-test="employer-name"], .jobCard__company, .job-employer').first().text()
        );

        const location = this.cleanText(
          el.find('[data-test="emp-location"], .jobCard__location, .job-location').first().text()
        );

        const salary = this.cleanText(
          el.find('[data-test="detailSalary"], .jobCard__salary, .salary-estimate').first().text()
        );

        const postedDate = this.cleanText(
          el.find('[data-test="job-age"], .jobCard__date, .listing-age').first().text()
        );

        if (title && url) {
          const job: Job = {
            title,
            company: company || 'Not specified',
            location: location || profile.location,
            salary: salary || 'Not specified',
            postedDate,
            description: '',
            url,
            source: 'glassdoor',
            contractType: profile.contractType,
            workMode: this.detectWorkMode(title + ' ' + location),
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
