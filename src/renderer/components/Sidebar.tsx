import React from 'react';

type Page = 'dashboard' | 'search' | 'jobs' | 'profiles' | 'schedules' | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'search', label: 'Search Jobs', icon: '🔍' },
  { id: 'jobs', label: 'Saved Jobs', icon: '💼' },
  { id: 'profiles', label: 'Profiles', icon: '👤' },
  { id: 'schedules', label: 'Schedules', icon: '⏰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ currentPage, onNavigate, darkMode, onToggleDarkMode }: SidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
          UK Job Scraper
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Find your next opportunity
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`sidebar-item w-full text-left ${
              currentPage === item.id ? 'active' : ''
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onToggleDarkMode}
          className="sidebar-item w-full text-left"
        >
          <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
