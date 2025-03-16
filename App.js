import React, { useState, useEffect, lazy, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, StatusBar, StyleSheet, ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getSettings } from './src/services/settingsService';
import { isOfflineModeEnabled } from './src/services/offlineService';
import logger, { configureLogger, LOG_LEVELS } from './src/utils/logger';

// Import home screen for immediate loading
import HomeScreen from './src/screens/HomeScreen';
import SplashScreen from './src/screens/SplashScreen';

// Initialize logger at app startup
configureLogger({
  logLevel: __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR,
  enableTimestamp: true,
  enableComponentName: true,
});

// Lazy load other screens
const TranslateScreen = lazy(() => import('./src/screens/TranslateScreen'));
const HistoryScreen = lazy(() => import('./src/screens/HistoryScreen'));
const SettingsScreen = lazy(() => import('./src/screens/SettingsScreen'));
const PhrasebookScreen = lazy(() => import('./src/screens/PhrasebookScreen'));
const ConversationScreen = lazy(() => import('./src/screens/ConversationScreen'));
const ConversationListScreen = lazy(() => import('./src/screens/ConversationListScreen'));
const CameraTranslateScreen = lazy(() => import('./src/screens/CameraTranslateScreen'));
const LanguagePacksScreen = lazy(() => import('./src/screens/LanguagePacksScreen'));

// Create the stack navigator
const Stack = createNativeStackNavigator();

// Loading component for lazy-loaded screens
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#4a6ea9" />
  </View>
);

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Handle app state changes (foreground/background)
  useEffect(() => {
    logger.info('App initialized', 'App');
    
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      logger.debug(`App state changed to: ${nextAppState}`, 'App');
      
      if (nextAppState === 'active') {
        // App came to foreground, check settings
        loadSettings();
      }
    });
    
    // Initial settings load
    loadSettings();
    
    return () => {
      appStateSubscription.remove();
      logger.debug('App cleanup', 'App');
    };
  }, []);
  
  // Load settings
  const loadSettings = async () => {
    try {
      // Get user settings
      const settings = await getSettings();
      setDarkMode(settings.darkMode);
      logger.debug(`Theme set to ${settings.darkMode ? 'dark' : 'light'} mode`, 'App');
      
      // Check offline mode
      const offline = await isOfflineModeEnabled();
      setIsOffline(offline);
      logger.info(`Offline mode is ${offline ? 'enabled' : 'disabled'}`, 'App');
      
      // Update logger configuration based on settings
      // In a real app, you might want to adjust log levels based on user preference
      configureLogger({
        logLevel: __DEV__ ? LOG_LEVELS.DEBUG : (settings.verboseLogging ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR),
      });
    } catch (error) {
      logger.error(`Failed to load settings: ${error.message}`, 'App', error);
    }
  };
  
  // Define theme colors
  const theme = {
    dark: darkMode,
    colors: {
      primary: '#4a6ea9',
      background: darkMode ? '#121212' : '#f5f5f5',
      card: darkMode ? '#1e1e1e' : 'white',
      text: darkMode ? '#f5f5f5' : '#333',
      border: darkMode ? '#333' : '#ddd',
      notification: '#ff3b30',
    },
  };
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer 
        theme={theme}
        onStateChange={(state) => {
          const currentRouteName = state?.routes[state.index]?.name;
          if (currentRouteName) {
            logger.debug(`Navigation: Current screen is ${currentRouteName}`, 'Navigation');
          }
        }}
      >
        <StatusBar
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.card}
        />
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.card,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: '600',
            },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen}
            options={{ 
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ 
              title: 'Universal Translator',
              headerShown: false, // Hide header on home screen
            }}
          />
          <Stack.Screen 
            name="Translate" 
            options={{ title: 'Text Translation' }}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <TranslateScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="History" 
            options={{ title: 'Translation History' }}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <HistoryScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Settings" 
            options={{ title: 'Settings' }}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <SettingsScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Phrasebook" 
            options={{ title: 'Phrasebook' }}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <PhrasebookScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="ConversationList" 
            options={{ title: 'Conversations' }}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <ConversationListScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="Conversation" 
            options={({ route }) => ({ 
              title: route.params?.title || 'Conversation',
              headerBackTitle: 'Back',
            })}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <ConversationScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="CameraTranslate" 
            options={{ 
              title: 'Camera Translation',
              headerTransparent: true,
              headerTintColor: 'white',
            }}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <CameraTranslateScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="LanguagePacks" 
            options={{ title: 'Offline Language Packs' }}
          >
            {props => (
              <Suspense fallback={<LoadingScreen />}>
                <LanguagePacksScreen {...props} />
              </Suspense>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
