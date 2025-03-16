import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getSettings } from './settingsService';

// Constants for AsyncStorage keys
const OFFLINE_MODE_KEY = 'translator_offline_mode';
const DOWNLOADED_LANGUAGES_KEY = 'translator_downloaded_languages';

// Language pack size in MB for different qualities
const LANGUAGE_PACK_SIZES = {
  'basic': {
    size: 5,
    features: ['text-only', 'common-phrases']
  },
  'standard': {
    size: 15,
    features: ['text', 'speech-recognition', 'basic-ocr']
  },
  'premium': {
    size: 30,
    features: ['text', 'speech-recognition', 'advanced-ocr', 'context-aware']
  }
};

// Check if offline mode is enabled
export const isOfflineModeEnabled = async () => {
  try {
    const offlineMode = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
    return offlineMode === 'true';
  } catch (error) {
    console.error('Failed to check offline mode:', error);
    return false;
  }
};

// Enable or disable offline mode
export const setOfflineMode = async (enabled) => {
  try {
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error('Failed to set offline mode:', error);
    return false;
  }
};

// Get list of downloaded language packs
export const getDownloadedLanguages = async () => {
  try {
    const languages = await AsyncStorage.getItem(DOWNLOADED_LANGUAGES_KEY);
    return languages ? JSON.parse(languages) : [];
  } catch (error) {
    console.error('Failed to get downloaded languages:', error);
    return [];
  }
};

// Check if a specific language is downloaded
export const isLanguageDownloaded = async (languageCode) => {
  try {
    const languages = await getDownloadedLanguages();
    return languages.some(lang => lang.code === languageCode);
  } catch (error) {
    console.error('Failed to check if language is downloaded:', error);
    return false;
  }
};

// Download a language pack
export const downloadLanguagePack = async (languageCode, languageName, quality = 'standard') => {
  try {
    // Check available device storage
    const { freeSizeInBytes } = await FileSystem.getFreeDiskStorageAsync();
    const freeSizeInMB = freeSizeInBytes / (1024 * 1024);
    
    // Calculate required size based on quality
    const requiredSize = LANGUAGE_PACK_SIZES[quality].size;
    
    if (freeSizeInMB < requiredSize) {
      throw new Error(`Not enough storage space. Requires ${requiredSize}MB but only ${Math.floor(freeSizeInMB)}MB available.`);
    }
    
    // Create directory if it doesn't exist
    const dirPath = `${FileSystem.documentDirectory}languages/`;
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    
    // In a real app, we would download the actual language model here
    // For this demo, we'll simulate a download with a timeout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock data file creation
    const filePath = `${dirPath}${languageCode}.json`;
    const mockData = {
      code: languageCode,
      name: languageName,
      quality: quality,
      features: LANGUAGE_PACK_SIZES[quality].features,
      phrases: generateMockPhrases(languageCode),
      downloaded: new Date().toISOString()
    };
    
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(mockData));
    
    // Update downloaded languages list
    const currentLanguages = await getDownloadedLanguages();
    const updatedLanguages = [
      ...currentLanguages.filter(lang => lang.code !== languageCode),
      {
        code: languageCode,
        name: languageName,
        quality: quality,
        features: LANGUAGE_PACK_SIZES[quality].features,
        size: requiredSize,
        downloaded: new Date().toISOString()
      }
    ];
    
    await AsyncStorage.setItem(DOWNLOADED_LANGUAGES_KEY, JSON.stringify(updatedLanguages));
    return true;
  } catch (error) {
    console.error('Failed to download language pack:', error);
    throw error;
  }
};

// Delete a language pack
export const deleteLanguagePack = async (languageCode) => {
  try {
    const filePath = `${FileSystem.documentDirectory}languages/${languageCode}.json`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
    
    // Update downloaded languages list
    const currentLanguages = await getDownloadedLanguages();
    const updatedLanguages = currentLanguages.filter(lang => lang.code !== languageCode);
    await AsyncStorage.setItem(DOWNLOADED_LANGUAGES_KEY, JSON.stringify(updatedLanguages));
    
    return true;
  } catch (error) {
    console.error('Failed to delete language pack:', error);
    throw error;
  }
};

// Calculate total size of all downloaded language packs
export const getTotalStorageUsed = async () => {
  try {
    const languages = await getDownloadedLanguages();
    return languages.reduce((total, lang) => total + lang.size, 0);
  } catch (error) {
    console.error('Failed to calculate total storage used:', error);
    return 0;
  }
};

