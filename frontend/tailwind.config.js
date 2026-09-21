/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      /**
       * ─── Brand Colors ───────────────────────────────────────────────────────
       * Primary brand: deep BIT-purple (current dominant color)
       * Secondary: university-blue accent for links and secondary actions
       */
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        secondary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        /**
         * ─── Semantic / State Colors ──────────────────────────────────────────
         */
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        info: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },

        /**
         * ─── Neutral / Surface Palette ────────────────────────────────────────
         * Mapped from the neutral- family (preferred over gray for semantic clarity).
         * Existing gray-* usages remain fully functional; neutral provides the
         * preferred new vocabulary.
         */
        neutral: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          950: '#0a0a0a',
        },
        surface: {
          DEFAULT: '#ffffff',
          raised:  '#fafafa',
          subtle:  '#f5f5f5',
        },
      },

      /**
       * ─── Border Radius Tokens ─────────────────────────────────────────────
       */
      borderRadius: {
        none:    '0px',
        sm:      '0.25rem',
        DEFAULT: '0.375rem',   // 6px — slightly softer than Tailwind default (4px)
        md:      '0.5rem',
        lg:      '0.75rem',
        xl:      '1rem',
        '2xl':   '1.25rem',
        '3xl':   '1.5rem',
        full:    '9999px',
      },

      /**
       * ─── Shadow Tokens ────────────────────────────────────────────────────
       */
      boxShadow: {
        none:     '0 0 #0000',
        sm:       '0 1px 2px 0 rgba(0,0,0,.05)',
        DEFAULT:  '0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)',
        md:       '0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)',
        lg:       '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)',
        xl:       '0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)',
        '2xl':    '0 25px 50px -12px rgba(0,0,0,.25)',
        inner:    'inset 0 2px 4px 0 rgba(0,0,0,.05)',
        // Role-specific brand shadows
        primary:  '0 4px 14px 0 rgba(124,58,237,.25)',
        soft:     '0 2px 8px 0 rgba(0,0,0,.08)',
      },

      /**
       * ─── Typography Enhancements ──────────────────────────────────────────
       */
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight:   '-0.025em',
        normal:  '0em',
        wide:    '0.025em',
        wider:   '0.05em',
        widest:  '0.1em',
      },
      lineHeight: {
        none:      '1',
        tighter:   '1.25',
        tight:     '1.375',
        slim:      '1.5',
        normal:    '1.625',
        relaxed:   '1.75',
        loose:     '2',
      },
    },
  },
  plugins: [],
};
