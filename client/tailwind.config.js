/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ========================================
        // BRAND COLORS - Role-Specific Accents
        // ========================================

        // Primary - Employee accent (soft blue - approachable, trustworthy)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Main employee brand
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // Accent - IC Member accent (teal/green - professional, balanced)
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',  // Main IC brand
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },

        // Admin - Admin accent (indigo - authoritative, sophisticated)
        admin: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // Main admin brand
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },

        // ========================================
        // BASE COLORS - Shared Across All Roles
        // ========================================

        // Warm - Warm grays (empathetic, not cold corporate)
        warm: {
          50: '#fafaf9',   // Backgrounds
          100: '#f5f5f4',  // Subtle backgrounds
          200: '#e7e5e4',  // Borders, dividers
          300: '#d6d3d1',  // Disabled states
          400: '#a8a29e',  // Placeholders
          500: '#78716c',  // Secondary text
          600: '#57534e',  // Body text
          700: '#44403c',  // Headings
          800: '#292524',  // High contrast text
          900: '#1c1917',  // Maximum contrast
        },

        // ========================================
        // SEMANTIC COLORS - Meaning-Based
        // ========================================

        // Success - Positive actions, confirmations
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },

        // Warning - Caution, pending actions
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },

        // Danger - Errors, destructive actions
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },

        // Info - Informational messages
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        // ========================================
        // SPECIAL PURPOSE COLORS
        // ========================================

        safe: '#10b981',     // Confidentiality badges, secure indicators
        gentle: '#fafaf9',   // Soft backgrounds for reduced anxiety
      },

      // ========================================
      // TYPOGRAPHY
      // ========================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display sizes
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],      // 56px
        'display-md': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],       // 48px
        'display-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],     // 36px

        // Headings
        'h1': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],               // 32px
        'h2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],              // 24px
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],                                       // 20px
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],                                      // 18px

        // Body text
        'body-lg': ['1.125rem', { lineHeight: '1.75' }],                                                   // 18px
        'body': ['1rem', { lineHeight: '1.5' }],                                                           // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],                                                    // 14px

        // Small text
        'caption': ['0.75rem', { lineHeight: '1.5' }],                                                     // 12px
        'overline': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.05em', fontWeight: '600' }],       // 12px uppercase
      },

      // ========================================
      // SPACING & SIZING
      // ========================================
      spacing: {
        // Additional spacing values for precise control
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '100': '25rem',   // 400px
        '112': '28rem',   // 448px
        '128': '32rem',   // 512px
      },

      // ========================================
      // BORDER RADIUS
      // ========================================
      borderRadius: {
        'sm': '0.25rem',    // 4px - small elements
        'md': '0.5rem',     // 8px - inputs, buttons
        'lg': '0.75rem',    // 12px - cards, modals
        'xl': '1rem',       // 16px - main cards (our standard)
        '2xl': '1.5rem',    // 24px - hero sections
        '3xl': '2rem',      // 32px - large features
      },

      // ========================================
      // SHADOWS
      // ========================================
      boxShadow: {
        // Elevation system
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',      // Default card
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',   // Hover cards
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // Modals
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

        // Inner shadow for inputs
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

        // Focus rings
        'focus-primary': '0 0 0 3px rgb(59 130 246 / 0.3)',
        'focus-accent': '0 0 0 3px rgb(20 184 166 / 0.3)',
        'focus-admin': '0 0 0 3px rgb(99 102 241 / 0.3)',
      },

      // ========================================
      // ANIMATIONS & TRANSITIONS
      // ========================================
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      // ========================================
      // COMPONENT-SPECIFIC TOKENS
      // ========================================

      // Max widths for content areas
      maxWidth: {
        'prose': '65ch',      // Reading width
        'content': '80rem',   // 1280px - main content
        'narrow': '42rem',    // 672px - forms, focused content
      },

      // Z-index scale
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
