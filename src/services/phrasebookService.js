import AsyncStorage from '@react-native-async-storage/async-storage';

const PHRASEBOOK_STORAGE_KEY = 'translator_phrasebook';

// Get all saved phrases
export const getPhrasebook = async () => {
  try {
    const phrasebookData = await AsyncStorage.getItem(PHRASEBOOK_STORAGE_KEY);
    if (phrasebookData) {
      return JSON.parse(phrasebookData);
    }
    return [];
  } catch (error) {
    console.error('Failed to load phrasebook:', error);
    return [];
  }
};

// Save a phrase to phrasebook
export const saveToPhrasebook = async (phrase) => {
  try {
    // Get existing phrasebook
    const phrasebook = await getPhrasebook();
    
    // Check if this phrase already exists
    const existingIndex = phrasebook.findIndex(
      p => p.sourceText === phrase.sourceText && 
           p.sourceLanguage === phrase.sourceLanguage &&
           p.targetLanguage === phrase.targetLanguage
    );
    
    if (existingIndex !== -1) {
      // Update existing phrase
      phrasebook[existingIndex] = {
        ...phrasebook[existingIndex],
        ...phrase,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new phrase
      phrasebook.push({
        ...phrase,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Save updated phrasebook
    await AsyncStorage.setItem(PHRASEBOOK_STORAGE_KEY, JSON.stringify(phrasebook));
    return true;
  } catch (error) {
    console.error('Failed to save to phrasebook:', error);
    return false;
  }
};

// Delete a phrase from phrasebook
export const deletePhraseFromPhrasebook = async (phraseId) => {
  try {
    // Get existing phrasebook
    const phrasebook = await getPhrasebook();
    
    // Filter out the phrase to delete
    const updatedPhrasebook = phrasebook.filter(phrase => phrase.id !== phraseId);
    
    // Save updated phrasebook
    await AsyncStorage.setItem(PHRASEBOOK_STORAGE_KEY, JSON.stringify(updatedPhrasebook));
    return true;
  } catch (error) {
    console.error('Failed to delete phrase from phrasebook:', error);
    return false;
  }
};

// Update a phrase in phrasebook
export const updatePhraseInPhrasebook = async (phraseId, updates) => {
  try {
    // Get existing phrasebook
    const phrasebook = await getPhrasebook();
    
    // Find the phrase to update
    const phraseIndex = phrasebook.findIndex(phrase => phrase.id === phraseId);
    
    if (phraseIndex === -1) {
      throw new Error('Phrase not found in phrasebook');
    }
    
    // Update the phrase
    phrasebook[phraseIndex] = {
      ...phrasebook[phraseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Save updated phrasebook
    await AsyncStorage.setItem(PHRASEBOOK_STORAGE_KEY, JSON.stringify(phrasebook));
    return true;
  } catch (error) {
    console.error('Failed to update phrase in phrasebook:', error);
    return false;
  }
};

// Create or update a phrasebook category
export const createOrUpdateCategory = async (category) => {
  try {
    // Get existing phrasebook
    const phrasebook = await getPhrasebook();
    
    // Find if we have any categories
    if (!phrasebook.categories) {
      phrasebook.categories = [];
    }
    
    // Check if this category already exists
    const existingIndex = phrasebook.categories.findIndex(
      c => c.id === category.id
    );
    
    if (existingIndex !== -1) {
      // Update existing category
      phrasebook.categories[existingIndex] = {
        ...phrasebook.categories[existingIndex],
        ...category,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new category
      phrasebook.categories.push({
        ...category,
        id: category.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Save updated phrasebook
    await AsyncStorage.setItem(PHRASEBOOK_STORAGE_KEY, JSON.stringify(phrasebook));
    return true;
  } catch (error) {
    console.error('Failed to create/update category:', error);
    return false;
  }
};

// Get default categories for phrasebook
export const getDefaultCategories = () => {
  return [
    { id: 'favorites', name: 'Favorites', icon: 'star' },
    { id: 'restaurant', name: 'Restaurant', icon: 'restaurant' },
    { id: 'transportation', name: 'Transportation', icon: 'bus' },
    { id: 'hotel', name: 'Hotel', icon: 'bed' },
    { id: 'shopping', name: 'Shopping', icon: 'cart' },
    { id: 'emergency', name: 'Emergency', icon: 'medkit' },
    { id: 'sightseeing', name: 'Sightseeing', icon: 'camera' }
  ];
};

// Get phrases by category
export const getPhrasesByCategory = async (categoryId) => {
  try {
    const phrasebook = await getPhrasebook();
    return phrasebook.filter(phrase => phrase.categoryId === categoryId);
  } catch (error) {
    console.error('Failed to get phrases by category:', error);
    return [];
  }
};

// Search phrases in phrasebook
export const searchPhrasebook = async (query) => {
  try {
    const phrasebook = await getPhrasebook();
    
    if (!query) {
      return phrasebook;
    }
    
    const lowerQuery = query.toLowerCase();
    
    return phrasebook.filter(phrase => 
      phrase.sourceText.toLowerCase().includes(lowerQuery) ||
      phrase.translatedText.toLowerCase().includes(lowerQuery) ||
      (phrase.notes && phrase.notes.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Failed to search phrasebook:', error);
    return [];
  }
};

// Get all categories
export const getCategories = async () => {
  try {
    // For now, just return the default categories
    // In a full implementation, you might merge these with user-created categories
    return getDefaultCategories();
  } catch (error) {
    console.error('Failed to get categories:', error);
    return [];
  }
};

// Get current language pair
export const getCurrentLanguagePair = async () => {
  try {
    // Try to get stored language pair from AsyncStorage
    const savedPair = await AsyncStorage.getItem('translator_language_pair');
    if (savedPair) {
      return JSON.parse(savedPair);
    }
    // Return default pair if none is stored
    return { sourceLang: 'en', targetLang: 'es' };
  } catch (error) {
    console.error('Failed to get current language pair:', error);
    // Return default pair on error
    return { sourceLang: 'en', targetLang: 'es' };
  }
};

// Switch language pair
export const switchLanguagePair = async (sourceLang, targetLang) => {
  try {
    const pair = { sourceLang, targetLang };
    await AsyncStorage.setItem('translator_language_pair', JSON.stringify(pair));
    return true;
  } catch (error) {
    console.error('Failed to switch language pair:', error);
    return false;
  }
};