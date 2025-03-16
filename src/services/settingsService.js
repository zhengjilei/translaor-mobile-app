import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'translator_settings';
const LANGUAGE_PREFERENCES_KEY = 'translator_language_preferences';
const API_KEY_STORAGE_KEY = 'translator_api_key_secure'; // Separate key for API storage

// Default settings
const defaultSettings = {
  saveHistory: true,
  autoTranslate: false,
  darkMode: false,
  useFreeApi: true,
};

// Default language preferences
const defaultLanguagePreferences = {
  sourceLanguage: 'en',
  targetLanguage: 'es',
  sourceLanguageName: 'English', 
  targetLanguageName: 'Spanish'
};

// Utility to securely encode sensitive data
// In a real app, you would use a proper encryption library or secure storage
const encodeSecureData = (data) => {
  // Simple encoding for demonstration - NOT secure for production
  return Buffer.from(data).toString('base64');
};

// Utility to decode secure data
const decodeSecureData = (encodedData) => {
  if (!encodedData) return '';
  // Simple decoding for demonstration
  return Buffer.from(encodedData, 'base64').toString();
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
    // Remove API key from main settings if it's included
    const { apiKey, ...otherSettings } = updatedSettings;
    
    const currentSettings = await getSettings();
    const mergedSettings = { ...currentSettings, ...otherSettings };
    
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mergedSettings));
    
    // Handle API key separately if provided
    if (apiKey !== undefined) {
      await setApiKey(apiKey);
    }
    
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
    // Clear API key as well
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
    return defaultSettings;
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw error;
  }
};

// Get API key
export const getApiKey = async () => {
  try {
    const encodedApiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
    return decodeSecureData(encodedApiKey);
  } catch (error) {
    console.error('Failed to get API key:', error);
    return '';
  }
};

// Set API key
export const setApiKey = async (apiKey) => {
  try {
    if (!apiKey) {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
      return true;
    }
    
    const encodedApiKey = encodeSecureData(apiKey);
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, encodedApiKey);
    return true;
  } catch (error) {
    console.error('Failed to set API key:', error);
    throw error;
  }
};

// Get language preferences
export const getLanguagePreferences = async () => {
  try {
    const prefsData = await AsyncStorage.getItem(LANGUAGE_PREFERENCES_KEY);
    if (prefsData) {
      return { ...defaultLanguagePreferences, ...JSON.parse(prefsData) };
    }
    return defaultLanguagePreferences;
  } catch (error) {
    console.error('Failed to load language preferences:', error);
    return defaultLanguagePreferences;
  }
};

// Update language preferences
export const updateLanguagePreferences = async (preferences) => {
  try {
    const currentPrefs = await getLanguagePreferences();
    const mergedPrefs = { ...currentPrefs, ...preferences };
    await AsyncStorage.setItem(LANGUAGE_PREFERENCES_KEY, JSON.stringify(mergedPrefs));
    return mergedPrefs;
  } catch (error) {
    console.error('Failed to update language preferences:', error);
    throw error;
  }
};

// Check if this is the first app launch
export const isFirstLaunch = async () => {
  try {
    const hasLaunched = await AsyncStorage.getItem('APP_HAS_LAUNCHED');
    if (hasLaunched !== 'true') {
      // Set the flag to indicate the app has launched before
      await AsyncStorage.setItem('APP_HAS_LAUNCHED', 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking first launch:', error);
    return false;
  }
};