"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.DATE_POSTED_OPTIONS = exports.WORK_MODES = exports.CONTRACT_TYPES = exports.SITE_LABELS = exports.UK_JOB_SITES = void 0;
exports.UK_JOB_SITES = [
    'indeed',
    'reed',
    'totaljobs',
    'cvlibrary',
    'linkedin',
    'glassdoor',
];
exports.SITE_LABELS = {
    indeed: 'Indeed UK',
    reed: 'Reed',
    totaljobs: 'Totaljobs',
    cvlibrary: 'CV-Library',
    linkedin: 'LinkedIn',
    glassdoor: 'Glassdoor',
};
exports.CONTRACT_TYPES = ['all', 'permanent', 'contract', 'temporary', 'part-time'];
exports.WORK_MODES = ['all', 'remote', 'hybrid', 'onsite'];
exports.DATE_POSTED_OPTIONS = ['all', '24h', '7d', '14d', '30d'];
// IPC channel names
exports.IPC_CHANNELS = {
    // Scraping
    START_SCRAPE: 'scrape:start',
    STOP_SCRAPE: 'scrape:stop',
    SCRAPE_PROGRESS: 'scrape:progress',
    SCRAPE_COMPLETE: 'scrape:complete',
    SCRAPE_ERROR: 'scrape:error',
    // Jobs
    GET_JOBS: 'jobs:get',
    DELETE_JOBS: 'jobs:delete',
    GET_JOB_COUNT: 'jobs:count',
    // Export
    EXPORT_JOBS: 'export:jobs',
    SELECT_EXPORT_PATH: 'export:select-path',
    // Profiles
    GET_PROFILES: 'profiles:get',
    SAVE_PROFILE: 'profiles:save',
    DELETE_PROFILE: 'profiles:delete',
    // Schedule
    GET_SCHEDULES: 'schedules:get',
    SAVE_SCHEDULE: 'schedules:save',
    DELETE_SCHEDULE: 'schedules:delete',
    TOGGLE_SCHEDULE: 'schedules:toggle',
    // Settings
    GET_SETTINGS: 'settings:get',
    SAVE_SETTINGS: 'settings:save',
    // App
    MINIMIZE_TO_TRAY: 'app:minimize-to-tray',
    SHOW_NOTIFICATION: 'app:notification',
};
