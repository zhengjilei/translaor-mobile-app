import { getSettings } from './settingsService';
import { 
  isOfflineModeEnabled, 
  isLanguageDownloaded, 
  translateTextOffline
} from './offlineService';
import NetInfo from '@react-native-community/netinfo';

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
    // Check network connection
    const netInfo = await NetInfo.fetch();
    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
    
    // Check if offline mode is enabled
    const offlineMode = await isOfflineModeEnabled();
    
    // Try offline translation if offline mode is enabled or no internet connection
    if (offlineMode || !isConnected) {
      const sourceDownloaded = await isLanguageDownloaded(sourceLang);
      const targetDownloaded = await isLanguageDownloaded(targetLang);
      
      if (sourceDownloaded && targetDownloaded) {
        return await translateTextOffline(text, sourceLang, targetLang);
      } else if (!isConnected) {
        throw new Error('No internet connection and required language packs not downloaded');
      }
      // If we're here, we have internet but prefer offline mode - language packs are not available
      // Fall through to online translation
    }
    
    // Delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get user settings to determine which API to use
    const settings = await getSettings();
    
    // Check for context-specific translations first
    if (context && contextualPhrases[context]) {
      const contextKey = `${sourceLang}-${targetLang}`;
      if (contextualPhrases[context][contextKey] && 
          contextualPhrases[context][contextKey][text]) {
        return contextualPhrases[context][contextKey][text];
      }
    }
    
    // Simple mock translation to demonstrate functionality
    // This would be replaced with a real API call in a production app
    const translations = {
      'en-es': {
        'Hello': 'Hola',
        'How are you?': '¿Cómo estás?',
        'Thank you': 'Gracias',
        'What is your name?': '¿Cómo te llamas?',
        'Good morning': 'Buenos días',
        'Good afternoon': 'Buenas tardes',
        'Good evening': 'Buenas noches',
        'Goodbye': 'Adiós',
        'Please': 'Por favor',
        'Sorry': 'Lo siento',
        'Yes': 'Sí',
        'No': 'No',
      },
      'es-en': {
        'Hola': 'Hello',
        '¿Cómo estás?': 'How are you?',
        'Gracias': 'Thank you',
        '¿Cómo te llamas?': 'What is your name?',
        'Buenos días': 'Good morning',
        'Buenas tardes': 'Good afternoon',
        'Buenas noches': 'Good evening',
        'Adiós': 'Goodbye',
        'Por favor': 'Please',
        'Lo siento': 'Sorry',
        'Sí': 'Yes',
        'No': 'No',
      },
      'en-fr': {
        'Hello': 'Bonjour',
        'How are you?': 'Comment allez-vous ?',
        'Thank you': 'Merci',
        'What is your name?': 'Comment vous appelez-vous ?',
        'Good morning': 'Bonjour',
        'Good afternoon': 'Bon après-midi',
        'Good evening': 'Bonsoir',
        'Goodbye': 'Au revoir',
        'Please': 'S\'il vous plaît',
        'Sorry': 'Désolé',
        'Yes': 'Oui',
        'No': 'Non',
      },
      'fr-en': {
        'Bonjour': 'Hello',
        'Comment allez-vous ?': 'How are you?',
        'Merci': 'Thank you',
        'Comment vous appelez-vous ?': 'What is your name?',
        'Bon après-midi': 'Good afternoon',
        'Bonsoir': 'Good evening',
        'Au revoir': 'Goodbye',
        'S\'il vous plaît': 'Please',
        'Désolé': 'Sorry',
        'Oui': 'Yes',
        'Non': 'No',
      },
    };
    
    const translationKey = `${sourceLang}-${targetLang}`;
    
    // If we have a preset translation, use that
    if (translations[translationKey] && translations[translationKey][text]) {
      return translations[translationKey][text];
    }
    
    // Otherwise generate a simple mock translation
    if (settings.useFreeApi) {
      return `[${targetLang.toUpperCase()} Translation] ${text}`;
    } else {
      // Premium API would provide more accurate translations with context awareness
      if (context) {
        return `[Premium ${targetLang.toUpperCase()} Translation for ${context}] ${text}`;
      } else {
        return `[Premium ${targetLang.toUpperCase()} Translation] ${text}`;
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
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