// Perform offline translation
export const translateTextOffline = async (text, sourceLanguage, targetLanguage) => {
  try {
    // Check if we have both language packs
    const isSourceDownloaded = await isLanguageDownloaded(sourceLanguage);
    const isTargetDownloaded = await isLanguageDownloaded(targetLanguage);
    
    if (!isSourceDownloaded || !isTargetDownloaded) {
      return {
        translatedText: "Translation unavailable. Language packs not completely downloaded.",
        sourceLanguage,
        targetLanguage,
        isOfflineMessage: true
      };
    }
    
    // Load language data
    const sourceLangPath = `${FileSystem.documentDirectory}languages/${sourceLanguage}.json`;
    const targetLangPath = `${FileSystem.documentDirectory}languages/${targetLanguage}.json`;
    
    try {
      const sourceData = JSON.parse(await FileSystem.readAsStringAsync(sourceLangPath));
      const targetData = JSON.parse(await FileSystem.readAsStringAsync(targetLangPath));
      
      // For demo purposes, we'll do a very simple phrase-based translation
      // In a real app, this would use ML models stored on the device
      
      // Check if we have an exact phrase match
      const textLower = text.toLowerCase().trim();
      
      for (const phrase of sourceData.phrases) {
        if (phrase.text.toLowerCase() === textLower) {
          // Find matching phrase in target language
          const targetPhrase = targetData.phrases.find(p => p.id === phrase.id);
          if (targetPhrase) {
            return targetPhrase.text;
          }
        }
      }
      
      // If no exact match, return a fake "offline translation"
      return `[Offline ${targetLanguage.toUpperCase()} Translation] ${text}`;
    } catch (fileError) {
      console.error('Error reading language files:', fileError);
      return {
        translatedText: "Error accessing offline translation data. Try reinstalling language packs.",
        sourceLanguage,
        targetLanguage,
        isOfflineMessage: true
      };
    }
  } catch (error) {
    console.error('Offline translation failed:', error);
    return {
      translatedText: "Offline translation failed. Please try again.",
      sourceLanguage,
      targetLanguage,
      isOfflineMessage: true
    };
  }
};

// Helper function to generate mock phrases for language packs
const generateMockPhrases = (languageCode) => {
  const commonPhraseIds = ['greeting', 'thanks', 'goodbye', 'help', 'yes', 'no'];
  
  const phrases = {
    'en': [
      { id: 'greeting', text: 'Hello' },
      { id: 'thanks', text: 'Thank you' },
      { id: 'goodbye', text: 'Goodbye' },
      { id: 'help', text: 'I need help' },
      { id: 'yes', text: 'Yes' },
      { id: 'no', text: 'No' }
    ],
    'es': [
      { id: 'greeting', text: 'Hola' },
      { id: 'thanks', text: 'Gracias' },
      { id: 'goodbye', text: 'Adiós' },
      { id: 'help', text: 'Necesito ayuda' },
      { id: 'yes', text: 'Sí' },
      { id: 'no', text: 'No' }
    ],
    'fr': [
      { id: 'greeting', text: 'Bonjour' },
      { id: 'thanks', text: 'Merci' },
      { id: 'goodbye', text: 'Au revoir' },
      { id: 'help', text: "J'ai besoin d'aide" },
      { id: 'yes', text: 'Oui' },
      { id: 'no', text: 'Non' }
    ],
    'de': [
      { id: 'greeting', text: 'Hallo' },
      { id: 'thanks', text: 'Danke' },
      { id: 'goodbye', text: 'Auf Wiedersehen' },
      { id: 'help', text: 'Ich brauche Hilfe' },
      { id: 'yes', text: 'Ja' },
      { id: 'no', text: 'Nein' }
    ],
    'it': [
      { id: 'greeting', text: 'Ciao' },
      { id: 'thanks', text: 'Grazie' },
      { id: 'goodbye', text: 'Arrivederci' },
      { id: 'help', text: 'Ho bisogno di aiuto' },
      { id: 'yes', text: 'Sì' },
      { id: 'no', text: 'No' }
    ],
    'ja': [
      { id: 'greeting', text: 'こんにちは' },
      { id: 'thanks', text: 'ありがとう' },
      { id: 'goodbye', text: 'さようなら' },
      { id: 'help', text: '助けが必要です' },
      { id: 'yes', text: 'はい' },
      { id: 'no', text: 'いいえ' }
    ],
    'zh': [
      { id: 'greeting', text: '你好' },
      { id: 'thanks', text: '谢谢' },
      { id: 'goodbye', text: '再见' },
      { id: 'help', text: '我需要帮助' },
      { id: 'yes', text: '是' },
      { id: 'no', text: '否' }
    ]
  };
  
  // Return phrases for requested language, or English as fallback
  return phrases[languageCode] || phrases['en'];
};