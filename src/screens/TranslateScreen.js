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
  Platform,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translateText } from '../services/translationService';
import { saveToHistory } from '../services/historyService';
import LanguageSelector from '../components/LanguageSelector';
import TranslationResult from '../components/TranslationResult';
import { getSettings, getLanguagePreferences, updateLanguagePreferences } from '../services/settingsService';
import ProfileAvatar from '../components/ProfileAvatar';
import AppLogo from '../components/AppLogo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileMenu from '../components/ProfileMenu';

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
  const [isOfflineMessage, setIsOfflineMessage] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Process route params if coming from history screen or phrasebook
  useEffect(() => {
    if (route.params) {
      const { 
        sourceText, 
        translatedText, 
        sourceLanguage, 
        targetLanguage, 
        fromPhrasebook,
        sourceLangName,
        targetLangName
      } = route.params;
      
      if (sourceText) setSourceText(sourceText);
      if (translatedText) setTranslatedText(translatedText);
      if (sourceLanguage) setSourceLanguage(sourceLanguage);
      if (targetLanguage) setTargetLanguage(targetLanguage);
    } else {
      // If not coming from another screen, load default languages from preferences
      loadLanguagePreferences();
    }
  }, [route.params]);
  
  // Load language preferences
  const loadLanguagePreferences = async () => {
    try {
      const langPrefs = await getLanguagePreferences();
      setSourceLanguage(langPrefs.sourceLanguage);
      setTargetLanguage(langPrefs.targetLanguage);
    } catch (error) {
      console.error('Failed to load language preferences:', error);
    }
  };
  
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
    if (!sourceText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await translateText(sourceText, sourceLanguage, targetLanguage, selectedContext);
      
      // Check if result is an object with isOfflineMessage flag
      if (result && typeof result === 'object' && result.isOfflineMessage) {
        setTranslatedText(result.translatedText);
        setIsOfflineMessage(true);
      } else {
        setTranslatedText(result);
        setIsOfflineMessage(false);
        
        // Save to history if not an offline message
        if (!isOfflineMessage) {
          saveToHistory({
            sourceText,
            translatedText: result,
            sourceLanguage,
            targetLanguage,
            timestamp: new Date().toISOString(),
            context: selectedContext
          });
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError('Failed to translate text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle swapping source and target languages
  const handleSwapLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    
    // Also update the global language preferences
    updateLanguagePreferences({
      sourceLanguage: targetLanguage,
      targetLanguage: tempLang
    });
    
    // If there's already translated text, swap that too
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };
  
  // Toggle profile menu
  const toggleProfileMenu = () => {
    setProfileMenuVisible(!profileMenuVisible);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with logo and profile */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <AppLogo />
        <ProfileAvatar 
          initial="E" 
          onPress={toggleProfileMenu}
        />
      </View>
    
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer, 
            { paddingBottom: Math.max(20, insets.bottom) }
          ]}
        >
          {/* Language selector bar */}
          <View style={styles.languageBar}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => openLanguageSelector('source')}
            >
              <Text style={styles.languageText}>
                {languages.find(lang => lang.value === sourceLanguage)?.label || 'Source'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#333" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.swapButton}
              onPress={swapLanguages}
            >
              <Ionicons name="swap-horizontal" size={20} color="#4285F4" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => openLanguageSelector('target')}
            >
              <Text style={styles.languageText}>
                {languages.find(lang => lang.value === targetLanguage)?.label || 'Target'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Source text input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Enter text"
              value={sourceText}
              onChangeText={(text) => {
                setSourceText(text);
                if (autoTranslate && text.length > 0) {
                  handleTranslate(text);
                } else if (text.length === 0) {
                  setTranslatedText('');
                }
              }}
            />
            {sourceText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSourceText('');
                  setTranslatedText('');
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Translate button */}
          {sourceText.length > 0 && !autoTranslate && (
            <TouchableOpacity
              style={styles.translateButton}
              onPress={() => handleTranslate()}
              disabled={isLoading}
            >
              <Text style={styles.translateButtonText}>Translate</Text>
              {isLoading && (
                <ActivityIndicator size="small" color="white" style={{ marginLeft: 8 }} />
              )}
            </TouchableOpacity>
          )}
          
          {/* Error message */}
          {error && !isOfflineMessage && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#d32f2f" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Translation result */}
          {translatedText && (
            <TranslationResult
              translatedText={translatedText}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              isOfflineMessage={isOfflineMessage}
            />
          )}
          
          {/* Additional controls can go here */}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Profile Menu */}
      <ProfileMenu 
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        navigation={navigation}
        topPosition={insets.top + 60}
      />
      
      {/* Language selector modal - use existing implementation */}
      {showLanguageSelector && (
        <LanguageSelector
          visible={showLanguageSelector}
          languages={languages}
          selectedLanguage={selectorType === 'source' ? sourceLanguage : targetLanguage}
          onSelectLanguage={(language) => handleLanguageSelection(language)}
          onClose={() => setShowLanguageSelector(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 15,
  },
  languageBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 5,
  },
  swapButton: {
    padding: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    minHeight: 140,
    padding: 10,
    position: 'relative',
  },
  textInput: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  translateButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignSelf: 'center',
    marginVertical: 15,
  },
  translateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: '#d32f2f',
    marginLeft: 8,
    flex: 1,
  }
});

export default TranslateScreen;