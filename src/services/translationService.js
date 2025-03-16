import { getSettings } from './settingsService';
import { 
  isOfflineModeEnabled, 
  isLanguageDownloaded, 
  translateTextOffline
} from './offlineService';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';

// Context-aware phrases for better translation
const contextualPhrases = {
  'restaurant': {
    'en-es': {
      'Can I have the menu?': '¿Puedo ver el menú?',
      'Check, please': 'La cuenta, por favor',
      'I would like to make a reservation': 'Me gustaría hacer una reserva',
      'Is this dish spicy?': '¿Este plato es picante?',
      'I have a food allergy': 'Tengo alergia alimentaria'
    },
    'en-fr': {
      'Can I have the menu?': 'Puis-je avoir le menu ?',
      'Check, please': 'L\'addition, s\'il vous plaît',
      'I would like to make a reservation': 'Je voudrais faire une réservation',
      'Is this dish spicy?': 'Ce plat est-il épicé ?',
      'I have a food allergy': 'J\'ai une allergie alimentaire'
    }
  },
  'transportation': {
    'en-es': {
      'Where is the train station?': '¿Dónde está la estación de tren?',
      'How much is a ticket to...?': '¿Cuánto cuesta un billete para...?',
      'When is the next departure?': '¿Cuándo es la próxima salida?',
      'Is this seat taken?': '¿Está ocupado este asiento?',
      'I need to go to this address': 'Necesito ir a esta dirección'
    },
    'en-fr': {
      'Where is the train station?': 'Où est la gare ?',
      'How much is a ticket to...?': 'Combien coûte un billet pour... ?',
      'When is the next departure?': 'Quand est le prochain départ ?',
      'Is this seat taken?': 'Ce siège est-il pris ?',
      'I need to go to this address': 'Je dois aller à cette adresse'
    }
  },
  'hotel': {
    'en-es': {
      'I have a reservation': 'Tengo una reserva',
      'Is breakfast included?': '¿Está incluido el desayuno?',
      'What time is check-out?': '¿A qué hora es el check-out?',
      'Do you have room service?': '¿Tienen servicio de habitación?',
      'The air conditioning is not working': 'El aire acondicionado no funciona'
    },
    'en-fr': {
      'I have a reservation': 'J\'ai une réservation',
      'Is breakfast included?': 'Le petit-déjeuner est-il inclus ?',
      'What time is check-out?': 'À quelle heure est le check-out ?',
      'Do you have room service?': 'Avez-vous un service de chambre ?',
      'The air conditioning is not working': 'La climatisation ne fonctionne pas'
    }
  },
  'emergency': {
    'en-es': {
      'I need a doctor': 'Necesito un médico',
      'Call an ambulance': 'Llame a una ambulancia',
      'This is an emergency': 'Esto es una emergencia',
      'I lost my passport': 'Perdí mi pasaporte',
      'I need help': 'Necesito ayuda'
    },
    'en-fr': {
      'I need a doctor': 'J\'ai besoin d\'un médecin',
      'Call an ambulance': 'Appelez une ambulance',
      'This is an emergency': 'C\'est une urgence',
      'I lost my passport': 'J\'ai perdu mon passeport',
      'I need help': 'J\'ai besoin d\'aide'
    }
  }
};

// Mock translation for demo purposes
// In a real app, this would integrate with an actual translation API
export const translateText = async (text, sourceLang, targetLang, context = null) => {
  try {
    logger.debug(`Translating: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" from ${sourceLang} to ${targetLang}${context ? ` (context: ${context})` : ''}`, 'TranslationService');
    
    // Check network connection first
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
    
    // Get user settings
    const settings = await getSettings();
    
    // Check if offline mode is enabled and preferred
    const offlineMode = await isOfflineModeEnabled();
    
    // If offline mode is enabled or no network connection
    if (offlineMode || !isConnected) {
      logger.info(`Using offline translation mode (network connected: ${isConnected})`, 'TranslationService');
      
      // Check if both languages are downloaded
      const sourceDownloaded = await isLanguageDownloaded(sourceLang);
      const targetDownloaded = await isLanguageDownloaded(targetLang);
      
      if (sourceDownloaded && targetDownloaded) {
        logger.debug('Both language packs are downloaded, using offline translation', 'TranslationService');
        // We have offline packs, use them
        return translateTextOffline(text, sourceLang, targetLang, context);
      } else {
        // Return an appropriate offline message
        const missingLangs = [];
        if (!sourceDownloaded) missingLangs.push(getLanguageName(sourceLang));
        if (!targetDownloaded) missingLangs.push(getLanguageName(targetLang));
        
        logger.warn(`Cannot translate offline - missing language pack(s): ${missingLangs.join(', ')}`, 'TranslationService');
        
        return {
          translatedText: `Unable to translate - missing offline language pack${missingLangs.length > 1 ? 's' : ''} for ${missingLangs.join(' and ')}. Please download the required language packs or connect to the internet.`,
          isOfflineMessage: true
        };
      }
    }
    
    // Online translation - this would call a real API in production
    logger.info(`Using online translation service for ${sourceLang} to ${targetLang}`, 'TranslationService');
    
    // Add a small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for preset/canned translations
    const translationKey = `${sourceLang}-${targetLang}`;
    
    // Get translations for this language pair if they exist
    let translations = {};
    if (context && contextualPhrases[context]) {
      translations = contextualPhrases[context][translationKey] || {};
      logger.debug(`Found contextual translations for ${context}`, 'TranslationService');
    }
    
    // If we have a preset translation, use that
    if (translations[text]) {
      logger.debug('Using preset translation from context phrases', 'TranslationService');
      return translations[text];
    }
    
    // Otherwise generate a simple mock translation
    if (settings.useFreeApi) {
      logger.debug('Using free translation API (mock)', 'TranslationService');
      return `[${targetLang.toUpperCase()} Translation] ${text}`;
    } else {
      // Premium API would provide more accurate translations with context awareness
      logger.debug('Using premium translation API (mock)', 'TranslationService');
      if (context) {
        return `[Premium ${targetLang.toUpperCase()} Translation for ${context}] ${text}`;
      } else {
        return `[Premium ${targetLang.toUpperCase()} Translation] ${text}`;
      }
    }
  } catch (error) {
    logger.error(`Translation error: ${error.message}`, 'TranslationService', error);
    
    // Return a more user-friendly error as an offline message
    return {
      translatedText: `Translation failed: ${error.message || 'Unknown error'}. Please try again later.`,
      isOfflineMessage: true
    };
  }
};

