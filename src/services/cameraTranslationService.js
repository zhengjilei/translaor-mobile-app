import { translateText, detectLanguage } from './translationService';
import { saveToHistory } from './historyService';
import { isOfflineModeEnabled, isLanguageDownloaded } from './offlineService';

// Mock OCR (Optical Character Recognition) function
export const recognizeTextFromImage = async (imageUri, options = {}) => {
  try {
    // In a real app, this would call a vision API or use on-device ML
    // For this demo, we'll return mock results based on options provided
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if offline mode is enabled
    const offlineMode = await isOfflineModeEnabled();
    
    // Check if required language is downloaded for offline OCR
    if (offlineMode && options.languageHint) {
      const isLanguageAvailable = await isLanguageDownloaded(options.languageHint);
      if (!isLanguageAvailable) {
        throw new Error(`Language pack for ${options.languageHint} is not downloaded for offline use`);
      }
    }
    
    // Mock results based on "type" of image (passed through options for demo)
    let recognizedText = "";
    
    switch (options.mockType) {
      case 'menu':
        recognizedText = getMockMenuText(options.languageHint || 'en');
        break;
      case 'sign':
        recognizedText = getMockSignText(options.languageHint || 'en');
        break;
      case 'document':
        recognizedText = getMockDocumentText(options.languageHint || 'en');
        break;
      default:
        // Default mock text
        recognizedText = "Sample text recognized from image. This is a demonstration of how the OCR feature would work in the app.";
        break;
    }
    
    return {
      text: recognizedText,
      languageDetected: options.languageHint || 'en',
      boundingBoxes: generateMockBoundingBoxes(recognizedText)
    };
  } catch (error) {
    console.error('OCR error:', error);
    throw error;
  }
};

