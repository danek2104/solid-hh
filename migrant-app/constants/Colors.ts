const primaryRed = '#E63946';
const secondaryRed = '#FFEBEE'; // Light red for backgrounds/tints
const darkText = '#1A1A1A';
const lightText = '#FFFFFF';
const grayText = '#757575';
const backgroundLight = '#F8F9FA';
const borderLight = '#E0E0E0';

export default {
  light: {
    text: darkText,
    textSecondary: grayText,
    background: backgroundLight,
    surface: '#FFFFFF',
    tint: primaryRed,
    primary: primaryRed,
    secondary: secondaryRed,
    border: borderLight,
    error: '#B00020',
    tabIconDefault: '#BDBDBD',
    tabIconSelected: primaryRed,
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    background: '#121212',
    surface: '#1E1E1E',
    tint: primaryRed,
    primary: primaryRed,
    secondary: '#37000B', // Darker red for dark mode
    border: '#333333',
    error: '#CF6679',
    tabIconDefault: '#757575',
    tabIconSelected: primaryRed,
  },
};
