import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Platform,
  Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { translateText } from '../services/translationService';
import logger from '../utils/logger';

/**
 * QuickTranslateInput Component
 * 
 * A component that allows users to input text for translation, showing
 * the translated result and examples of usage.
 * 
 * @param {Object} props
 * @param {string} props.sourceLanguage - The source language code
 * @param {string} props.targetLanguage - The target language code
 * @param {Function} props.onFocusChange - Callback when focus state changes
 * @param {boolean} props.darkMode - Whether to use dark mode styling
 */
const QuickTranslateInput = ({ sourceLanguage, targetLanguage, onFocusChange, darkMode = true }) => {
  // State management
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [examples, setExamples] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  
  // Refs
  const inputRef = useRef(null);
  const translationTimeoutRef = useRef(null);
  
  /**
   * Clean up any timeouts when component unmounts
   */
  useEffect(() => {
    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Handle input text change with debounce for translation
   */
  useEffect(() => {
    // Clear any previous translation request
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }
    
    // If input is empty, clear results
    if (!inputText.trim()) {
      setTranslatedText('');
      setExamples([]);
      return;
    }
    
    // Set up a debounced translation call
    translationTimeoutRef.current = setTimeout(() => {
      performTranslation(inputText);
    }, 500);
    
    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [inputText, sourceLanguage, targetLanguage]);
  
  /**
   * Perform the translation API call
   * @param {string} text - Text to translate
   */
  const performTranslation = useCallback(async (text) => {
    if (!text.trim()) return;
    
    try {
      setIsLoading(true);
      logger.debug(`Translating: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`, 'QuickTranslateInput');
      
      const result = await translateText(text, sourceLanguage, targetLanguage);
      
      if (typeof result === 'string') {
        setTranslatedText(result);
        logger.debug(`Translation successful: "${result.substring(0, 30)}${result.length > 30 ? '...' : ''}"`, 'QuickTranslateInput');
        generateExamples(text);
      } else if (result && result.translatedText) {
        setTranslatedText(result.translatedText);
        logger.debug('Translation successful with metadata', 'QuickTranslateInput');
      }
    } catch (error) {
      logger.error(`Translation failed: ${error.message}`, 'QuickTranslateInput', error);
      setTranslatedText(`Error translating text: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [sourceLanguage, targetLanguage]);
  
  /**
   * Generate example usage for the translated text
   * @param {string} text - The input text
   */
  const generateExamples = useCallback((text) => {
    // Only generate examples for short phrases (3 words or fewer)
    if (text.split(' ').length > 3) {
      setExamples([]);
      return;
    }
    
    // Categorize the text for relevant examples
    let category = 'default';
    const lowerText = text.toLowerCase();
    
    if (['hello', 'hi', 'greetings', 'welcome', 'good'].some(word => lowerText.includes(word))) {
      category = 'greetings';
    } else if (['food', 'eat', 'dish', 'meal', 'restaurant'].some(word => lowerText.includes(word))) {
      category = 'foods';
    } else if (['where', 'direction', 'left', 'right', 'map'].some(word => lowerText.includes(word))) {
      category = 'directions';
    }
    
    // Example phrases by category
    const examplesByCategory = {
      greetings: [
        `"${text}" can be used to greet someone formally.`,
        `When meeting friends, you can say "${text}" casually.`,
        `"${text}" is commonly used in the morning as a greeting.`
      ],
      foods: [
        `"${text}" is a popular dish in many regions.`,
        `When ordering at a restaurant, you can ask for "${text}".`,
        `"${text}" is typically served with local accompaniments.`
      ],
      directions: [
        `When asking for directions, you can use "${text}".`,
        `"${text}" helps you navigate to your destination.`,
        `Locals will understand if you say "${text}" when lost.`
      ],
      default: [
        `"${text}" is commonly used in conversation.`,
        `You might hear "${text}" in daily interactions.`,
        `"${text}" has several contextual meanings depending on the situation.`
      ]
    };
    
    const relevantExamples = examplesByCategory[category];
    logger.debug(`Generated examples using category: ${category}`, 'QuickTranslateInput');
    
    // Random selection of 2-3 examples
    setExamples(relevantExamples.slice(0, Math.floor(Math.random() * 2) + 2));
  }, []);
  
  /**
   * Handle text-to-speech for the translated text
   */
  const handlePronounce = useCallback(() => {
    if (!translatedText) return;
    
    logger.info(`Pronouncing text in ${targetLanguage}`, 'QuickTranslateInput');
    
    Speech.speak(translatedText, {
      language: targetLanguage,
      pitch: 1.0,
      rate: 0.85, // Slightly slower for better comprehension
      onError: (error) => {
        logger.error(`Speech pronunciation failed: ${error}`, 'QuickTranslateInput');
      }
    });
  }, [translatedText, targetLanguage]);
  
  /**
   * Clear the input and results
   */
  const clearInput = useCallback(() => {
    logger.debug('Clearing translation input', 'QuickTranslateInput');
    setInputText('');
    setTranslatedText('');
    setExamples([]);
    Keyboard.dismiss();
    
    if (onFocusChange) {
      onFocusChange(false);
    }
    setInputFocused(false);
  }, [onFocusChange]);
  
  /**
   * Handle input focus state change
   * @param {boolean} focused - Whether the input is focused
   */
  const handleFocusChange = useCallback((focused) => {
    setInputFocused(focused);
    
    if (onFocusChange) {
      onFocusChange(focused);
    }
    
    logger.debug(`Input focus state changed to: ${focused}`, 'QuickTranslateInput');
  }, [onFocusChange]);
  
  /**
   * Handle paste from clipboard
   */
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getString();
      
      if (text) {
        setInputText(text);
        handleFocusChange(true);
        
        // Focus the input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (error) {
      logger.error(`Failed to paste from clipboard: ${error.message}`, 'QuickTranslateInput');
    }
  }, [handleFocusChange]);
  
  /**
   * Focus the input when the container is tapped
   */
  const handleContainerPress = useCallback(() => {
    if (inputRef.current) {
      // Force keyboard to show by focusing with a slight delay
      setTimeout(() => {
        inputRef.current.focus();
        // For Android simulators, try to force keyboard visibility
        if (Platform.OS === 'android') {
          Keyboard.dismiss();
          setTimeout(() => {
            inputRef.current.focus();
          }, 100);
        }
      }, 50);
    }
  }, []);
  
  /**
   * Render the input placeholder
   */
  const renderPlaceholder = () => {
    // Using the built-in placeholder functionality of TextInput instead
    return null;
  };
  
  /**
   * Render the clear button
   */
  const renderClearButton = () => {
    if (!inputText.length) return null;
    
    return (
      <TouchableOpacity 
        style={[
          styles.clearButton,
          !darkMode && styles.lightClearButton
        ]} 
        onPress={clearInput}
        accessibilityLabel="Clear input"
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name="close-circle" size={22} color={darkMode ? "#777" : "#333"} />
      </TouchableOpacity>
    );
  };
  
  /**
   * Render the paste button
   */
  const renderPasteButton = () => {
    if (inputText) return null;
    
    return (
      <View style={styles.pasteButtonContainer}>
        <TouchableOpacity 
          style={[
            styles.pasteButton,
            !darkMode && styles.lightPasteButton
          ]} 
          onPress={handlePaste}
          accessibilityLabel="Paste from clipboard"
        >
          <Ionicons name="clipboard-outline" size={24} color={darkMode ? "#3a7bff" : "#333"} />
          <Text style={[
            styles.pasteButtonText,
            !darkMode && styles.lightPasteButtonText
          ]}>Paste</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  /**
   * Render the translation loading state
   */
  const renderLoading = () => {
    if (!isLoading) return null;
    
    return (
      <View style={[
        styles.loadingContainer,
        !darkMode && styles.lightLoadingContainer
      ]}>
        <ActivityIndicator size="large" color={darkMode ? "#3a7bff" : "#333"} />
        <Text style={[
          styles.loadingText,
          !darkMode && styles.lightLoadingText
        ]}>Translating...</Text>
      </View>
    );
  };
  
  /**
   * Render the translation result
   */
  const renderTranslationResult = () => {
    if (isLoading || !translatedText) return null;
    
    return (
      <View style={[
        styles.resultContainer,
        !darkMode && styles.lightResultContainer
      ]}>
        <View style={[
          styles.translationHeader,
          !darkMode && styles.lightTranslationHeader
        ]}>
          <Text style={[
            styles.translationTitle,
            !darkMode && styles.lightTranslationTitle
          ]}>Translation</Text>
          <TouchableOpacity 
            style={[
              styles.pronounceButton,
              !darkMode && styles.lightPronounceButton
            ]}
            onPress={handlePronounce}
            accessibilityLabel="Pronounce translation"
          >
            <Ionicons name="volume-high" size={24} color={darkMode ? "#3a7bff" : "#333"} />
          </TouchableOpacity>
        </View>
        <Text style={[
          styles.translatedText,
          !darkMode && styles.lightTranslatedText
        ]}>{translatedText}</Text>
        
        {examples.length > 0 && renderExamples()}
      </View>
    );
  };
  
  /**
   * Render example usages
   */
  const renderExamples = () => {
    return (
      <View style={[
        styles.examplesContainer,
        !darkMode && styles.lightExamplesContainer
      ]}>
        <Text style={[
          styles.examplesTitle,
          !darkMode && styles.lightExamplesTitle
        ]}>Examples</Text>
        {examples.map((example, index) => (
          <Text key={index} style={[
            styles.exampleText,
            !darkMode && styles.lightExampleText
          ]}>{example}</Text>
        ))}
      </View>
    );
  };
  
  return (
    <View style={[
      styles.container,
      !darkMode && styles.lightContainer
    ]}>
      <TouchableOpacity 
        style={[
          styles.inputContainer,
          !darkMode && styles.lightInputContainer
        ]}
        activeOpacity={0.7}
        onPress={handleContainerPress}
        accessible={true}
        accessibilityLabel="Translation input area"
        accessibilityHint="Tap to start entering text for translation"
      >
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input, 
            !darkMode && styles.lightInput
          ]}
          placeholder="Start Typing..."
          value={inputText}
          onChangeText={setInputText}
          multiline={true}
          maxLength={500}
          onFocus={() => handleFocusChange(true)}
          onBlur={() => handleFocusChange(false)}
          accessibilityLabel="Translation input field"
          accessibilityHint="Enter text to be translated"
          placeholderTextColor={darkMode ? "#777" : "#999"}
          keyboardAppearance={darkMode ? "dark" : "light"}
          returnKeyType="done"
          blurOnSubmit={false}
          autoCapitalize="none"
          showSoftInputOnFocus={true}
          textAlignVertical="top"
        />
        
        {renderClearButton()}
        {renderPasteButton()}
      </TouchableOpacity>

      {renderLoading()}
      {renderTranslationResult()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1c',
    borderRadius: 0,
    marginBottom: 0,
    flex: 1,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    }),
  },
  lightContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 0,
    borderColor: '#e0e0e0',
  },
  inputContainer: {
    minHeight: 180,
    padding: 15,
    position: 'relative',
    justifyContent: 'flex-start',
    paddingTop: 15,
    paddingBottom: 35,
  },
  lightInputContainer: {
    backgroundColor: '#ffffff',
  },
  placeholderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 15,
    paddingVertical: 15,
    zIndex: 1,
  },
  placeholderText: {
    fontSize: 22,
    color: '#777',
    fontWeight: '400',
    padding: 5,
    paddingTop: 15,
  },
  placeholderFocused: {
    opacity: 0.5,
  },
  lightPlaceholderText: {
    color: '#999',
  },
  input: {
    fontSize: 22,
    color: 'white',
    padding: 5,
    minHeight: 120,
    paddingTop: 0,
    textAlignVertical: 'top',
  },
  lightInput: {
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    padding: 8,
  },
  lightClearButton: {
    backgroundColor: '#ffffff',
  },
  pasteButtonContainer: {
    position: 'absolute',
    left: 0,
    top: 70,
    padding: 20,
    width: '100%',
    zIndex: 2,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(50, 50, 50, 0.7)',
    alignSelf: 'flex-start',
  },
  lightPasteButton: {
    backgroundColor: 'rgba(240, 240, 240, 0.9)',
  },
  pasteButtonText: {
    color: '#3a7bff',
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
  },
  lightPasteButtonText: {
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  lightLoadingContainer: {
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#aaa',
  },
  lightLoadingText: {
    color: '#333',
  },
  resultContainer: {
    padding: 15,
    backgroundColor: '#222',
  },
  lightResultContainer: {
    backgroundColor: '#ffffff',
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lightTranslationHeader: {
    borderBottomColor: '#e0e0e0',
  },
  translationTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ddd',
  },
  lightTranslationTitle: {
    color: '#333',
  },
  pronounceButton: {
    padding: 6,
    backgroundColor: 'rgba(58, 123, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightPronounceButton: {
    backgroundColor: '#ffffff',
  },
  translatedText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 15,
    lineHeight: 28,
  },
  lightTranslatedText: {
    color: '#333',
  },
  examplesContainer: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3a7bff',
  },
  lightExamplesContainer: {
    backgroundColor: '#ffffff',
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 8,
  },
  lightExamplesTitle: {
    color: '#333',
  },
  exampleText: {
    fontSize: 15,
    color: '#bbb',
    marginBottom: 8,
    lineHeight: 22,
  },
  lightExampleText: {
    color: '#333',
  },
});

export default QuickTranslateInput; 