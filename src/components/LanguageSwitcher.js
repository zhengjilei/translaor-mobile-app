import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSupportedLanguages } from '../services/translationService';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

const LanguageSwitcher = ({ onLanguageChange, darkMode = false, style }) => {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [availableLanguages, setAvailableLanguages] = useState([
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
  ]);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [pressedButton, setPressedButton] = useState(null);
  
  // Fetch available languages on component mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const languages = await getSupportedLanguages();
        if (languages && languages.length > 0) {
          setAvailableLanguages(languages);
          logger.debug(`Loaded ${languages.length} supported languages`, 'LanguageSwitcher');
        } else {
          logger.warn('Received empty languages list, using default languages', 'LanguageSwitcher');
        }
      } catch (error) {
        logger.error(`Failed to load supported languages: ${error.message}`, 'LanguageSwitcher');
        // Will keep using default languages set in useState
      }
    };
    
    fetchLanguages();
  }, []);
  
  // Notify parent component when languages change
  useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange({
        sourceLanguage,
        targetLanguage
      });
    }
  }, [sourceLanguage, targetLanguage, onLanguageChange]);
  
  // Get language name by code
  const getLanguageName = (code) => {
    const language = availableLanguages.find(lang => lang.code === code);
    return language ? language.name : code.toUpperCase();
  };
  
  // Get formatted language name with any special annotations
  const getFormattedLanguageName = (code) => {
    const baseName = getLanguageName(code);
    
    // Check if the name contains parentheses
    if (baseName.includes('(')) {
      // Split at the opening parenthesis and format with a line break
      const [mainPart, parentheticalPart] = baseName.split(/\s*\(/);
      // Remove the closing parenthesis for processing
      const cleanParenthetical = parentheticalPart.replace(')', '');
      // Return formatted with line break and restored parentheses
      return `${mainPart}\n(${cleanParenthetical})`;
    }
    
    return baseName;
  };
  
  // Swap source and target languages
  const swapLanguages = () => {
    logger.debug(`Swapping languages ${sourceLanguage} ↔ ${targetLanguage}`, 'LanguageSwitcher');
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };
  
  // Select source language
  const handleSelectSourceLanguage = (langCode) => {
    setSourceLanguage(langCode);
    setSourceModalVisible(false);
  };
  
  // Select target language
  const handleSelectTargetLanguage = (langCode) => {
    setTargetLanguage(langCode);
    setTargetModalVisible(false);
  };

  // Handle button press animations
  const handlePressIn = (buttonName) => {
    setPressedButton(buttonName);
  };
  
  const handlePressOut = () => {
    setPressedButton(null);
  };

  // Render language selection buttons with the dark mode styling
  return (
    <View 
      style={[
        styles.container, 
        darkMode && styles.darkContainer,
        style // Apply custom styles from parent
      ]}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => true}
    >
      <View style={styles.languageRow}>
        <TouchableOpacity
          style={[
            styles.languageButton, 
            darkMode && styles.darkLanguageButton,
            pressedButton === 'source' && (darkMode ? styles.darkPressedButton : styles.pressedButton)
          ]}
          onPress={() => setSourceModalVisible(true)}
          activeOpacity={0.6}
          onPressIn={() => handlePressIn('source')}
          onPressOut={handlePressOut}
        >
          <Text style={[
            styles.languageText,
            darkMode && styles.darkLanguageText
          ]}>
            {getFormattedLanguageName(sourceLanguage)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.swapButton, 
            darkMode && styles.darkSwapButton,
            pressedButton === 'swap' && (darkMode ? styles.darkPressedSwapButton : styles.pressedSwapButton)
          ]}
          onPress={swapLanguages}
          activeOpacity={0.5}
          onPressIn={() => handlePressIn('swap')}
          onPressOut={handlePressOut}
        >
          <Ionicons
            name="swap-horizontal"
            size={22}
            color={darkMode ? "#3a7bff" : "#4a6ea9"}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageButton, 
            darkMode && styles.darkLanguageButton,
            pressedButton === 'target' && (darkMode ? styles.darkPressedButton : styles.pressedButton)
          ]}
          onPress={() => setTargetModalVisible(true)}
          activeOpacity={0.6}
          onPressIn={() => handlePressIn('target')}
          onPressOut={handlePressOut}
        >
          <Text style={[
            styles.languageText,
            darkMode && styles.darkLanguageText
          ]}>
            {getFormattedLanguageName(targetLanguage)}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Offline Mode Toggle is hidden for now */}
      {/* Will be re-enabled in the future when offline functionality is supported */}
      
      {/* Source Language Modal */}
      <Modal
        visible={sourceModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSourceModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSourceModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent,
              darkMode && styles.darkModalContent
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                darkMode && styles.darkModalTitle
              ]}>
                Select Source Language
              </Text>
              <TouchableOpacity
                onPress={() => setSourceModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={darkMode ? "#ddd" : "#333"}
                />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    sourceLanguage === item.code && styles.selectedItem,
                    darkMode && styles.darkLanguageItem,
                    sourceLanguage === item.code && darkMode && styles.darkSelectedItem
                  ]}
                  onPress={() => handleSelectSourceLanguage(item.code)}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      sourceLanguage === item.code && styles.selectedItemText,
                      darkMode && styles.darkLanguageItemText,
                      sourceLanguage === item.code && darkMode && styles.darkSelectedItemText
                    ]}
                  >
                    {item.code === 'zh' ? `${item.name} (Simplified)` : item.name}
                  </Text>
                  {sourceLanguage === item.code && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={darkMode ? "#3a7bff" : "#4a6ea9"}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Target Language Modal */}
      <Modal
        visible={targetModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTargetModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setTargetModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent,
              darkMode && styles.darkModalContent
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                darkMode && styles.darkModalTitle
              ]}>
                Select Target Language
              </Text>
              <TouchableOpacity
                onPress={() => setTargetModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={darkMode ? "#ddd" : "#333"}
                />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    targetLanguage === item.code && styles.selectedItem,
                    darkMode && styles.darkLanguageItem,
                    targetLanguage === item.code && darkMode && styles.darkSelectedItem
                  ]}
                  onPress={() => handleSelectTargetLanguage(item.code)}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      targetLanguage === item.code && styles.selectedItemText,
                      darkMode && styles.darkLanguageItemText,
                      targetLanguage === item.code && darkMode && styles.darkSelectedItemText
                    ]}
                  >
                    {item.code === 'zh' ? `${item.name} (Simplified)` : item.name}
                  </Text>
                  {targetLanguage === item.code && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={darkMode ? "#3a7bff" : "#4a6ea9"}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 8,
    width: '100%',
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
  darkContainer: {
    backgroundColor: '#252525',
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  languageButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      }
    }),
  },
  darkLanguageButton: {
    backgroundColor: '#1c1c1c',
  },
  languageText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 2,
  },
  darkLanguageText: {
    color: 'white',
  },
  swapButton: {
    backgroundColor: '#eef2fb',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#4a6ea9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      }
    }),
  },
  darkSwapButton: {
    backgroundColor: '#2a2a2a',
  },
  offlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  darkOfflineToggle: {
    borderTopColor: '#333',
  },
  offlineIconContainer: {
    paddingRight: 5,
  },
  offlineText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  darkOfflineText: {
    color: '#aaa',
  },
  toggleSwitch: {
    paddingLeft: 10,
  },
  toggleTrack: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
  },
  darkToggleTrack: {
    backgroundColor: '#444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 24,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }
    }),
  },
  darkModalContent: {
    backgroundColor: '#252525',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  darkModalTitle: {
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkLanguageItem: {
    borderBottomColor: '#333',
  },
  selectedItem: {
    backgroundColor: '#f5f7fa',
  },
  darkSelectedItem: {
    backgroundColor: '#333',
  },
  languageItemText: {
    fontSize: 16,
    color: '#333',
  },
  darkLanguageItemText: {
    color: '#ddd',
  },
  selectedItemText: {
    fontWeight: '600',
    color: '#4a6ea9',
  },
  darkSelectedItemText: {
    color: '#3a7bff',
  },
  pressedButton: {
    backgroundColor: '#e9e9e9',
    transform: [{ scale: 0.98 }],
  },
  darkPressedButton: {
    backgroundColor: '#2a2a2a',
    transform: [{ scale: 0.98 }],
  },
  pressedSwapButton: {
    backgroundColor: '#dbe5fb',
    transform: [{ scale: 0.95 }],
  },
  darkPressedSwapButton: {
    backgroundColor: '#333333',
    transform: [{ scale: 0.95 }],
  },
});

export default LanguageSwitcher; 