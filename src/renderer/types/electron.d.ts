export interface ElectronAPI {
  // Scraping
  startScrape: (profile: unknown) => Promise<{ success: boolean; results?: unknown[]; error?: string }>;
  stopScrape: () => Promise<{ success: boolean }>;
  onScrapeProgress: (callback: (data: unknown) => void) => () => void;
  onScrapeComplete: (callback: (data: unknown) => void) => () => void;

  // Jobs
  getJobs: (filters: unknown) => Promise<{ jobs: unknown[]; total: number }>;
  deleteJobs: (ids: number[]) => Promise<number>;
  getJobCount: () => Promise<number>;

  // Export
  exportJobs: (options: unknown) => Promise<{ success: boolean; filePath?: string; count?: number; error?: string }>;
  selectExportPath: (defaultName: string) => Promise<string | null>;

  // Profiles
  getProfiles: () => Promise<unknown[]>;
  saveProfile: (profile: unknown) => Promise<unknown>;
  deleteProfile: (id: number) => Promise<{ success: boolean }>;

  // Schedules
  getSchedules: () => Promise<unknown[]>;
  saveSchedule: (schedule: unknown) => Promise<unknown>;
  deleteSchedule: (id: number) => Promise<{ success: boolean }>;
  toggleSchedule: (schedule: unknown) => Promise<unknown>;

  // Settings
  getSettings: () => Promise<unknown>;
  saveSettings: (settings: unknown) => Promise<{ success: boolean }>;

  // App
  minimizeToTray: () => Promise<{ success: boolean }>;
  showNotification: (data: { title: string; body: string }) => Promise<{ success: boolean }>;
  onTrayStartScrape: (callback: () => void) => () => void;
  onNotification: (callback: (data: unknown) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
