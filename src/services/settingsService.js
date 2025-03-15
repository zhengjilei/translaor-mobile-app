import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'translator_settings';

// Default settings
const defaultSettings = {
  saveHistory: true,
  autoTranslate: false,
  darkMode: false,
  apiKey: '',
  useFreeApi: true,
};

// Get user settings
export const getSettings = async () => {
  try {
    const settingsData = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (settingsData) {
      return { ...defaultSettings, ...JSON.parse(settingsData) };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

// Update user settings
export const updateSettings = async (updatedSettings) => {
  try {
    const currentSettings = await getSettings();
    const mergedSettings = { ...currentSettings, ...updatedSettings };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mergedSettings));
    return mergedSettings;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
};

// Reset all settings to default
export const resetSettings = async () => {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw error;
  }
};

// Set API key
export const setApiKey = async (apiKey) => {
  try {
    const settings = await getSettings();
    const updatedSettings = { ...settings, apiKey };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Failed to set API key:', error);
    throw error;
  }
};