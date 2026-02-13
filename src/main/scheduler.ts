import cron from 'node-cron';
import { BrowserWindow, Notification } from 'electron';
import { ScheduleConfig, IPC_CHANNELS } from '../shared/types';
import { getSchedules, getProfiles, updateScheduleLastRun } from './database';
import { ScrapeEngine } from './scraper/engine';
import { logger } from './logger';

interface ScheduledTask {
  id: number;
  task: cron.ScheduledTask;
}

export class Scheduler {
  private tasks: Map<number, ScheduledTask> = new Map();
  private scrapeEngine: ScrapeEngine;
  private mainWindow: BrowserWindow | null = null;

  constructor(scrapeEngine: ScrapeEngine) {
    this.scrapeEngine = scrapeEngine;
  }

  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  initializeSchedules(): void {
    const schedules = getSchedules();
    for (const schedule of schedules) {
      if (schedule.enabled && schedule.id) {
        this.addSchedule(schedule);
      }
    }
    logger.info(`Initialized ${this.tasks.size} scheduled tasks`);
  }

  addSchedule(schedule: ScheduleConfig): void {
    if (!schedule.id) return;

    // Remove existing if any
    this.removeSchedule(schedule.id);

    if (!schedule.enabled) return;

    if (!cron.validate(schedule.cronExpression)) {
      logger.error(`Invalid cron expression: ${schedule.cronExpression} for schedule ${schedule.id}`);
      return;
    }

    const task = cron.schedule(schedule.cronExpression, async () => {
      await this.runScheduledScrape(schedule);
    });

    this.tasks.set(schedule.id, { id: schedule.id, task });
    logger.info(`Scheduled task ${schedule.id} with cron: ${schedule.cronExpression}`);
  }

  removeSchedule(id: number): void {
    const existing = this.tasks.get(id);
    if (existing) {
      existing.task.stop();
      this.tasks.delete(id);
      logger.info(`Removed scheduled task ${id}`);
    }
  }

  private async runScheduledScrape(schedule: ScheduleConfig): Promise<void> {
    try {
      const profiles = getProfiles();
      const profile = profiles.find(p => p.id === schedule.profileId);

      if (!profile) {
        logger.warn(`Profile ${schedule.profileId} not found for schedule ${schedule.id}`);
        return;
      }

      logger.info(`Running scheduled scrape for profile: ${profile.name}`);

      const results = await this.scrapeEngine.scrape(profile, this.mainWindow);
      const totalNew = results.reduce((sum, r) => sum + r.newJobs, 0);
      const totalFound = results.reduce((sum, r) => sum + r.jobsFound, 0);

      // Update last run time
      const now = new Date().toISOString();
      if (schedule.id) {
        updateScheduleLastRun(schedule.id, now, this.getNextRun(schedule.cronExpression));
      }

      // Show desktop notification
      if (totalNew > 0) {
        const notification = new Notification({
          title: 'UK Job Scraper - New Jobs Found!',
          body: `Found ${totalNew} new jobs (${totalFound} total) for "${profile.name}"`,
          icon: undefined,
        });
        notification.show();

        // Also notify the renderer
        this.mainWindow?.webContents.send(IPC_CHANNELS.SHOW_NOTIFICATION, {
          title: 'New Jobs Found!',
          message: `Found ${totalNew} new jobs for "${profile.name}"`,
          type: 'success',
        });
      }

      logger.info(`Scheduled scrape complete: ${totalFound} found, ${totalNew} new`);
    } catch (error) {
      logger.error(`Scheduled scrape failed: ${error}`);
    }
  }

  private getNextRun(cronExpression: string): string {
    // Simple next run calculation - not perfectly accurate but good enough
    const now = new Date();
    const parts = cronExpression.split(' ');
    if (parts.length >= 5) {
      const [minute, hour] = parts;
      const next = new Date(now);
      if (minute !== '*') next.setMinutes(parseInt(minute));
      if (hour !== '*') next.setHours(parseInt(hour));
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next.toISOString();
    }
    return new Date(now.getTime() + 86400000).toISOString(); // Default: tomorrow
  }

  stopAll(): void {
    for (const [id, { task }] of this.tasks) {
      task.stop();
      logger.info(`Stopped scheduled task ${id}`);
    }
    this.tasks.clear();
  }
}
