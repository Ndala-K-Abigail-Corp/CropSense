/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary colors from design tokens
        primary: {
          50: 'var(--cs-color-primary-50)',
          100: 'var(--cs-color-primary-100)',
          200: 'var(--cs-color-primary-200)',
          300: 'var(--cs-color-primary-300)',
          400: 'var(--cs-color-primary-400)',
          500: 'var(--cs-color-primary-500)',
          600: 'var(--cs-color-primary-600)',
          700: 'var(--cs-color-primary-700)',
          DEFAULT: 'var(--cs-primary)',
        },
        secondary: {
          100: 'var(--cs-color-secondary-100)',
          300: 'var(--cs-color-secondary-300)',
          500: 'var(--cs-color-secondary-500)',
          DEFAULT: 'var(--cs-color-secondary-500)',
        },
        neutral: {
          50: 'var(--cs-color-neutral-50)',
          100: 'var(--cs-color-neutral-100)',
          200: 'var(--cs-color-neutral-200)',
          300: 'var(--cs-color-neutral-300)',
          400: 'var(--cs-color-neutral-400)',
          500: 'var(--cs-color-neutral-500)',
          700: 'var(--cs-color-neutral-700)',
        },
        text: {
          primary: 'var(--cs-text)',
          secondary: 'var(--cs-color-text-secondary)',
        },
        surface: 'var(--cs-surface)',
        muted: 'var(--cs-color-muted)',
        success: 'var(--cs-color-success)',
        warning: 'var(--cs-color-warning)',
        error: 'var(--cs-color-error)',
        accent: 'var(--cs-accent)',
        background: 'var(--cs-background)',
      },
      fontFamily: {
        sans: ['var(--cs-font-family-base)', 'Inter', 'Poppins', 'sans-serif'],
      },
      fontSize: {
        display: ['var(--cs-font-size-display)', { lineHeight: 'var(--cs-line-height-display)' }],
        h1: ['var(--cs-font-size-h1)', { lineHeight: 'var(--cs-line-height-h1)' }],
        h2: ['var(--cs-font-size-h2)', { lineHeight: 'var(--cs-line-height-h2)' }],
        h3: ['var(--cs-font-size-h3)', { lineHeight: 'var(--cs-line-height-h3)' }],
        body: ['var(--cs-font-size-body)', { lineHeight: 'var(--cs-line-height-body)' }],
        small: 'var(--cs-font-size-small)',
        caption: 'var(--cs-font-size-caption)',
      },
      spacing: {
        xxs: 'var(--cs-spacing-xxs)',
        xs: 'var(--cs-spacing-xs)',
        sm: 'var(--cs-spacing-sm)',
        md: 'var(--cs-spacing-md)',
        lg: 'var(--cs-spacing-lg)',
        xl: 'var(--cs-spacing-xl)',
        '2xl': 'var(--cs-spacing-2xl)',
        '3xl': 'var(--cs-spacing-3xl)',
      },
      borderRadius: {
        sm: 'var(--cs-radius-sm)',
        md: 'var(--cs-radius-md)',
        lg: 'var(--cs-radius-lg)',
        pill: 'var(--cs-radius-pill)',
      },
      boxShadow: {
        sm: 'var(--cs-shadow-sm)',
        md: 'var(--cs-shadow-md)',
        lg: 'var(--cs-shadow-lg)',
      },
      transitionDuration: {
        fast: 'var(--cs-motion-duration-fast)',
        medium: 'var(--cs-motion-duration-medium)',
        slow: 'var(--cs-motion-duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--cs-motion-easing-standard)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--cs-motion-duration-medium) var(--cs-motion-easing-standard)',
        'slide-up': 'slide-up var(--cs-motion-duration-medium) var(--cs-motion-easing-standard)',
      },
    },
  },
  plugins: [],
};

