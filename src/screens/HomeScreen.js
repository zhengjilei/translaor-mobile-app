import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isOfflineModeEnabled, getDownloadedLanguages } from '../services/offlineService';

const HomeScreen = ({ navigation }) => {
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [downloadedLanguages, setDownloadedLanguages] = useState([]);
  
  useEffect(() => {
    // Check if offline mode is enabled and get downloaded languages
    const checkOfflineStatus = async () => {
      const offlineStatus = await isOfflineModeEnabled();
      setOfflineEnabled(offlineStatus);
      
      if (offlineStatus) {
        const languages = await getDownloadedLanguages();
        setDownloadedLanguages(languages);
      }
    };
    
    checkOfflineStatus();
    
    // Refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', checkOfflineStatus);
    return unsubscribe;
  }, [navigation]);
  
  // Show offline mode warning if traveling without downloaded languages
  const showOfflineWarning = () => {
    if (!offlineEnabled || downloadedLanguages.length === 0) {
      Alert.alert(
        'Offline Mode Recommended',
        'For the best experience while traveling, we recommend downloading language packs for offline use. This helps you avoid connectivity issues and data charges.',
        [
          { text: 'Later' },
          { 
            text: 'Download Now', 
            onPress: () => navigation.navigate('Settings', { showOfflineSection: true }) 
          }
        ]
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Universal Translator</Text>
          <Text style={styles.subtitle}>Break language barriers anywhere, anytime</Text>
        </View>
        
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/150' }} 
            style={styles.logo}
            resizeMode="contain"
          />
          
          {offlineEnabled && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={16} color="white" />
              <Text style={styles.offlineBadgeText}>
                {downloadedLanguages.length} Languages Available Offline
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.featureSection}>
          <Text style={styles.sectionTitle}>Translation Tools</Text>
          
          <View style={styles.featureGrid}>
            <TouchableOpacity 
              style={styles.featureButton} 
              onPress={() => navigation.navigate('Translate')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#4a6ea9' }]}>
                <Ionicons name="text" size={24} color="white" />
              </View>
              <Text style={styles.featureButtonText}>Text Translation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureButton} 
              onPress={() => navigation.navigate('Conversation')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#5e8ad4' }]}>
                <Ionicons name="chatbubbles" size={24} color="white" />
              </View>
              <Text style={styles.featureButtonText}>Conversation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureButton} 
              onPress={() => navigation.navigate('CameraTranslate')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#72a6ff' }]}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
              <Text style={styles.featureButtonText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.featureButton} 
              onPress={() => navigation.navigate('Phrasebook')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#3d5a8a' }]}>
                <Ionicons name="bookmark" size={24} color="white" />
              </View>
              <Text style={styles.featureButtonText}>Phrasebook</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              showOfflineWarning();
              navigation.navigate('Translate');
            }}
          >
            <Ionicons name="language" size={18} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start Translating</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity 
              style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]} 
              onPress={() => navigation.navigate('History')}
            >
              <Ionicons name="time" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, { flex: 1, marginLeft: 8 }]} 
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    position: 'relative',
  },
  logo: {
    width: 150,
    height: 150,
  },
  offlineBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#4a6ea9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  offlineBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  featureSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#4a6ea9',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: '#5e8ad4',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;