export const UK_JOB_SITES = [
  'indeed',
  'reed',
  'totaljobs',
  'cvlibrary',
  'linkedin',
  'glassdoor',
] as const;

export type JobSite = typeof UK_JOB_SITES[number];

export const SITE_LABELS: Record<JobSite, string> = {
  indeed: 'Indeed UK',
  reed: 'Reed',
  totaljobs: 'Totaljobs',
  cvlibrary: 'CV-Library',
  linkedin: 'LinkedIn',
  glassdoor: 'Glassdoor',
};

export const CONTRACT_TYPES = ['all', 'permanent', 'contract', 'temporary', 'part-time'] as const;
export const WORK_MODES = ['all', 'remote', 'hybrid', 'onsite'] as const;
export const DATE_POSTED_OPTIONS = ['all', '24h', '7d', '14d', '30d'] as const;
export const RADIUS_OPTIONS = [0, 5, 10, 15, 20, 30, 50, 100] as const;
export const RADIUS_LABELS: Record<number, string> = {
  0: 'Exact location only',
  5: 'Within 5 miles',
  10: 'Within 10 miles',
  15: 'Within 15 miles',
  20: 'Within 20 miles',
  30: 'Within 30 miles',
  50: 'Within 50 miles',
  100: 'Within 100 miles',
};

// Re-export interfaces from shared types
export type { Job, SearchProfile, ScheduleConfig, ScrapeResult, ScrapeProgress, ExportOptions, AppSettings } from '../shared/types';
