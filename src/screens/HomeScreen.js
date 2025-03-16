import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isOfflineModeEnabled, getDownloadedLanguages } from '../services/offlineService';
import { createConversation } from '../services/conversationService';
import LanguageSwitcher from '../components/LanguageSwitcher';
import QuickTranslateInput from '../components/QuickTranslateInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileAvatar from '../components/ProfileAvatar';
import AppLogo from '../components/AppLogo';
import ProfileMenu from '../components/ProfileMenu';
import logger from '../utils/logger';
import { getSettings } from '../services/settingsService';

const HomeScreen = ({ navigation }) => {
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [downloadedLanguages, setDownloadedLanguages] = useState([]);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [uiMode, setUiMode] = useState('normal');
  const insets = useSafeAreaInsets();
  
  // Animation value for bottom toolbar
  const toolbarOpacity = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Load dark mode setting from user preferences
    const loadDarkModeSetting = async () => {
      try {
        const settings = await getSettings();
        setDarkMode(settings.darkMode);
        logger.debug(`Loaded dark mode setting: ${settings.darkMode}`, 'HomeScreen');
      } catch (error) {
        logger.error(`Failed to load dark mode setting: ${error.message}`, 'HomeScreen');
        // Keep default dark mode (true) on error
      }
    };

    loadDarkModeSetting();
    
    // Check if offline mode is enabled and get downloaded languages
    const checkOfflineStatus = async () => {
      const offlineStatus = await isOfflineModeEnabled();
      setOfflineEnabled(offlineStatus);
      
      if (offlineStatus) {
        const languages = await getDownloadedLanguages();
        setDownloadedLanguages(languages);
        logger.info(`Offline mode enabled with ${languages.length} downloaded languages`, 'HomeScreen');
      } else {
        logger.info('Offline mode disabled', 'HomeScreen');
      }
    };
    
    checkOfflineStatus();
    
    // Handle keyboard visibility and measure keyboard height
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        // Store keyboard height for positioning elements
        if (event && event.endCoordinates) {
          setKeyboardHeight(event.endCoordinates.height);
        }
        
        // Set to input mode when keyboard shows
        setUiMode('input');
        
        // Animate bottom toolbar fade out
        Animated.timing(toolbarOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
        logger.debug('Keyboard shown, switching to input mode', 'HomeScreen');
      }
    );
    
    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        
        // Switch to normal mode if not in a language modal
        if (!languageModalVisible) {
          setUiMode('normal');
          setIsInputFocused(false);
        }
        
        logger.debug('Keyboard hidden, switching to normal mode', 'HomeScreen');
      }
    );
    
    // Refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      logger.debug('HomeScreen focused, refreshing offline status', 'HomeScreen');
      checkOfflineStatus();
      loadDarkModeSetting(); // Reload dark mode setting when screen comes into focus
    });
    
    return () => {
      unsubscribe();
      keyboardShowListener.remove();
      keyboardHideListener.remove();
      logger.debug('HomeScreen cleanup completed', 'HomeScreen');
    };
  }, [navigation, keyboardVisible]);
  
  // Force keyboard visibility when input is focused
  useEffect(() => {
    if (isInputFocused && !keyboardVisible && Platform.OS === 'android') {
      // For Android, try to ensure keyboard shows up when input is focused
      setTimeout(() => {
        logger.debug('Trying to ensure keyboard visibility', 'HomeScreen');
      }, 300);
    }
  }, [isInputFocused, keyboardVisible]);
  
  // Handle UI mode changes
  useEffect(() => {
    // When UI mode changes, update animations and visibility
    if (uiMode === 'normal') {
      // Normal mode - toolbar visible, input not focused
      Animated.timing(toolbarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Ensure input is not focused
      setIsInputFocused(false);
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    } 
    else if (uiMode === 'input') {
      // Input mode - toolbar hidden, input focused
      Animated.timing(toolbarOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    logger.debug(`UI mode changed to: ${uiMode}`, 'HomeScreen');
  }, [uiMode]);
  
  // Handle language change
  const handleLanguageChange = (languagePrefs) => {
    logger.info(`Language preferences updated: ${languagePrefs.sourceLanguage} → ${languagePrefs.targetLanguage}`, 'HomeScreen');
    // Update the language state values for the QuickTranslateInput component
    setSourceLanguage(languagePrefs.sourceLanguage);
    setTargetLanguage(languagePrefs.targetLanguage);
  };
  
  // Handle input focus state
  const handleInputFocus = (focused) => {
    setIsInputFocused(focused);
    logger.debug(`Input focus state changed to: ${focused}`, 'HomeScreen');
    
    // Update UI mode based on focus state
    if (focused) {
      // Switch to input mode
      setUiMode('input');
    }
    
    // Directly animate toolbar based on focus state
    if (focused) {
      // Immediately hide the bottom toolbar when input is focused
      Animated.timing(toolbarOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Also set keyboard visible state for positioning
      setKeyboardVisible(true);
      
      // For simulators, try to manually show keyboard
      if (Platform.OS === 'android') {
        setTimeout(() => {
          logger.debug('Attempting to force keyboard visibility', 'HomeScreen');
        }, 100);
      }
    } else if (!keyboardVisible) {
      // If input loses focus and keyboard is not visible, show toolbar
      Animated.timing(toolbarOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };
  
  // Start a new conversation and navigate directly to it
  const startNewConversation = async () => {
    try {
      setCreatingConversation(true);
      logger.info('Creating new conversation', 'HomeScreen');
      
      // Create a new conversation with default settings
      const defaultTitle = `Conversation (${new Date().toLocaleString()})`;
      const participant1 = { language: 'en', name: 'Me' };
      const participant2 = { language: 'es', name: 'Partner' };
      
      const newConversation = await createConversation(
        defaultTitle,
        participant1,
        participant2
      );
      
      logger.info(`Conversation created with ID: ${newConversation.id}`, 'HomeScreen');
      
      // Navigate to the conversation screen with the new conversation ID
      navigation.navigate('Conversation', { conversationId: newConversation.id });
    } catch (error) {
      logger.error(`Failed to create conversation: ${error.message}`, 'HomeScreen', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    } finally {
      setCreatingConversation(false);
    }
  };
  
  // Show offline mode warning if traveling without downloaded languages
  const showOfflineWarning = () => {
    if (!offlineEnabled || downloadedLanguages.length === 0) {
      logger.info('Showing offline mode recommendation alert', 'HomeScreen');
      Alert.alert(
        'Offline Mode Recommended',
        'For the best experience while traveling, we recommend downloading language packs for offline use. This helps you avoid connectivity issues and data charges.',
        [
          { text: 'Later' },
          { 
            text: 'Download Now', 
            onPress: () => {
              logger.info('User chose to download languages for offline use', 'HomeScreen');
              navigation.navigate('Settings', { showOfflineSection: true });
            }
          }
        ]
      );
    }
  };

  // Toggle profile menu
  const toggleProfileMenu = () => {
    logger.debug(`${profileMenuVisible ? 'Hiding' : 'Showing'} profile menu`, 'HomeScreen');
    setProfileMenuVisible(!profileMenuVisible);
  };
  
  // Handle language modal visibility
  const handleLanguageModalVisibility = (isVisible) => {
    setLanguageModalVisible(isVisible);
    
    // Manage UI mode based on modal visibility
    setUiMode(isVisible ? 'input' : 'normal');
    
    logger.debug(`Language modal visibility changed to: ${isVisible}, setting uiMode to: ${isVisible ? 'input' : 'normal'}`, 'HomeScreen');
  };
  
  // Define theme colors based on dark mode setting
  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    card: darkMode ? '#1c1c1c' : '#ffffff',
    text: darkMode ? '#f5f5f5' : '#333333',
    border: darkMode ? '#333333' : '#e0e0e0',
    accent: darkMode ? '#6889c4' : '#4a6ea9',
    primaryButton: darkMode ? '#2a2a2a' : '#f0f0f0',
    secondaryText: darkMode ? '#aaaaaa' : '#777777',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      {/* App Header with Profile */}
      <View style={[styles.header, { 
        backgroundColor: theme.background,
        borderBottomColor: theme.border
      }]}>
        <View style={styles.logoContainer}>
          <AppLogo darkMode={darkMode} />
        </View>
        <ProfileAvatar 
          initial="E" 
          onPress={toggleProfileMenu}
        />
      </View>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={[styles.mainContent, { backgroundColor: theme.background }]}>
          {/* Main Content Area - Always Visible */}
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => true}
          >
            <View style={styles.inputSafeArea}>
              {/* Quick Translate Input Box */}
              <QuickTranslateInput 
                sourceLanguage={sourceLanguage} 
                targetLanguage={targetLanguage}
                onFocusChange={(focused) => {
                  // Set input focus state
                  setIsInputFocused(focused);
                  
                  // Update UI mode based on focus state consistently
                  setUiMode(focused ? 'input' : 'normal');
                  logger.debug(`uiMode set to: ${focused ? 'input' : 'normal'}`, 'HomeScreen');
                  
                  // When focusing, ensure keyboard visibility is set
                  if (focused) {
                    setKeyboardVisible(true);
                    logger.debug('Keyboard set to visible', 'HomeScreen');
                    
                    // For iOS, ensure the UI updates immediately
                    if (Platform.OS === 'ios') {
                      // Force update to ensure views are refreshed
                      setTimeout(() => {
                        setUiMode('input');
                        logger.debug('Forced uiMode update for iOS', 'HomeScreen');
                      }, 50);
                    }
                  }
                  
                  logger.debug(`Input focus changed to: ${focused}, setting uiMode to: ${focused ? 'input' : 'normal'}`, 'HomeScreen');
                }}
                darkMode={darkMode}
                style={{ flex: 1 }} // Maximize input box
              />
            </View>
          </ScrollView>
          
          {/* Language Switcher - Visible both on home screen and above keyboard */}
          {/* When input is focused, position above keyboard */}
          {(keyboardVisible && isInputFocused) ? (
            <View style={[
              styles.languageSwitcherContainer,
              styles.languageSwitcherAbsolute,
              { 
                backgroundColor: theme.card,
                bottom: keyboardHeight > 0 ? keyboardHeight : 0,
                borderTopWidth: 1,
                borderTopColor: theme.border
              }
            ]}>
              <LanguageSwitcher 
                onLanguageChange={handleLanguageChange}
                darkMode={darkMode}
                style={{ marginVertical: 0 }}
                onModalVisibilityChange={handleLanguageModalVisibility}
              />
            </View>
          ) : (
            /* When on home screen, position above toolbar */
            !isInputFocused && (
              <View style={[
                styles.languageSwitcherContainer,
                { backgroundColor: theme.card }
              ]}>
                <LanguageSwitcher 
                  onLanguageChange={handleLanguageChange}
                  darkMode={darkMode}
                  style={{ marginVertical: 0 }}
                  onModalVisibilityChange={handleLanguageModalVisibility}
                />
              </View>
            )
          )}
          
          {/* Return Button - Visible when input is focused */}
          {(uiMode === 'input' || isInputFocused) ? (
            <TouchableOpacity
              style={[
                styles.floatingReturnButton,
                { 
                  backgroundColor: '#5575CF',
                  bottom: (keyboardHeight > 0 ? keyboardHeight : 0) + 140, // Adjusted position
                  right: 24, // Added padding
                  zIndex: 200, // Ensure it's above other elements
                }
              ]}
              onPress={() => {
                logger.debug('Return button pressed', 'HomeScreen');
                // Force focus away from any inputs first
                Keyboard.dismiss();
                
                // Set UI mode to normal
                setUiMode('normal');
                logger.debug('uiMode set to normal after return button press', 'HomeScreen');
                
                // Reset state variables
                setKeyboardVisible(false);
                setKeyboardHeight(0);
                setIsInputFocused(false);
                
                // Ensure toolbar appears with animation
                Animated.timing(toolbarOpacity, {
                  toValue: 1,
                  duration: 250,
                  useNativeDriver: true,
                }).start();
              }}
              activeOpacity={0.7}
              accessibilityLabel="Close input"
              accessibilityHint="Closes the input field and returns to home view"
            >
              <Ionicons 
                name="close" 
                size={32} 
                color="white" 
              />
            </TouchableOpacity>
          ) : logger.debug('Return button not visible, uiMode:', uiMode, 'isInputFocused:', isInputFocused, 'HomeScreen')}
          
          {/* Bottom Toolbar - Hidden when input is focused */}
          {uiMode !== 'input' && (
            <View style={styles.toolsContainer}>
              <View style={styles.featureGrid}>
                <TouchableOpacity 
                  style={[styles.featureButton, { backgroundColor: theme.card }]} 
                  onPress={startNewConversation}
                  disabled={creatingConversation || keyboardVisible || isInputFocused}
                >
                  <View style={[styles.featureIcon, { backgroundColor: theme.accent }]}>  
                    {creatingConversation ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="chatbubbles" size={24} color="white" />
                    )}
                  </View>
                  <Text style={[styles.featureButtonText, { color: theme.text }]}>  
                    Conversation
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.featureButton, { backgroundColor: theme.card }]}
                  onPress={() => {
                    logger.info('Navigating to Camera Translation screen', 'HomeScreen');
                    navigation.navigate('CameraTranslate');
                  }}
                  disabled={keyboardVisible || isInputFocused}
                >
                  <View style={[styles.featureIcon, { backgroundColor: theme.accent }]}>  
                    <Ionicons name="camera" size={24} color="white" />
                  </View>
                  <Text style={[styles.featureButtonText, { color: theme.text }]}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.featureButton, { backgroundColor: theme.card }]}
                  onPress={() => {
                    logger.info('Navigating to Phrasebook screen', 'HomeScreen');
                    navigation.navigate('Phrasebook');
                  }}
                  disabled={keyboardVisible || isInputFocused}
                >
                  <View style={[styles.featureIcon, { backgroundColor: theme.accent }]}>  
                    <Ionicons name="bookmark" size={24} color="white" />
                  </View>
                  <Text style={[styles.featureButtonText, { color: theme.text }]}>Phrasebook</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      
      {/* Profile Menu */}
      <ProfileMenu 
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        navigation={navigation}
        topPosition={insets.top + 60}
        darkMode={darkMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: 12,
        paddingBottom: 12,
      },
      android: {
        paddingTop: 10,
        paddingBottom: 10,
      },
    }),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginLeft: 0,
      },
      android: {
        marginLeft: -4, // Adjust for platform-specific alignment
      },
    }),
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    padding: 0,
    paddingTop: 0,
    flexGrow: 1,
  },
  inputSafeArea: {
    flex: 1,
    // Remove the marginHorizontal for Android
    ...Platform.select({
      android: {
        marginHorizontal: 0,
      },
    }),
  },
  bottomContainer: {
    width: '100%',
    ...Platform.select({
      android: {
        minHeight: 60,
      }
    })
  },
  languageSwitcherContainer: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    zIndex: 100,
    backgroundColor: '#ffffff',
    marginVertical: 0,
    paddingVertical: 0,
    ...Platform.select({
      android: {
        elevation: 0,
        marginTop: 0,
      },
      ios: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      }
    }),
  },
  languageSwitcherAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({
      android: {
        elevation: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }
    }),
  },
  toolsContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    ...Platform.select({
      android: {
        paddingBottom: 10,
      }
    })
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  featureButton: {
    width: '30%',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      }
    }),
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  floatingReturnButton: {
    position: 'absolute',
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
    borderWidth: 0,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      }
    }),
  },
  floatingButtonsContainer: {
    // Add your floating buttons here, ensuring they don't overlap with the input
  },
});

export default HomeScreen;