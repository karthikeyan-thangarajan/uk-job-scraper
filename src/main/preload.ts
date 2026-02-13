import { contextBridge, ipcRenderer } from 'electron';

// Inline channel names to avoid importing shared/types in sandboxed preload
const CH = {
  START_SCRAPE: 'scrape:start',
  STOP_SCRAPE: 'scrape:stop',
  SCRAPE_PROGRESS: 'scrape:progress',
  SCRAPE_COMPLETE: 'scrape:complete',
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
};

contextBridge.exposeInMainWorld('electronAPI', {
  // Scraping
  startScrape: (profile: unknown) => ipcRenderer.invoke(CH.START_SCRAPE, profile),
  stopScrape: () => ipcRenderer.invoke(CH.STOP_SCRAPE),
  onScrapeProgress: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(CH.SCRAPE_PROGRESS, handler);
    return () => ipcRenderer.removeListener(CH.SCRAPE_PROGRESS, handler);
  },
  onScrapeComplete: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(CH.SCRAPE_COMPLETE, handler);
    return () => ipcRenderer.removeListener(CH.SCRAPE_COMPLETE, handler);
  },

  // Jobs
  getJobs: (filters: unknown) => ipcRenderer.invoke(CH.GET_JOBS, filters),
  deleteJobs: (ids: number[]) => ipcRenderer.invoke(CH.DELETE_JOBS, ids),
  getJobCount: () => ipcRenderer.invoke(CH.GET_JOB_COUNT),

  // Export
  exportJobs: (options: unknown) => ipcRenderer.invoke(CH.EXPORT_JOBS, options),
  selectExportPath: (defaultName: string) => ipcRenderer.invoke(CH.SELECT_EXPORT_PATH, defaultName),

  // Profiles
  getProfiles: () => ipcRenderer.invoke(CH.GET_PROFILES),
  saveProfile: (profile: unknown) => ipcRenderer.invoke(CH.SAVE_PROFILE, profile),
  deleteProfile: (id: number) => ipcRenderer.invoke(CH.DELETE_PROFILE, id),

  // Schedules
  getSchedules: () => ipcRenderer.invoke(CH.GET_SCHEDULES),
  saveSchedule: (schedule: unknown) => ipcRenderer.invoke(CH.SAVE_SCHEDULE, schedule),
  deleteSchedule: (id: number) => ipcRenderer.invoke(CH.DELETE_SCHEDULE, id),
  toggleSchedule: (schedule: unknown) => ipcRenderer.invoke(CH.TOGGLE_SCHEDULE, schedule),

  // Settings
  getSettings: () => ipcRenderer.invoke(CH.GET_SETTINGS),
  saveSettings: (settings: unknown) => ipcRenderer.invoke(CH.SAVE_SETTINGS, settings),

  // App
  minimizeToTray: () => ipcRenderer.invoke(CH.MINIMIZE_TO_TRAY),
  showNotification: (data: { title: string; body: string }) =>
    ipcRenderer.invoke(CH.SHOW_NOTIFICATION, data),

  // Listen for tray events
  onTrayStartScrape: (callback: () => void) => {
    ipcRenderer.on('tray:start-scrape', callback);
    return () => ipcRenderer.removeListener('tray:start-scrape', callback);
  },

  onNotification: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(CH.SHOW_NOTIFICATION, handler);
    return () => ipcRenderer.removeListener(CH.SHOW_NOTIFICATION, handler);
  },
});
