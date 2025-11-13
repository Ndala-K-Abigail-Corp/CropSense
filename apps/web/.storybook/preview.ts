import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';
import '../src/styles/tokens.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#FFFFFF',
        },
        {
          name: 'surface',
          value: '#F9FAFB',
        },
        {
          name: 'dark',
          value: '#1B1B1B',
        },
      ],
    },
    // Configure a11y addon
    a11y: {
      config: {
        rules: [
          {
            // Ensure color contrast meets WCAG AA standards
            id: 'color-contrast',
            enabled: true,
          },
          {
            // Ensure all interactive elements are keyboard accessible
            id: 'keyboard-nav',
            enabled: true,
          },
        ],
      },
    },
  },
};

export default preview;


