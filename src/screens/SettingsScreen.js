import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Linking,
  useColorScheme
} from 'react-native';
import { getSettings, updateSettings } from '../services/settingsService';
import logger from '../utils/logger';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    saveHistory: true,
    autoTranslate: false,
    darkMode: false,
    apiKey: '',
    useFreeApi: true,
  });
  
  // Load settings when component mounts
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Load user settings
  const loadSettings = async () => {
    try {
      const userSettings = await getSettings();
      if (userSettings) {
        setSettings(userSettings);
        logger.debug('Settings loaded successfully', 'SettingsScreen');
      }
    } catch (error) {
      logger.error(`Failed to load settings: ${error}`, 'SettingsScreen');
    }
  };
  
  // Update a setting
  const handleToggleSetting = (key) => {
    const updatedSettings = {
      ...settings,
      [key]: !settings[key]
    };
    
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    logger.debug(`Setting "${key}" toggled to: ${!settings[key]}`, 'SettingsScreen');
  };
  
  // Save settings
  const saveSettings = async (updatedSettings) => {
    try {
      await updateSettings(updatedSettings);
      logger.debug('Settings saved successfully', 'SettingsScreen');
    } catch (error) {
      logger.error(`Failed to save settings: ${error}`, 'SettingsScreen');
    }
  };
  
  // Handle API selection
  const handleApiSelection = (useFree) => {
    if (!useFree && !settings.apiKey) {
      Alert.alert(
        'API Key Required',
        'To use the premium translation API, you need to enter an API key.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const updatedSettings = {
      ...settings,
      useFreeApi: useFree
    };
    
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    logger.debug(`API selection changed to: ${useFree ? 'Free' : 'Premium'}`, 'SettingsScreen');
  };
  
  // Open privacy policy
  const openPrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy-policy');
    logger.info('Privacy policy link opened', 'SettingsScreen');
  };
  
  // Open terms of service
  const openTermsOfService = () => {
    Linking.openURL('https://example.com/terms-of-service');
    logger.info('Terms of service link opened', 'SettingsScreen');
  };
  
  // Determine if the app should use dark mode styles based on settings
  const isDarkMode = settings.darkMode;
  
  return (
    <ScrollView style={[
      styles.container,
      isDarkMode && styles.darkContainer
    ]}>
      <View style={[
        styles.section,
        isDarkMode && styles.darkSection
      ]}>
        <Text style={[
          styles.sectionTitle,
          isDarkMode && styles.darkSectionTitle
        ]}>General</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[
              styles.settingText,
              isDarkMode && styles.darkSettingText
            ]}>Save Translation History</Text>
            <Text style={[
              styles.settingDescription,
              isDarkMode && styles.darkSettingDescription
            ]}>
              Store your previous translations
            </Text>
          </View>
          <Switch
            value={settings.saveHistory}
            onValueChange={() => handleToggleSetting('saveHistory')}
            trackColor={{ false: '#d3d3d3', true: '#6889c4' }}
            thumbColor={settings.saveHistory ? '#4a6ea9' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={[
              styles.settingText,
              isDarkMode && styles.darkSettingText
            ]}>Auto-Translate</Text>
            <Text style={[
              styles.settingDescription,
              isDarkMode && styles.darkSettingDescription
            ]}>
              Translate text as you type
            </Text>
          </View>
          <Switch
            value={settings.autoTranslate}
            onValueChange={() => handleToggleSetting('autoTranslate')}
            trackColor={{ false: '#d3d3d3', true: '#6889c4' }}
            thumbColor={settings.autoTranslate ? '#4a6ea9' : '#f4f3f4'}
          />
        </View>
        
        <View style={[
          styles.settingItem,
          { borderBottomWidth: 0 }
        ]}>
          <View>
            <Text style={[
              styles.settingText,
              isDarkMode && styles.darkSettingText
            ]}>Dark Mode</Text>
            <Text style={[
              styles.settingDescription,
              isDarkMode && styles.darkSettingDescription
            ]}>
              Use dark color theme
            </Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={() => handleToggleSetting('darkMode')}
            trackColor={{ false: '#d3d3d3', true: '#6889c4' }}
            thumbColor={settings.darkMode ? '#4a6ea9' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={[
        styles.section,
        isDarkMode && styles.darkSection
      ]}>
        <Text style={[
          styles.sectionTitle,
          isDarkMode && styles.darkSectionTitle
        ]}>Translation API</Text>
        
        <TouchableOpacity 
          style={[
            styles.apiOption,
            settings.useFreeApi && styles.selectedApiOption,
            isDarkMode && styles.darkApiOption,
            settings.useFreeApi && isDarkMode && styles.darkSelectedApiOption
          ]}
          onPress={() => handleApiSelection(true)}
        >
          <View>
            <Text style={[
              styles.apiOptionTitle,
              isDarkMode && styles.darkApiOptionTitle
            ]}>Free API</Text>
            <Text style={[
              styles.apiOptionDescription,
              isDarkMode && styles.darkApiOptionDescription
            ]}>
              Basic translation with limited languages
            </Text>
          </View>
          <View style={[
            styles.radioButton,
            settings.useFreeApi && styles.radioButtonSelected,
            isDarkMode && styles.darkRadioButton,
            settings.useFreeApi && isDarkMode && styles.darkRadioButtonSelected
          ]}>
            {settings.useFreeApi && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.apiOption,
            !settings.useFreeApi && styles.selectedApiOption,
            isDarkMode && styles.darkApiOption,
            !settings.useFreeApi && isDarkMode && styles.darkSelectedApiOption
          ]}
          onPress={() => handleApiSelection(false)}
        >
          <View>
            <Text style={[
              styles.apiOptionTitle,
              isDarkMode && styles.darkApiOptionTitle
            ]}>Premium API</Text>
            <Text style={[
              styles.apiOptionDescription,
              isDarkMode && styles.darkApiOptionDescription
            ]}>
              Advanced translation with more languages and features
            </Text>
          </View>
          <View style={[
            styles.radioButton,
            !settings.useFreeApi && styles.radioButtonSelected,
            isDarkMode && styles.darkRadioButton,
            !settings.useFreeApi && isDarkMode && styles.darkRadioButtonSelected
          ]}>
            {!settings.useFreeApi && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.section,
        isDarkMode && styles.darkSection
      ]}>
        <Text style={[
          styles.sectionTitle,
          isDarkMode && styles.darkSectionTitle
        ]}>About</Text>
        
        <TouchableOpacity 
          style={styles.aboutItem}
          onPress={openPrivacyPolicy}
        >
          <Text style={[
            styles.aboutItemText,
            isDarkMode && styles.darkAboutItemText
          ]}>Privacy Policy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.aboutItem}
          onPress={openTermsOfService}
        >
          <Text style={[
            styles.aboutItemText,
            isDarkMode && styles.darkAboutItemText
          ]}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
      
      {/* Version info - fixed styling to match design */}
      <View style={styles.versionContainer}>
        <Text style={[
          styles.versionText,
          isDarkMode && styles.darkVersionText
        ]}>Universal Translator v1.0.0</Text>
        <Text style={[
          styles.buildText,
          isDarkMode && styles.darkBuildText
        ]}>Build 2023061501</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  darkSection: {
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  darkSectionTitle: {
    color: '#f5f5f5',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  darkSettingText: {
    color: '#f5f5f5',
  },
  settingDescription: {
    fontSize: 14,
    color: '#777',
  },
  darkSettingDescription: {
    color: '#aaa',
  },
  apiOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkApiOption: {
    borderBottomColor: '#333',
  },
  selectedApiOption: {
    backgroundColor: '#f5f7fa',
  },
  darkSelectedApiOption: {
    backgroundColor: '#252525',
  },
  apiOptionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  darkApiOptionTitle: {
    color: '#f5f5f5',
  },
  apiOptionDescription: {
    fontSize: 14,
    color: '#777',
  },
  darkApiOptionDescription: {
    color: '#aaa',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkRadioButton: {
    borderColor: '#444',
  },
  radioButtonSelected: {
    borderColor: '#4a6ea9',
  },
  darkRadioButtonSelected: {
    borderColor: '#6889c4',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4a6ea9',
  },
  aboutItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutItemText: {
    fontSize: 16,
    color: '#4a6ea9',
  },
  darkAboutItemText: {
    color: '#6889c4',
  },
  versionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  darkVersionText: {
    color: '#ddd',
  },
  buildText: {
    fontSize: 14,
    color: '#777',
  },
  darkBuildText: {
    color: '#999',
  },
});

export default SettingsScreen;