
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Apply theme on initial render
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Update localStorage whenever theme changes
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    toast.success(`تم به ${newTheme === 'light' ? 'روشن' : 'تاریک'} تغییر کرد`, {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      title={theme === 'light' ? 'تغییر به حالت تاریک' : 'تغییر به حالت روشن'}
      aria-label={theme === 'light' ? 'تغییر به حالت تاریک' : 'تغییر به حالت روشن'}
    >
      {theme === 'light' ? (
        <svg
          className="w-6 h-6 text-gray-800 dark:text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        <svg
          className="w-6 h-6 text-gray-800 dark:text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;