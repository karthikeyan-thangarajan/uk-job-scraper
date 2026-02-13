export interface Job {
  id?: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  postedDate: string;
  description: string;
  url: string;
  source: string;
  contractType: string;
  workMode: string;
  scrapedAt: string;
  searchProfileId?: number;
}

export interface SearchProfile {
  id?: number;
  name: string;
  keywords: string;
  location: string;
  radiusMiles: number; // 0 = exact location, 5, 10, 15, 20, 30, 50, 100
  salaryMin: number;
  salaryMax: number;
  contractType: string;
  workMode: string;
  datePosted: string;
  sites: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConfig {
  id?: number;
  profileId: number;
  cronExpression: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
}

export interface ScrapeResult {
  site: string;
  status: 'success' | 'failed' | 'blocked' | 'partial';
  jobsFound: number;
  newJobs: number;
  error?: string;
  duration: number;
}

export interface ScrapeProgress {
  currentSite: string;
  sitesCompleted: number;
  totalSites: number;
  jobsFound: number;
  status: string;
}

export interface ExportOptions {
  format: 'xlsx' | 'csv';
  mode: 'overwrite' | 'append';
  filePath: string;
  includeDescription: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  maxConcurrentScrapes: number;
  requestDelay: number;
  proxyUrl: string;
  useProxies: boolean;
  maxRetries: number;
  exportPath: string;
}

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

export const IPC_CHANNELS = {
  START_SCRAPE: 'scrape:start',
  STOP_SCRAPE: 'scrape:stop',
  SCRAPE_PROGRESS: 'scrape:progress',
  SCRAPE_COMPLETE: 'scrape:complete',
  SCRAPE_ERROR: 'scrape:error',
  GET_JOBS: 'jobs:get',
  DELETE_JOBS: 'jobs:delete',
  GET_JOB_COUNT: 'jobs:count',
  EXPORT_JOBS: 'export:jobs',
  SELECT_EXPORT_PATH: 'export:select-path',
  GET_PROFILES: 'profiles:get',
  SAVE_PROFILE: 'profiles:save',
  DELETE_PROFILE: 'profiles:delete',
  GET_SCHEDULES: 'schedules:get',
  SAVE_SCHEDULE: 'schedules:save',
  DELETE_SCHEDULE: 'schedules:delete',
  TOGGLE_SCHEDULE: 'schedules:toggle',
  GET_SETTINGS: 'settings:get',
  SAVE_SETTINGS: 'settings:save',
  MINIMIZE_TO_TRAY: 'app:minimize-to-tray',
  SHOW_NOTIFICATION: 'app:notification',
} as const;
