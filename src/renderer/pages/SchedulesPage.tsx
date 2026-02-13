import React, { useState, useEffect } from 'react';
import { ScheduleConfig, SearchProfile } from '../constants';

interface SchedulesPageProps {
  addToast: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const PRESET_SCHEDULES = [
  { label: 'Every morning at 9 AM', cron: '0 9 * * *' },
  { label: 'Every evening at 6 PM', cron: '0 18 * * *' },
  { label: 'Twice daily (9 AM & 6 PM)', cron: '0 9,18 * * *' },
  { label: 'Every Monday at 9 AM', cron: '0 9 * * 1' },
  { label: 'Weekdays at 8 AM', cron: '0 8 * * 1-5' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Custom', cron: '' },
];

export default function SchedulesPage({ addToast }: SchedulesPageProps) {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>('');
  const [selectedPreset, setSelectedPreset] = useState(PRESET_SCHEDULES[0].cron);
  const [customCron, setCustomCron] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesResult, profilesResult] = await Promise.all([
        window.electronAPI?.getSchedules(),
        window.electronAPI?.getProfiles(),
      ]);
      setSchedules((schedulesResult || []) as ScheduleConfig[]);
      setProfiles((profilesResult || []) as SearchProfile[]);
    } catch {
      addToast('Error', 'Failed to load schedules', 'error');
    }
  };

  const handleCreate = async () => {
    if (!selectedProfileId) {
      addToast('Validation Error', 'Please select a search profile', 'warning');
      return;
    }

    const cronExpression = selectedPreset || customCron;
    if (!cronExpression) {
      addToast('Validation Error', 'Please select or enter a schedule', 'warning');
      return;
    }

    try {
      await window.electronAPI?.saveSchedule({
        profileId: selectedProfileId as number,
        cronExpression,
        enabled: true,
        lastRun: null,
        nextRun: null,
      });
      addToast('Created', 'Schedule created successfully', 'success');
      setIsCreating(false);
      setSelectedProfileId('');
      loadData();
    } catch {
      addToast('Error', 'Failed to create schedule', 'error');
    }
  };

  const handleToggle = async (schedule: ScheduleConfig) => {
    try {
      await window.electronAPI?.toggleSchedule({
        ...schedule,
        enabled: !schedule.enabled,
      });
      loadData();
      addToast(
        schedule.enabled ? 'Disabled' : 'Enabled',
        `Schedule ${schedule.enabled ? 'paused' : 'activated'}`,
        'info'
      );
    } catch {
      addToast('Error', 'Failed to toggle schedule', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI?.deleteSchedule(id);
      addToast('Deleted', 'Schedule removed', 'success');
      loadData();
    } catch {
      addToast('Error', 'Failed to delete schedule', 'error');
    }
  };

  const getProfileName = (profileId: number) => {
    return profiles.find(p => p.id === profileId)?.name || `Profile #${profileId}`;
  };

  const describeCron = (cron: string): string => {
    const preset = PRESET_SCHEDULES.find(p => p.cron === cron);
    if (preset) return preset.label;
    return `Custom: ${cron}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedules</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Automate your job searches
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary"
          disabled={profiles.length === 0}
        >
          + New Schedule
        </button>
      </div>

      {profiles.length === 0 && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200">
            You need to create a search profile first before setting up a schedule.
          </p>
        </div>
      )}

      {/* Create Schedule */}
      {isCreating && (
        <div className="card border-primary-300 dark:border-primary-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Create Schedule
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Profile *
              </label>
              <select
                className="select-field"
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value ? parseInt(e.target.value) : '')}
              >
                <option value="">Select a profile...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.keywords})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule
              </label>
              <select
                className="select-field"
                value={selectedPreset}
                onChange={e => setSelectedPreset(e.target.value)}
              >
                {PRESET_SCHEDULES.map(preset => (
                  <option key={preset.cron || 'custom'} value={preset.cron}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedPreset === '' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Cron Expression
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 0 9 * * 1-5 (weekdays at 9 AM)"
                  value={customCron}
                  onChange={e => setCustomCron(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleCreate} className="btn-primary">Create Schedule</button>
              <button onClick={() => setIsCreating(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.length === 0 && !isCreating ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No schedules yet</p>
            <p className="text-gray-400 dark:text-gray-500 mt-1">
              Create a schedule to automatically run job searches
            </p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div key={schedule.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(schedule)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      schedule.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        schedule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getProfileName(schedule.profileId)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {describeCron(schedule.cronExpression)}
                    </p>
                    {schedule.lastRun && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Last run: {new Date(schedule.lastRun).toLocaleString('en-GB')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`badge ${schedule.enabled ? 'badge-success' : 'badge-warning'}`}>
                    {schedule.enabled ? 'Active' : 'Paused'}
                  </span>
                  <button
                    onClick={() => handleDelete(schedule.id!)}
                    className="btn-danger text-sm py-1.5 px-3"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
