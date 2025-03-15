import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Linking 
} from 'react-native';
import { getSettings, updateSettings } from '../services/settingsService';

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
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
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
  };
  
  // Save settings
  const saveSettings = async (updatedSettings) => {
    try {
      await updateSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
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
  };
  
  // Open privacy policy
  const openPrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy-policy');
  };
  
  // Open terms of service
  const openTermsOfService = () => {
    Linking.openURL('https://example.com/terms-of-service');
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingText}>Save Translation History</Text>
            <Text style={styles.settingDescription}>
              Store your previous translations
            </Text>
          </View>
          <Switch
            value={settings.saveHistory}
            onValueChange={() => handleToggleSetting('saveHistory')}
            trackColor={{ false: '#d3d3d3', true: '#c6d8f6' }}
            thumbColor={settings.saveHistory ? '#4a6ea9' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingText}>Auto-Translate</Text>
            <Text style={styles.settingDescription}>
              Translate text as you type
            </Text>
          </View>
          <Switch
            value={settings.autoTranslate}
            onValueChange={() => handleToggleSetting('autoTranslate')}
            trackColor={{ false: '#d3d3d3', true: '#c6d8f6' }}
            thumbColor={settings.autoTranslate ? '#4a6ea9' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingText}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Use dark color theme
            </Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={() => handleToggleSetting('darkMode')}
            trackColor={{ false: '#d3d3d3', true: '#c6d8f6' }}
            thumbColor={settings.darkMode ? '#4a6ea9' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translation API</Text>
        
        <TouchableOpacity 
          style={[
            styles.apiOption,
            settings.useFreeApi && styles.selectedApiOption
          ]}
          onPress={() => handleApiSelection(true)}
        >
          <View>
            <Text style={styles.apiOptionTitle}>Free API</Text>
            <Text style={styles.apiOptionDescription}>
              Basic translation with limited languages
            </Text>
          </View>
          <View style={[
            styles.radioButton,
            settings.useFreeApi && styles.radioButtonSelected
          ]}>
            {settings.useFreeApi && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.apiOption,
            !settings.useFreeApi && styles.selectedApiOption
          ]}
          onPress={() => handleApiSelection(false)}
        >
          <View>
            <Text style={styles.apiOptionTitle}>Premium API</Text>
            <Text style={styles.apiOptionDescription}>
              Advanced translation with more languages and features
            </Text>
          </View>
          <View style={[
            styles.radioButton,
            !settings.useFreeApi && styles.radioButtonSelected
          ]}>
            {!settings.useFreeApi && <View style={styles.radioButtonInner} />}
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity 
          style={styles.aboutItem}
          onPress={openPrivacyPolicy}
        >
          <Text style={styles.aboutItemText}>Privacy Policy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.aboutItem}
          onPress={openTermsOfService}
        >
          <Text style={styles.aboutItemText}>Terms of Service</Text>
        </TouchableOpacity>
        
        <View style={styles.aboutItem}>
          <Text style={styles.aboutItemText}>Version 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  apiOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  selectedApiOption: {
    borderColor: '#4a6ea9',
    backgroundColor: '#f5f8ff',
  },
  apiOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  apiOptionDescription: {
    fontSize: 12,
    color: '#999',
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#4a6ea9',
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#4a6ea9',
  },
  aboutItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SettingsScreen;