// Translate text recognized from image
export const translateImageText = async (
  recognizedText, 
  sourceLanguage, 
  targetLanguage, 
  options = {}
) => {
  try {
    // Detect language if not provided
    let detectedSourceLanguage = sourceLanguage;
    if (!sourceLanguage || sourceLanguage === 'auto') {
      detectedSourceLanguage = await detectLanguage(recognizedText);
    }
    
    // Translate the text
    const translatedText = await translateText(
      recognizedText, 
      detectedSourceLanguage, 
      targetLanguage,
      options.context
    );
    
    // Save to history if requested
    if (options.saveToHistory !== false) {
      await saveToHistory({
        sourceText: recognizedText,
        translatedText: translatedText,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage: targetLanguage,
        contextType: 'camera',
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      originalText: recognizedText,
      translatedText: translatedText,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage: targetLanguage
    };
  } catch (error) {
    console.error('Image translation error:', error);
    throw error;
  }
};

// Process image with overlay translation
export const processImageWithOverlay = async (
  imageUri, 
  sourceLanguage, 
  targetLanguage, 
  options = {}
) => {
  try {
    // 1. Recognize text in the image
    const recognitionResult = await recognizeTextFromImage(imageUri, {
      languageHint: sourceLanguage,
      ...options
    });
    
    // 2. Translate the recognized text
    const translationResult = await translateImageText(
      recognitionResult.text,
      recognitionResult.languageDetected,
      targetLanguage,
      { saveToHistory: options.saveToHistory, context: options.context }
    );
    
    // 3. Return combined results
    return {
      originalImage: imageUri,
      recognizedText: recognitionResult.text,
      translatedText: translationResult.translatedText,
      boundingBoxes: recognitionResult.boundingBoxes,
      sourceLanguage: translationResult.sourceLanguage,
      targetLanguage: translationResult.targetLanguage
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

// Helper functions for mock OCR text

function getMockMenuText(language) {
  const menuTexts = {
    'en': `DAILY SPECIALS
    Soup of the Day: Tomato Basil $5.99
    Chef's Special: Grilled Salmon with Asparagus $18.95
    
    APPETIZERS
    Garlic Bread $4.50
    Calamari $9.95
    Bruschetta $7.50
    
    MAIN COURSES
    Spaghetti Bolognese $14.95
    Chicken Parmesan $16.95
    Vegetable Stir Fry $13.50
    
    DESSERTS
    Tiramisu $6.95
    Chocolate Cake $5.95
    Ice Cream (Vanilla, Chocolate, Strawberry) $4.50`,
    
    'es': `ESPECIALES DEL DÍA
    Sopa del día: Tomate y albahaca $5.99
    Especial del chef: Salmón a la parrilla con espárragos $18.95
    
    ENTRANTES
    Pan de ajo $4.50
    Calamares $9.95
    Bruschetta $7.50
    
    PLATOS PRINCIPALES
    Espaguetis a la boloñesa $14.95
    Pollo parmesano $16.95
    Salteado de verduras $13.50
    
    POSTRES
    Tiramisú $6.95
    Pastel de chocolate $5.95
    Helado (Vainilla, Chocolate, Fresa) $4.50`,
    
    'fr': `SPÉCIALITÉS DU JOUR
    Soupe du jour: Tomate Basilic 5,99 €
    Spécialité du chef: Saumon grillé aux asperges 18,95 €
    
    ENTRÉES
    Pain à l'ail 4,50 €
    Calamars 9,95 €
    Bruschetta 7,50 €
    
    PLATS PRINCIPAUX
    Spaghetti Bolognaise 14,95 €
    Poulet Parmesan 16,95 €
    Légumes sautés 13,50 €
    
    DESSERTS
    Tiramisu 6,95 €
    Gâteau au chocolat 5,95 €
    Glace (Vanille, Chocolat, Fraise) 4,50 €`
  };
  
  return menuTexts[language] || menuTexts['en'];
}

function getMockSignText(language) {
  const signTexts = {
    'en': `CAUTION
    WET FLOOR
    
    Please use other entrance
    
    OPEN HOURS:
    Monday-Friday: 9:00 AM - 8:00 PM
    Saturday: 10:00 AM - 6:00 PM
    Sunday: Closed`,
    
    'es': `PRECAUCIÓN
    SUELO MOJADO
    
    Por favor use otra entrada
    
    HORARIO DE APERTURA:
    Lunes-Viernes: 9:00 - 20:00
    Sábado: 10:00 - 18:00
    Domingo: Cerrado`,
    
    'fr': `ATTENTION
    SOL MOUILLÉ
    
    Veuillez utiliser une autre entrée
    
    HEURES D'OUVERTURE:
    Lundi-Vendredi: 9h00 - 20h00
    Samedi: 10h00 - 18h00
    Dimanche: Fermé`
  };
  
  return signTexts[language] || signTexts['en'];
}

function getMockDocumentText(language) {
  const documentTexts = {
    'en': `RENTAL AGREEMENT
    
    This agreement is made on [DATE] between:
    
    LANDLORD: [Name]
    TENANT: [Name]
    
    PROPERTY: [Address]
    
    TERM: 12 months beginning [Date] and ending [Date]
    
    RENT: $1,500 per month
    
    SECURITY DEPOSIT: $1,500`,
    
    'es': `CONTRATO DE ALQUILER
    
    Este contrato se realiza el [FECHA] entre:
    
    ARRENDADOR: [Nombre]
    INQUILINO: [Nombre]
    
    PROPIEDAD: [Dirección]
    
    DURACIÓN: 12 meses desde [Fecha] hasta [Fecha]
    
    ALQUILER: $1,500 por mes
    
    DEPÓSITO DE SEGURIDAD: $1,500`,
    
    'fr': `CONTRAT DE LOCATION
    
    Ce contrat est conclu le [DATE] entre:
    
    PROPRIÉTAIRE: [Nom]
    LOCATAIRE: [Nom]
    
    PROPRIÉTÉ: [Adresse]
    
    DURÉE: 12 mois commençant le [Date] et se terminant le [Date]
    
    LOYER: 1 500 € par mois
    
    CAUTION: 1 500 €`
  };
  
  return documentTexts[language] || documentTexts['en'];
}

// Generate mock bounding boxes for overlay translation
function generateMockBoundingBoxes(text) {
  // Split text into lines
  const lines = text.split('\n');
  
  // Create mock bounding boxes (for demo purposes)
  const boundingBoxes = [];
  let yPosition = 50;
  
  lines.forEach((line, index) => {
    if (line.trim().length > 0) {
      boundingBoxes.push({
        text: line.trim(),
        x: 50,
        y: yPosition,
        width: line.length * 10,
        height: 30,
        lineIndex: index
      });
      
      yPosition += 40;
    } else {
      yPosition += 20; // Space for empty lines
    }
  });
  
  return boundingBoxes;
}