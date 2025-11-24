// tailwind.config.js
import { heroui } from '@heroui/react';
import { heroUiThemes } from './app/theme/herouiThemes';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/components/(avatar|breadcrumbs|button|date-picker|dropdown|input|listbox|modal|navbar|popover|toggle|table|toast|ripple|spinner|calendar|date-input|form|menu|divider|checkbox|spacer).js',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [heroui({ themes: heroUiThemes })],
};
