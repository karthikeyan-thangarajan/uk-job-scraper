import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { Job, SearchProfile, ScheduleConfig, AppSettings } from '../shared/types';

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'uk-job-scraper.db');
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      salary TEXT DEFAULT '',
      postedDate TEXT DEFAULT '',
      description TEXT DEFAULT '',
      url TEXT NOT NULL,
      source TEXT NOT NULL,
      contractType TEXT DEFAULT '',
      workMode TEXT DEFAULT '',
      scrapedAt TEXT NOT NULL,
      searchProfileId INTEGER,
      UNIQUE(url, source)
    );

    CREATE TABLE IF NOT EXISTS search_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      keywords TEXT NOT NULL,
      location TEXT DEFAULT 'United Kingdom',
      salaryMin INTEGER DEFAULT 0,
      salaryMax INTEGER DEFAULT 0,
      contractType TEXT DEFAULT 'all',
      workMode TEXT DEFAULT 'all',
      datePosted TEXT DEFAULT 'all',
      sites TEXT NOT NULL DEFAULT '["indeed","reed","totaljobs","cvlibrary"]',
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER NOT NULL,
      cronExpression TEXT NOT NULL DEFAULT '0 9 * * *',
      enabled INTEGER DEFAULT 0,
      lastRun TEXT,
      nextRun TEXT,
      FOREIGN KEY (profileId) REFERENCES search_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
    CREATE INDEX IF NOT EXISTS idx_jobs_scraped ON jobs(scrapedAt);
    CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
  `);

  // Insert default settings if not present
  const defaultSettings: AppSettings = {
    theme: 'light',
    notificationsEnabled: true,
    maxConcurrentScrapes: 2,
    requestDelay: 2000,
    proxyUrl: '',
    useProxies: false,
    maxRetries: 3,
    exportPath: app.getPath('documents'),
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, JSON.stringify(value));
  }
}

// Jobs
export function insertJob(job: Job): { inserted: boolean; id: number } {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO jobs (title, company, location, salary, postedDate, description, url, source, contractType, workMode, scrapedAt, searchProfileId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    job.title, job.company, job.location, job.salary, job.postedDate,
    job.description, job.url, job.source, job.contractType, job.workMode,
    job.scrapedAt, job.searchProfileId || null
  );

  return { inserted: result.changes > 0, id: Number(result.lastInsertRowid) };
}

export function getJobs(filters?: {
  search?: string;
  source?: string;
  profileId?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): { jobs: Job[]; total: number } {
  let whereClause = 'WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.search) {
    whereClause += ' AND (title LIKE ? OR company LIKE ? OR location LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters?.source && filters.source !== 'all') {
    whereClause += ' AND source = ?';
    params.push(filters.source);
  }

  if (filters?.profileId) {
    whereClause += ' AND searchProfileId = ?';
    params.push(filters.profileId);
  }

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM jobs ${whereClause}`);
  const { total } = countStmt.get(...params) as { total: number };

  const sortBy = filters?.sortBy || 'scrapedAt';
  const sortOrder = filters?.sortOrder || 'desc';
  const allowedSortColumns = ['title', 'company', 'location', 'salary', 'postedDate', 'source', 'scrapedAt'];
  const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'scrapedAt';
  const safeOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const stmt = db.prepare(
    `SELECT * FROM jobs ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`
  );
  const jobs = stmt.all(...params, limit, offset) as Job[];

  return { jobs, total };
}

export function deleteJobs(ids: number[]): number {
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`DELETE FROM jobs WHERE id IN (${placeholders})`);
  return stmt.run(...ids).changes;
}

export function getJobCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM jobs');
  return (stmt.get() as { count: number }).count;
}

export function getAllJobsForExport(profileId?: number): Job[] {
  if (profileId) {
    return db.prepare('SELECT * FROM jobs WHERE searchProfileId = ? ORDER BY scrapedAt DESC').all(profileId) as Job[];
  }
  return db.prepare('SELECT * FROM jobs ORDER BY scrapedAt DESC').all() as Job[];
}

// Search Profiles
export function getProfiles(): SearchProfile[] {
  const rows = db.prepare('SELECT * FROM search_profiles ORDER BY updatedAt DESC').all() as Array<SearchProfile & { sites: string; isActive: number }>;
  return rows.map(row => ({
    ...row,
    sites: JSON.parse(row.sites as string),
    isActive: Boolean(row.isActive),
  }));
}

export function saveProfile(profile: SearchProfile): SearchProfile {
  const now = new Date().toISOString();
  if (profile.id) {
    db.prepare(`
      UPDATE search_profiles SET name=?, keywords=?, location=?, salaryMin=?, salaryMax=?,
        contractType=?, workMode=?, datePosted=?, sites=?, isActive=?, updatedAt=?
      WHERE id=?
    `).run(
      profile.name, profile.keywords, profile.location, profile.salaryMin, profile.salaryMax,
      profile.contractType, profile.workMode, profile.datePosted, JSON.stringify(profile.sites),
      profile.isActive ? 1 : 0, now, profile.id
    );
    return { ...profile, updatedAt: now };
  } else {
    const result = db.prepare(`
      INSERT INTO search_profiles (name, keywords, location, salaryMin, salaryMax, contractType, workMode, datePosted, sites, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      profile.name, profile.keywords, profile.location, profile.salaryMin, profile.salaryMax,
      profile.contractType, profile.workMode, profile.datePosted, JSON.stringify(profile.sites),
      profile.isActive ? 1 : 0, now, now
    );
    return { ...profile, id: Number(result.lastInsertRowid), createdAt: now, updatedAt: now };
  }
}

export function deleteProfile(id: number): void {
  db.prepare('DELETE FROM search_profiles WHERE id = ?').run(id);
}

// Schedules
export function getSchedules(): ScheduleConfig[] {
  const rows = db.prepare('SELECT * FROM schedules').all() as Array<ScheduleConfig & { enabled: number }>;
  return rows.map(row => ({ ...row, enabled: Boolean(row.enabled) }));
}

export function saveSchedule(schedule: ScheduleConfig): ScheduleConfig {
  if (schedule.id) {
    db.prepare(`
      UPDATE schedules SET profileId=?, cronExpression=?, enabled=?, lastRun=?, nextRun=?
      WHERE id=?
    `).run(schedule.profileId, schedule.cronExpression, schedule.enabled ? 1 : 0, schedule.lastRun, schedule.nextRun, schedule.id);
    return schedule;
  } else {
    const result = db.prepare(`
      INSERT INTO schedules (profileId, cronExpression, enabled, lastRun, nextRun)
      VALUES (?, ?, ?, ?, ?)
    `).run(schedule.profileId, schedule.cronExpression, schedule.enabled ? 1 : 0, schedule.lastRun, schedule.nextRun);
    return { ...schedule, id: Number(result.lastInsertRowid) };
  }
}

export function deleteSchedule(id: number): void {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
}

export function updateScheduleLastRun(id: number, lastRun: string, nextRun: string): void {
  db.prepare('UPDATE schedules SET lastRun = ?, nextRun = ? WHERE id = ?').run(lastRun, nextRun, id);
}

// Settings
export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = JSON.parse(row.value);
  }
  return settings as unknown as AppSettings;
}

export function saveSetting(key: string, value: unknown): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction((entries: [string, unknown][]) => {
    for (const [key, value] of entries) {
      updateStmt.run(key, JSON.stringify(value));
    }
  });
  transaction(Object.entries(settings));
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
