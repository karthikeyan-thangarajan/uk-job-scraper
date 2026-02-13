import React, { useState, useEffect } from 'react';

type Page = 'dashboard' | 'search' | 'jobs' | 'profiles' | 'schedules' | 'settings';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  addToast: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface Stats {
  totalJobs: number;
  profileCount: number;
  scheduleCount: number;
}

export default function Dashboard({ onNavigate, addToast }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({ totalJobs: 0, profileCount: 0, scheduleCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [jobCount, profiles, schedules] = await Promise.all([
        window.electronAPI?.getJobCount() ?? 0,
        window.electronAPI?.getProfiles() ?? [],
        window.electronAPI?.getSchedules() ?? [],
      ]);
      setStats({
        totalJobs: jobCount as number,
        profileCount: (profiles as unknown[]).length,
        scheduleCount: (schedules as unknown[]).length,
      });
    } catch {
      addToast('Error', 'Failed to load dashboard stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Quick Search', description: 'Start a new job search', page: 'search' as Page, icon: '🔍' },
    { label: 'View Jobs', description: 'Browse saved job listings', page: 'jobs' as Page, icon: '💼' },
    { label: 'Manage Profiles', description: 'Create or edit search profiles', page: 'profiles' as Page, icon: '👤' },
    { label: 'Set Schedule', description: 'Automate your job searches', page: 'schedules' as Page, icon: '⏰' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Overview of your job scraping activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
              💼
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs Saved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats.totalJobs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Search Profiles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats.profileCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl">
              ⏰
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Schedules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats.scheduleCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className="card hover:shadow-md transition-shadow text-left group"
            >
              <span className="text-3xl mb-3 block">{action.icon}</span>
              <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {action.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      {stats.totalJobs === 0 && !loading && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-2">
            Getting Started
          </h3>
          <p className="text-primary-700 dark:text-primary-300 mb-4">
            Welcome to UK Job Scraper! Here's how to get started:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-primary-700 dark:text-primary-300">
            <li>Create a <strong>Search Profile</strong> with your desired keywords and filters</li>
            <li>Run a <strong>Quick Search</strong> or set up an <strong>Automated Schedule</strong></li>
            <li><strong>Export</strong> your results to Excel for easy review</li>
          </ol>
        </div>
      )}
    </div>
  );
}