// Detect language from text
export const detectLanguage = async (text) => {
  try {
    // Check network connection
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
    
    if (!isConnected) {
      // Fallback to basic detection when offline
      return basicLanguageDetection(text);
    }
    
    // This would call a language detection API in a real app
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return basicLanguageDetection(text);
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English on failure
  }
};

// Basic language detection helper
const basicLanguageDetection = (text) => {
  // Simple language detection mock
  const languageIndicators = {
    'en': ['the', 'and', 'is', 'are', 'to', 'in', 'it', 'you', 'that', 'was'],
    'es': ['el', 'la', 'los', 'las', 'y', 'es', 'son', 'en', 'que', 'por'],
    'fr': ['le', 'la', 'les', 'et', 'est', 'sont', 'en', 'que', 'qui', 'dans'],
    'de': ['der', 'die', 'das', 'und', 'ist', 'sind', 'in', 'zu', 'für', 'auf'],
    'it': ['il', 'la', 'e', 'che', 'di', 'in', 'un', 'una', 'sono', 'per'],
    'pt': ['o', 'a', 'os', 'as', 'e', 'que', 'em', 'de', 'para', 'com'],
    'ru': ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а'],
  };
  
  // Convert text to lowercase and split into words
  const words = text.toLowerCase().match(/\w+/g) || [];
  
  // Count language indicators
  const counts = {};
  for (const lang in languageIndicators) {
    counts[lang] = words.filter(word => 
      languageIndicators[lang].includes(word)
    ).length;
  }
  
  // Find the language with the most indicators
  let detectedLang = 'en';
  let maxCount = 0;
  
  for (const lang in counts) {
    if (counts[lang] > maxCount) {
      maxCount = counts[lang];
      detectedLang = lang;
    }
  }
  
  return detectedLang;
};

// Get supported languages
export const getSupportedLanguages = async () => {
  // In a real app, this would fetch from an API
  // Now we also include downloadable status
  const offlineMode = await isOfflineModeEnabled();
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
  ];
  
  // Add downloaded status if offline mode is enabled
  if (offlineMode) {
    for (let lang of languages) {
      lang.isDownloaded = await isLanguageDownloaded(lang.code);
    }
  }
  
  return languages;
};

// Get common travel contexts
export const getTranslationContexts = () => {
  return [
    { id: 'restaurant', name: 'Restaurant', icon: 'restaurant' },
    { id: 'transportation', name: 'Transportation', icon: 'bus' },
    { id: 'hotel', name: 'Hotel', icon: 'bed' },
    { id: 'shopping', name: 'Shopping', icon: 'cart' },
    { id: 'emergency', name: 'Emergency', icon: 'medkit' },
    { id: 'sightseeing', name: 'Sightseeing', icon: 'camera' },
  ];
};

// Get common phrases for a specific context
export const getContextPhrases = (contextId, sourceLang = 'en') => {
  const contextMap = {
    'restaurant': [
      'Can I have the menu?',
      'Check, please',
      'I would like to make a reservation',
      'Is this dish spicy?',
      'I have a food allergy'
    ],
    'transportation': [
      'Where is the train station?',
      'How much is a ticket to...?',
      'When is the next departure?',
      'Is this seat taken?',
      'I need to go to this address'
    ],
    'hotel': [
      'I have a reservation',
      'Is breakfast included?',
      'What time is check-out?',
      'Do you have room service?',
      'The air conditioning is not working'
    ],
    'shopping': [
      'How much does this cost?',
      'Do you accept credit cards?',
      'Do you have this in a different size?',
      'Can I get a receipt?',
      'I\'m just looking, thank you'
    ],
    'emergency': [
      'I need a doctor',
      'Call an ambulance',
      'This is an emergency',
      'I lost my passport',
      'I need help'
    ],
    'sightseeing': [
      'Where is the museum?',
      'What time does it open?',
      'How much is the entrance fee?',
      'Can I take photos here?',
      'Is there a guided tour available?'
    ]
  };
  
  return contextMap[contextId] || [];
};

// Define getLanguageName function
const getLanguageName = (code) => {
  const languageMap = {
    en: 'English',
    es: 'Spanish',
    // Add other language codes and names as needed
  };
  return languageMap[code] || 'Unknown';
};