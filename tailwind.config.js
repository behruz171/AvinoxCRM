/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1f2e',
        'sidebar-hover': '#252b3b',
        'sidebar-active': '#2d3550',
        primary: '#2563eb',
        'primary-hover': '#1d4ed8',
        surface: '#ffffff',
        background: '#f1f5f9',
        border: '#e2e8f0',
        muted: '#64748b',
        foreground: '#0f172a',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        'steel-light': '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

