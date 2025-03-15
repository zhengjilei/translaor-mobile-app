import { getSettings } from '../services/settingsService';

// Light theme colors
const lightTheme = {
  background: '#f5f5f5',
  card: 'white',
  text: '#333',
  border: '#ddd',
  accent: '#4a6ea9',
  accentLight: '#5e8ad4',
  secondaryText: '#666',
  tertiaryText: '#999',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
};

// Dark theme colors
const darkTheme = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#f5f5f5',
  border: '#333',
  accent: '#6889c4',
  accentLight: '#7da2e0',
  secondaryText: '#aaa',
  tertiaryText: '#777',
  success: '#81C784',
  error: '#E57373',
  warning: '#FFB74D',
};

// Get the current theme based on user settings
export const getTheme = async () => {
  const settings = await getSettings();
  
  return settings.darkMode ? darkTheme : lightTheme;
};

// Create a static theme object for places where async is not suitable
export const defaultTheme = lightTheme;

// Apply theme to a style object
export const applyTheme = (style, theme) => {
  const themedStyle = { ...style };
  
  // Replace color values with theme values
  Object.keys(themedStyle).forEach(key => {
    if (key.toLowerCase().includes('color')) {
      // Replace hardcoded colors with theme values
      // This is a simplistic example - would need more complex mapping in a real app
      if (themedStyle[key] === '#333') {
        themedStyle[key] = theme.text;
      } else if (themedStyle[key] === '#f5f5f5') {
        themedStyle[key] = theme.background;
      } else if (themedStyle[key] === 'white') {
        themedStyle[key] = theme.card;
      } else if (themedStyle[key] === '#ddd') {
        themedStyle[key] = theme.border;
      } else if (themedStyle[key] === '#4a6ea9') {
        themedStyle[key] = theme.accent;
      } else if (themedStyle[key] === '#666') {
        themedStyle[key] = theme.secondaryText;
      }
    }
  });
  
  return themedStyle;
};