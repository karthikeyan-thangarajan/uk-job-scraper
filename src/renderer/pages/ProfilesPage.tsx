import React, { useState, useEffect } from 'react';
import {
  SearchProfile,
  UK_JOB_SITES,
  SITE_LABELS,
  CONTRACT_TYPES,
  WORK_MODES,
  DATE_POSTED_OPTIONS,
  JobSite,
} from '../../shared/types';

interface ProfilesPageProps {
  addToast: (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const emptyProfile: SearchProfile = {
  name: '',
  keywords: '',
  location: 'United Kingdom',
  salaryMin: 0,
  salaryMax: 0,
  contractType: 'all',
  workMode: 'all',
  datePosted: 'all',
  sites: [...UK_JOB_SITES],
  isActive: true,
  createdAt: '',
  updatedAt: '',
};

export default function ProfilesPage({ addToast }: ProfilesPageProps) {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<SearchProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const result = await window.electronAPI?.getProfiles();
      setProfiles((result || []) as SearchProfile[]);
    } catch {
      addToast('Error', 'Failed to load profiles', 'error');
    }
  };

  const handleSave = async () => {
    const profile = editingProfile;
    if (!profile) return;

    if (!profile.name.trim()) {
      addToast('Validation Error', 'Please enter a profile name', 'warning');
      return;
    }
    if (!profile.keywords.trim()) {
      addToast('Validation Error', 'Please enter search keywords', 'warning');
      return;
    }

    try {
      await window.electronAPI?.saveProfile(profile);
      addToast('Saved', `Profile "${profile.name}" saved successfully`, 'success');
      setEditingProfile(null);
      setIsCreating(false);
      loadProfiles();
    } catch {
      addToast('Error', 'Failed to save profile', 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await window.electronAPI?.deleteProfile(id);
      addToast('Deleted', `Profile "${name}" deleted`, 'success');
      loadProfiles();
    } catch {
      addToast('Error', 'Failed to delete profile', 'error');
    }
  };

  const toggleSite = (site: string) => {
    if (!editingProfile) return;
    const sites = editingProfile.sites.includes(site)
      ? editingProfile.sites.filter(s => s !== site)
      : [...editingProfile.sites, site];
    setEditingProfile({ ...editingProfile, sites });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Profiles</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Save and manage your search configurations
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProfile({ ...emptyProfile });
            setIsCreating(true);
          }}
          className="btn-primary"
        >
          + New Profile
        </button>
      </div>

      {/* Profile Editor */}
      {editingProfile && (
        <div className="card border-primary-300 dark:border-primary-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {isCreating ? 'Create Profile' : 'Edit Profile'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile Name *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Senior Dev Roles"
                value={editingProfile.name}
                onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Keywords *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Software Engineer"
                value={editingProfile.keywords}
                onChange={e => setEditingProfile({ ...editingProfile, keywords: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                className="input-field"
                value={editingProfile.location}
                onChange={e => setEditingProfile({ ...editingProfile, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contract Type
              </label>
              <select
                className="select-field"
                value={editingProfile.contractType}
                onChange={e => setEditingProfile({ ...editingProfile, contractType: e.target.value })}
              >
                {CONTRACT_TYPES.map(t => (
                  <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Salary Min (£)
              </label>
              <input
                type="number"
                className="input-field"
                value={editingProfile.salaryMin || ''}
                onChange={e => setEditingProfile({ ...editingProfile, salaryMin: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Salary Max (£)
              </label>
              <input
                type="number"
                className="input-field"
                value={editingProfile.salaryMax || ''}
                onChange={e => setEditingProfile({ ...editingProfile, salaryMax: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Mode
              </label>
              <select
                className="select-field"
                value={editingProfile.workMode}
                onChange={e => setEditingProfile({ ...editingProfile, workMode: e.target.value })}
              >
                {WORK_MODES.map(m => (
                  <option key={m} value={m}>{m === 'all' ? 'All Modes' : m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Posted
              </label>
              <select
                className="select-field"
                value={editingProfile.datePosted}
                onChange={e => setEditingProfile({ ...editingProfile, datePosted: e.target.value })}
              >
                {DATE_POSTED_OPTIONS.map(o => {
                  const labels: Record<string, string> = { all: 'Any Time', '24h': 'Last 24 Hours', '7d': 'Last 7 Days', '14d': 'Last 14 Days', '30d': 'Last 30 Days' };
                  return <option key={o} value={o}>{labels[o]}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Sites */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Sites
            </label>
            <div className="flex flex-wrap gap-2">
              {UK_JOB_SITES.map(site => (
                <button
                  key={site}
                  onClick={() => toggleSite(site)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    editingProfile.sites.includes(site)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {SITE_LABELS[site as JobSite]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={handleSave} className="btn-primary">Save Profile</button>
            <button onClick={() => { setEditingProfile(null); setIsCreating(false); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profiles List */}
      <div className="space-y-4">
        {profiles.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No profiles yet</p>
            <p className="text-gray-400 dark:text-gray-500 mt-1">Create a profile to save your search settings</p>
          </div>
        ) : (
          profiles.map(profile => (
            <div key={profile.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-lg">{profile.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Keywords: <strong>{profile.keywords}</strong> | Location: <strong>{profile.location}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.sites.map(site => (
                      <span key={site} className="badge badge-info">
                        {SITE_LABELS[site as JobSite] || site}
                      </span>
                    ))}
                    {profile.contractType !== 'all' && (
                      <span className="badge badge-warning">{profile.contractType}</span>
                    )}
                    {profile.workMode !== 'all' && (
                      <span className="badge badge-success">{profile.workMode}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingProfile({ ...profile }); setIsCreating(false); }}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id!, profile.name)}
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
