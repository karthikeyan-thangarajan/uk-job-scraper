import React, { useState, useEffect, useCallback } from 'react';
import { Job, SITE_LABELS, JobSite, UK_JOB_SITES } from '../../shared/types';

interface JobsPageProps {
  addToast: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function JobsPage({ addToast }: JobsPageProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('scrapedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI?.getJobs({
        search,
        source: sourceFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sortBy,
        sortOrder,
      });
      if (result) {
        setJobs(result.jobs as Job[]);
        setTotal(result.total);
      }
    } catch {
      addToast('Error', 'Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, page, sortBy, sortOrder, addToast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map(j => j.id!)));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedJobs.size === 0) return;
    try {
      await window.electronAPI?.deleteJobs([...selectedJobs]);
      addToast('Deleted', `Removed ${selectedJobs.size} jobs`, 'success');
      setSelectedJobs(new Set());
      loadJobs();
    } catch {
      addToast('Error', 'Failed to delete jobs', 'error');
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    const defaultName = `uk-jobs-${new Date().toISOString().split('T')[0]}.${format}`;
    const filePath = await window.electronAPI?.selectExportPath(defaultName);
    if (!filePath) return;

    try {
      const result = await window.electronAPI?.exportJobs({
        format,
        mode: 'overwrite',
        filePath,
        includeDescription: true,
      });

      if (result?.success) {
        addToast('Export Complete', `Exported ${result.count} jobs to ${format.toUpperCase()}`, 'success');
      } else {
        addToast('Export Failed', result?.error || 'Unknown error', 'error');
      }
    } catch {
      addToast('Error', 'Failed to export jobs', 'error');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Jobs</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {total.toLocaleString()} jobs in database
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('xlsx')} className="btn-primary">
            Export Excel
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary">
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Search by title, company, or location..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source
            </label>
            <select
              className="select-field"
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Sites</option>
              {UK_JOB_SITES.map(site => (
                <option key={site} value={site}>{SITE_LABELS[site]}</option>
              ))}
            </select>
          </div>
          {selectedJobs.size > 0 && (
            <button onClick={handleDeleteSelected} className="btn-danger">
              Delete ({selectedJobs.size})
            </button>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={jobs.length > 0 && selectedJobs.size === jobs.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                {[
                  { key: 'title', label: 'Job Title' },
                  { key: 'company', label: 'Company' },
                  { key: 'location', label: 'Location' },
                  { key: 'salary', label: 'Salary' },
                  { key: 'source', label: 'Source' },
                  { key: 'scrapedAt', label: 'Scraped' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                  >
                    {col.label}
                    {sortBy === col.key && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 w-20">
                  Link
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No jobs found. Start a search to discover job listings.
                  </td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr
                    key={job.id}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedJobs.has(job.id!)}
                        onChange={() => handleToggleSelect(job.id!)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {highlightKeyword(job.title, search)}
                      </div>
                      {job.workMode && job.workMode !== 'onsite' && (
                        <span className={`badge mt-1 ${
                          job.workMode === 'remote' ? 'badge-success' : 'badge-info'
                        }`}>
                          {job.workMode}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {highlightKeyword(job.company, search)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {highlightKeyword(job.location, search)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {job.salary}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-info">
                        {SITE_LABELS[job.source as JobSite] || job.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(job.scrapedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
                      >
                        Open →
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`py-1 px-3 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
