import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings } from './settingsService';

const HISTORY_STORAGE_KEY = 'translator_history';
const MAX_HISTORY_ITEMS = 100;

// Get all translation history
export const getHistory = async () => {
  try {
    // Check if history saving is enabled in settings
    const settings = await getSettings();
    if (!settings.saveHistory) {
      return [];
    }
    
    const historyData = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (historyData) {
      return JSON.parse(historyData);
    }
    return [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};

// Save a translation to history
export const saveToHistory = async (translation) => {
  try {
    // Check if history saving is enabled in settings
    const settings = await getSettings();
    if (!settings.saveHistory) {
      return;
    }
    
    // Get existing history
    const history = await getHistory();
    
    // Add new translation to the beginning of the array
    const updatedHistory = [translation, ...history];
    
    // Limit the number of history items
    if (updatedHistory.length > MAX_HISTORY_ITEMS) {
      updatedHistory.splice(MAX_HISTORY_ITEMS);
    }
    
    // Save updated history
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
};

// Clear all translation history
export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
};

// Delete a specific translation from history
export const deleteHistoryItem = async (timestamp) => {
  try {
    const history = await getHistory();
    const updatedHistory = history.filter(item => item.timestamp !== timestamp);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to delete history item:', error);
  }
};