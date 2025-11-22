// tailwind.config.js
import { heroui } from '@heroui/react';
import { heroUiThemes } from './app/theme/herouiThemes';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/components/(breadcrumbs|button|dropdown|input|listbox|navbar|popover|toggle|table|toast|ripple|spinner|menu|divider|form|checkbox|spacer).js',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [heroui({ themes: heroUiThemes })],
};
