import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  dialog,
  Notification,
} from 'electron';
import path from 'path';
import {
  initDatabase,
  closeDatabase,
  getJobs,
  deleteJobs,
  getJobCount,
  getAllJobsForExport,
  getProfiles,
  saveProfile,
  deleteProfile,
  getSchedules,
  saveSchedule,
  deleteSchedule,
  getSettings,
  saveSettings,
} from './database';
import { ScrapeEngine } from './scraper/engine';
import { Scheduler } from './scheduler';
import { exportToExcel, exportToCsv } from './exporter';
import { logger } from './logger';
import {
  IPC_CHANNELS,
  SearchProfile,
  ScheduleConfig,
  ExportOptions,
  AppSettings,
} from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let scrapeEngine: ScrapeEngine;
let scheduler: Scheduler;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'UK Job Scraper',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    // Minimize to tray instead of closing
    if (tray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  scheduler.setMainWindow(mainWindow);
}

function createTray(): void {
  // Create a simple 16x16 tray icon
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Start Scrape',
      click: () => {
        mainWindow?.webContents.send('tray:start-scrape');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        tray?.destroy();
        tray = null;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('UK Job Scraper');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function setupIpcHandlers(): void {
  // Scraping
  ipcMain.handle(IPC_CHANNELS.START_SCRAPE, async (_event, profile: SearchProfile) => {
    try {
      const results = await scrapeEngine.scrape(profile, mainWindow);
      return { success: true, results };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Scrape failed: ${message}`);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.STOP_SCRAPE, () => {
    scrapeEngine.stop();
    return { success: true };
  });

  // Jobs
  ipcMain.handle(IPC_CHANNELS.GET_JOBS, (_event, filters) => {
    return getJobs(filters);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_JOBS, (_event, ids: number[]) => {
    return deleteJobs(ids);
  });

  ipcMain.handle(IPC_CHANNELS.GET_JOB_COUNT, () => {
    return getJobCount();
  });

  // Export
  ipcMain.handle(IPC_CHANNELS.EXPORT_JOBS, async (_event, options: ExportOptions & { profileId?: number }) => {
    try {
      const jobs = getAllJobsForExport(options.profileId);
      if (jobs.length === 0) {
        return { success: false, error: 'No jobs to export' };
      }

      let filePath: string;
      if (options.format === 'csv') {
        filePath = await exportToCsv(jobs, options.filePath, options.includeDescription);
      } else {
        filePath = await exportToExcel(jobs, options);
      }
      return { success: true, filePath, count: jobs.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SELECT_EXPORT_PATH, async (_event, defaultName: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: defaultName,
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePath;
  });

  // Profiles
  ipcMain.handle(IPC_CHANNELS.GET_PROFILES, () => {
    return getProfiles();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_PROFILE, (_event, profile: SearchProfile) => {
    return saveProfile(profile);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_PROFILE, (_event, id: number) => {
    deleteProfile(id);
    return { success: true };
  });

  // Schedules
  ipcMain.handle(IPC_CHANNELS.GET_SCHEDULES, () => {
    return getSchedules();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SCHEDULE, (_event, schedule: ScheduleConfig) => {
    const saved = saveSchedule(schedule);
    scheduler.addSchedule(saved);
    return saved;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_SCHEDULE, (_event, id: number) => {
    scheduler.removeSchedule(id);
    deleteSchedule(id);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.TOGGLE_SCHEDULE, (_event, schedule: ScheduleConfig) => {
    const saved = saveSchedule(schedule);
    if (saved.enabled) {
      scheduler.addSchedule(saved);
    } else {
      scheduler.removeSchedule(saved.id!);
    }
    return saved;
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
    return getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_event, settings: Partial<AppSettings>) => {
    saveSettings(settings);
    if (settings.requestDelay !== undefined || settings.maxRetries !== undefined) {
      const current = getSettings();
      scrapeEngine.updateSettings(current.requestDelay, current.maxRetries);
    }
    return { success: true };
  });

  // App
  ipcMain.handle(IPC_CHANNELS.MINIMIZE_TO_TRAY, () => {
    mainWindow?.hide();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.SHOW_NOTIFICATION, (_event, { title, body }: { title: string; body: string }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
    return { success: true };
  });
}

// App lifecycle
app.whenReady().then(() => {
  initDatabase();

  const settings = getSettings();
  scrapeEngine = new ScrapeEngine(settings.requestDelay, settings.maxRetries);
  scheduler = new Scheduler(scrapeEngine);

  setupIpcHandlers();
  createWindow();
  createTray();

  // Initialize scheduled tasks
  scheduler.initializeSchedules();

  logger.info('Application started');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  scheduler.stopAll();
  closeDatabase();
  tray?.destroy();
  tray = null;
  logger.info('Application shutting down');
});
