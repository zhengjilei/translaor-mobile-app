import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppState, StatusBar } from 'react-native';
import { getSettings } from './src/services/settingsService';
import { isOfflineModeEnabled } from './src/services/offlineService';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import TranslateScreen from './src/screens/TranslateScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PhrasebookScreen from './src/screens/PhrasebookScreen';
import ConversationScreen from './src/screens/ConversationScreen';
import ConversationListScreen from './src/screens/ConversationListScreen';
import CameraTranslateScreen from './src/screens/CameraTranslateScreen';
import LanguagePacksScreen from './src/screens/LanguagePacksScreen';

// Create the stack navigator
const Stack = createNativeStackNavigator();

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Handle app state changes (foreground/background)
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // App came to foreground, check settings
        loadSettings();
      }
    });
    
    // Initial settings load
    loadSettings();
    
    return () => {
      appStateSubscription.remove();
    };
  }, []);
  
  // Load settings
  const loadSettings = async () => {
    try {
      // Get user settings
      const settings = await getSettings();
      setDarkMode(settings.darkMode);
      
      // Check offline mode
      const offline = await isOfflineModeEnabled();
      setIsOffline(offline);
    } catch (error) {
      console.error('Failed to load settings:', error);
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
    <NavigationContainer theme={theme}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.card}
      />
      <Stack.Navigator 
        initialRouteName="Home"
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
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'Universal Translator',
            headerShown: false, // Hide header on home screen
          }}
        />
        <Stack.Screen 
          name="Translate" 
          component={TranslateScreen}
          options={{ title: 'Text Translation' }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: 'Translation History' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="Phrasebook" 
          component={PhrasebookScreen}
          options={{ title: 'Phrasebook' }}
        />
        <Stack.Screen 
          name="ConversationList" 
          component={ConversationListScreen}
          options={{ title: 'Conversations' }}
        />
        <Stack.Screen 
          name="Conversation" 
          component={ConversationScreen}
          options={({ route }) => ({ 
            title: route.params?.title || 'Conversation',
            headerBackTitle: 'Back',
          })}
        />
        <Stack.Screen 
          name="CameraTranslate" 
          component={CameraTranslateScreen}
          options={{ 
            title: 'Camera Translation',
            headerTransparent: true,
            headerTintColor: 'white',
          }}
        />
        <Stack.Screen 
          name="LanguagePacks" 
          component={LanguagePacksScreen}
          options={{ title: 'Offline Language Packs' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
