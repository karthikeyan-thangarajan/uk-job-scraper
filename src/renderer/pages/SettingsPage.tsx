import React, { useState, useEffect } from 'react';
import { AppSettings } from '../../shared/types';

interface SettingsPageProps {
  addToast: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function SettingsPage({ addToast, darkMode, toggleDarkMode }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    notificationsEnabled: true,
    maxConcurrentScrapes: 2,
    requestDelay: 2000,
    proxyUrl: '',
    useProxies: false,
    maxRetries: 3,
    exportPath: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.electronAPI?.getSettings();
      if (result) {
        setSettings(result as AppSettings);
      }
    } catch {
      addToast('Error', 'Failed to load settings', 'error');
    }
  };

  const handleSave = async () => {
    try {
      await window.electronAPI?.saveSettings(settings);
      addToast('Settings Saved', 'Your settings have been updated', 'success');
    } catch {
      addToast('Error', 'Failed to save settings', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configure your scraping preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Desktop Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when new jobs are found</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.notificationsEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Scraping Settings */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Scraping Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Request Delay (ms)
            </label>
            <input
              type="number"
              className="input-field"
              value={settings.requestDelay}
              onChange={e => setSettings({ ...settings, requestDelay: parseInt(e.target.value) || 2000 })}
              min={500}
              max={10000}
              step={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Delay between requests to avoid rate limiting (500-10000ms)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Retries
            </label>
            <input
              type="number"
              className="input-field"
              value={settings.maxRetries}
              onChange={e => setSettings({ ...settings, maxRetries: parseInt(e.target.value) || 3 })}
              min={0}
              max={10}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of retry attempts for failed requests
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Concurrent Scrapes
            </label>
            <input
              type="number"
              className="input-field"
              value={settings.maxConcurrentScrapes}
              onChange={e => setSettings({ ...settings, maxConcurrentScrapes: parseInt(e.target.value) || 2 })}
              min={1}
              max={5}
            />
          </div>
        </div>
      </div>

      {/* Proxy Settings */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Proxy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Use Proxy</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Route scraping requests through a proxy server</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, useProxies: !settings.useProxies })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.useProxies ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.useProxies ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.useProxies && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Proxy URL
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="http://proxy:port or socks5://proxy:port"
                value={settings.proxyUrl}
                onChange={e => setSettings({ ...settings, proxyUrl: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
}
