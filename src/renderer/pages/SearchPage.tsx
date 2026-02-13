import React, { useState } from 'react';
import {
  SearchProfile,
  ScrapeProgress,
  ScrapeResult,
  UK_JOB_SITES,
  SITE_LABELS,
  CONTRACT_TYPES,
  WORK_MODES,
  DATE_POSTED_OPTIONS,
  RADIUS_OPTIONS,
  RADIUS_LABELS,
  JobSite,
} from '../constants';

interface SearchPageProps {
  addToast: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function SearchPage({ addToast }: SearchPageProps) {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('United Kingdom');
  const [radiusMiles, setRadiusMiles] = useState(15);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [contractType, setContractType] = useState('all');
  const [workMode, setWorkMode] = useState('all');
  const [datePosted, setDatePosted] = useState('all');
  const [selectedSites, setSelectedSites] = useState<string[]>([...UK_JOB_SITES]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [results, setResults] = useState<ScrapeResult[] | null>(null);

  const toggleSite = (site: string) => {
    setSelectedSites(prev =>
      prev.includes(site)
        ? prev.filter(s => s !== site)
        : [...prev, site]
    );
  };

  const handleSearch = async () => {
    if (!keywords.trim()) {
      addToast('Validation Error', 'Please enter search keywords', 'warning');
      return;
    }

    if (selectedSites.length === 0) {
      addToast('Validation Error', 'Please select at least one job site', 'warning');
      return;
    }

    setIsSearching(true);
    setResults(null);
    setProgress(null);

    const profile: SearchProfile = {
      name: 'Quick Search',
      keywords: keywords.trim(),
      location,
      radiusMiles,
      salaryMin: salaryMin ? parseInt(salaryMin) : 0,
      salaryMax: salaryMax ? parseInt(salaryMax) : 0,
      contractType,
      workMode,
      datePosted,
      sites: selectedSites,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Listen for progress updates
    const unsubProgress = window.electronAPI?.onScrapeProgress?.((data: unknown) => {
      setProgress(data as ScrapeProgress);
    });

    const unsubComplete = window.electronAPI?.onScrapeComplete?.((data: unknown) => {
      const result = data as { results: ScrapeResult[]; totalJobsFound: number; totalNewJobs: number };
      setResults(result.results);
      addToast(
        'Scrape Complete',
        `Found ${result.totalJobsFound} jobs (${result.totalNewJobs} new)`,
        result.totalNewJobs > 0 ? 'success' : 'info'
      );
    });

    try {
      await window.electronAPI?.startScrape(profile);
    } catch (error) {
      addToast('Scrape Error', String(error), 'error');
    } finally {
      setIsSearching(false);
      unsubProgress?.();
      unsubComplete?.();
    }
  };

  const handleStop = async () => {
    await window.electronAPI?.stopScrape();
    setIsSearching(false);
    addToast('Scrape Stopped', 'The scrape has been stopped', 'info');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Jobs</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Search across UK career sites for job listings
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Keywords */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Keywords *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Software Engineer, Data Analyst, Marketing Manager"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isSearching && handleSearch()}
            />
          </div>

          {/* Base Town / Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base Town / City
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. London, Manchester, Birmingham"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          {/* Proximity Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proximity Radius
            </label>
            <select className="select-field" value={radiusMiles} onChange={e => setRadiusMiles(parseInt(e.target.value))}>
              {RADIUS_OPTIONS.map(r => (
                <option key={r} value={r}>{RADIUS_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Contract Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contract Type
            </label>
            <select className="select-field" value={contractType} onChange={e => setContractType(e.target.value)}>
              {CONTRACT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Salary Min (£)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 30000"
              value={salaryMin}
              onChange={e => setSalaryMin(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Salary Max (£)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 60000"
              value={salaryMax}
              onChange={e => setSalaryMax(e.target.value)}
            />
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Work Mode
            </label>
            <select className="select-field" value={workMode} onChange={e => setWorkMode(e.target.value)}>
              {WORK_MODES.map(mode => (
                <option key={mode} value={mode}>
                  {mode === 'all' ? 'All Modes' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Posted */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Posted
            </label>
            <select className="select-field" value={datePosted} onChange={e => setDatePosted(e.target.value)}>
              {DATE_POSTED_OPTIONS.map(option => {
                const labels: Record<string, string> = {
                  all: 'Any Time',
                  '24h': 'Last 24 Hours',
                  '7d': 'Last 7 Days',
                  '14d': 'Last 14 Days',
                  '30d': 'Last 30 Days',
                };
                return (
                  <option key={option} value={option}>
                    {labels[option]}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Job Sites Selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Sites
          </label>
          <div className="flex flex-wrap gap-2">
            {UK_JOB_SITES.map(site => (
              <button
                key={site}
                onClick={() => toggleSite(site)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSites.includes(site)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {SITE_LABELS[site as JobSite]}
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-6 flex gap-3">
          {!isSearching ? (
            <button onClick={handleSearch} className="btn-primary">
              Start Search
            </button>
          ) : (
            <button onClick={handleStop} className="btn-danger">
              Stop Search
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isSearching && progress && (
        <div className="card">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Search Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{progress.status}</span>
              <span>{progress.sitesCompleted} / {progress.totalSites} sites</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(progress.sitesCompleted / progress.totalSites) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Jobs found so far: <strong>{progress.jobsFound}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Scrape Results</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    result.status === 'success' ? 'badge-success' :
                    result.status === 'blocked' ? 'badge-warning' :
                    result.status === 'partial' ? 'badge-info' : 'badge-danger'
                  }`}>
                    {result.status}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {SITE_LABELS[result.site as JobSite] || result.site}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {result.jobsFound} found, {result.newJobs} new
                  <span className="ml-2 text-xs">({(result.duration / 1000).toFixed(1)}s)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between font-medium">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-gray-900 dark:text-white">
                {results.reduce((s, r) => s + r.jobsFound, 0)} found,{' '}
                {results.reduce((s, r) => s + r.newJobs, 0)} new
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
