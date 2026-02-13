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
export declare const UK_JOB_SITES: readonly ["indeed", "reed", "totaljobs", "cvlibrary", "linkedin", "glassdoor"];
export type JobSite = typeof UK_JOB_SITES[number];
export declare const SITE_LABELS: Record<JobSite, string>;
export declare const CONTRACT_TYPES: readonly ["all", "permanent", "contract", "temporary", "part-time"];
export declare const WORK_MODES: readonly ["all", "remote", "hybrid", "onsite"];
export declare const DATE_POSTED_OPTIONS: readonly ["all", "24h", "7d", "14d", "30d"];
export declare const IPC_CHANNELS: {
    readonly START_SCRAPE: "scrape:start";
    readonly STOP_SCRAPE: "scrape:stop";
    readonly SCRAPE_PROGRESS: "scrape:progress";
    readonly SCRAPE_COMPLETE: "scrape:complete";
    readonly SCRAPE_ERROR: "scrape:error";
    readonly GET_JOBS: "jobs:get";
    readonly DELETE_JOBS: "jobs:delete";
    readonly GET_JOB_COUNT: "jobs:count";
    readonly EXPORT_JOBS: "export:jobs";
    readonly SELECT_EXPORT_PATH: "export:select-path";
    readonly GET_PROFILES: "profiles:get";
    readonly SAVE_PROFILE: "profiles:save";
    readonly DELETE_PROFILE: "profiles:delete";
    readonly GET_SCHEDULES: "schedules:get";
    readonly SAVE_SCHEDULE: "schedules:save";
    readonly DELETE_SCHEDULE: "schedules:delete";
    readonly TOGGLE_SCHEDULE: "schedules:toggle";
    readonly GET_SETTINGS: "settings:get";
    readonly SAVE_SETTINGS: "settings:save";
    readonly MINIMIZE_TO_TRAY: "app:minimize-to-tray";
    readonly SHOW_NOTIFICATION: "app:notification";
};
