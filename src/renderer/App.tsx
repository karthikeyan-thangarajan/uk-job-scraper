import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import JobsPage from './pages/JobsPage';
import ProfilesPage from './pages/ProfilesPage';
import SchedulesPage from './pages/SchedulesPage';
import SettingsPage from './pages/SettingsPage';
import Toast from './components/Toast';

type Page = 'dashboard' | 'search' | 'jobs' | 'profiles' | 'schedules' | 'settings';

interface ToastMessage {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // Load theme preference
    const loadTheme = async () => {
      try {
        const settings = await window.electronAPI?.getSettings();
        if (settings && (settings as { theme: string }).theme === 'dark') {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
        }
      } catch {
        // Fallback: check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setDarkMode(true);
          document.documentElement.classList.add('dark');
        }
      }
    };
    loadTheme();

    // Listen for notifications from main process
    const unsubscribe = window.electronAPI?.onNotification?.((data: unknown) => {
      const notif = data as { title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' };
      addToast(notif.title, notif.message, notif.type);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    window.electronAPI?.saveSettings?.({ theme: darkMode ? 'light' : 'dark' });
  };

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} addToast={addToast} />;
      case 'search':
        return <SearchPage addToast={addToast} />;
      case 'jobs':
        return <JobsPage addToast={addToast} />;
      case 'profiles':
        return <ProfilesPage addToast={addToast} />;
      case 'schedules':
        return <SchedulesPage addToast={addToast} />;
      case 'settings':
        return <SettingsPage addToast={addToast} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} addToast={addToast} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderPage()}
        </div>
      </main>

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
}
