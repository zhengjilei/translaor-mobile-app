import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { translateText } from '../services/translationService';
import { saveToHistory } from '../services/historyService';
import LanguageSelector from '../components/LanguageSelector';
import TranslationResult from '../components/TranslationResult';
import { getSettings } from '../services/settingsService';

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Korean', value: 'ko' },
  { label: 'Arabic', value: 'ar' },
];

const TranslateScreen = ({ navigation, route }) => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [autoTranslate, setAutoTranslate] = useState(false);
  
  // Process route params if coming from history screen
  useEffect(() => {
    if (route.params) {
      const { sourceText, translatedText, sourceLanguage, targetLanguage } = route.params;
      
      if (sourceText) setSourceText(sourceText);
      if (translatedText) setTranslatedText(translatedText);
      if (sourceLanguage) setSourceLanguage(sourceLanguage);
      if (targetLanguage) setTargetLanguage(targetLanguage);
    }
  }, [route.params]);
  
  // Get user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setAutoTranslate(settings.autoTranslate);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Auto-translate when text changes if enabled
  useEffect(() => {
    if (autoTranslate && sourceText.trim()) {
      const debounceTimer = setTimeout(() => {
        handleTranslate();
      }, 1000); // Add a delay to avoid making API calls for each character
      
      return () => clearTimeout(debounceTimer);
    }
  }, [sourceText, autoTranslate, sourceLanguage, targetLanguage]);
  
  // Handle translate button press
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would call an actual translation API
      const result = await translateText(sourceText, sourceLanguage, targetLanguage);
      setTranslatedText(result);
      
      // Save translation to history
      saveToHistory({
        sourceText,
        translatedText: result,
        sourceLanguage,
        targetLanguage,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Swap languages
  const handleSwapLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    
    // Also swap text if there's translated text
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText('');
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Language Selection */}
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguageChange={setSourceLanguage}
          onTargetLanguageChange={setTargetLanguage}
          onSwapLanguages={handleSwapLanguages}
          languages={languages}
        />
        
        {/* Source Text Input */}
        <View style={styles.textContainer}>
          <Text style={styles.label}>Enter Text:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Type or paste text to translate"
            value={sourceText}
            onChangeText={setSourceText}
            textAlignVertical="top"
          />
        </View>
        
        {/* Translate Button */}
        <TouchableOpacity 
          style={styles.translateButton}
          onPress={handleTranslate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.translateButtonText}>Translate</Text>
          )}
        </TouchableOpacity>
        
        {/* Error Message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {/* Translation Results */}
        {translatedText ? (
          <TranslationResult
            translatedText={translatedText}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  textContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 120,
    fontSize: 16,
  },
  translateButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default TranslateScreen;