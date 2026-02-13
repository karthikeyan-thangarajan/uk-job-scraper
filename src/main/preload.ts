import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Scraping
  startScrape: (profile: unknown) => ipcRenderer.invoke(IPC_CHANNELS.START_SCRAPE, profile),
  stopScrape: () => ipcRenderer.invoke(IPC_CHANNELS.STOP_SCRAPE),
  onScrapeProgress: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.SCRAPE_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SCRAPE_PROGRESS, handler);
  },
  onScrapeComplete: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.SCRAPE_COMPLETE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SCRAPE_COMPLETE, handler);
  },

  // Jobs
  getJobs: (filters: unknown) => ipcRenderer.invoke(IPC_CHANNELS.GET_JOBS, filters),
  deleteJobs: (ids: number[]) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_JOBS, ids),
  getJobCount: () => ipcRenderer.invoke(IPC_CHANNELS.GET_JOB_COUNT),

  // Export
  exportJobs: (options: unknown) => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_JOBS, options),
  selectExportPath: (defaultName: string) => ipcRenderer.invoke(IPC_CHANNELS.SELECT_EXPORT_PATH, defaultName),

  // Profiles
  getProfiles: () => ipcRenderer.invoke(IPC_CHANNELS.GET_PROFILES),
  saveProfile: (profile: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_PROFILE, profile),
  deleteProfile: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_PROFILE, id),

  // Schedules
  getSchedules: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SCHEDULES),
  saveSchedule: (schedule: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_SCHEDULE, schedule),
  deleteSchedule: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_SCHEDULE, id),
  toggleSchedule: (schedule: unknown) => ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_SCHEDULE, schedule),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  saveSettings: (settings: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings),

  // App
  minimizeToTray: () => ipcRenderer.invoke(IPC_CHANNELS.MINIMIZE_TO_TRAY),
  showNotification: (data: { title: string; body: string }) =>
    ipcRenderer.invoke(IPC_CHANNELS.SHOW_NOTIFICATION, data),

  // Listen for tray events
  onTrayStartScrape: (callback: () => void) => {
    ipcRenderer.on('tray:start-scrape', callback);
    return () => ipcRenderer.removeListener('tray:start-scrape', callback);
  },

  onNotification: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.SHOW_NOTIFICATION, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SHOW_NOTIFICATION, handler);
  },
});
