import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Switch,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  isOfflineModeEnabled, 
  setOfflineMode, 
  getDownloadedLanguages, 
  downloadLanguagePack, 
  deleteLanguagePack,
  getTotalStorageUsed,
  LANGUAGE_PACK_SIZES
} from '../services/offlineService';
import { getSupportedLanguages } from '../services/translationService';

const LanguagePacksScreen = ({ navigation, route }) => {
  const { highlightLanguage } = route.params || {};
  const [offlineMode, setOfflineModeState] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [downloadedLanguages, setDownloadedLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [storageUsed, setStorageUsed] = useState(0);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('standard');
  
  // Load data when component mounts
  useEffect(() => {
    loadData();
    
    // Refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Load languages and settings
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if offline mode is enabled
      const offline = await isOfflineModeEnabled();
      setOfflineModeState(offline);
      
      // Get supported languages
      const supportedLanguages = await getSupportedLanguages();
      
      // Get downloaded languages
      const downloaded = await getDownloadedLanguages();
      setDownloadedLanguages(downloaded);
      
      // Combine languages and downloaded status
      const languagesWithStatus = supportedLanguages.map(lang => {
        const downloadedLang = downloaded.find(dl => dl.code === lang.code);
        return {
          ...lang,
          isDownloaded: Boolean(downloadedLang),
          downloadedSize: downloadedLang?.size || 0,
          quality: downloadedLang?.quality || 'standard',
          features: downloadedLang?.features || [],
          downloadDate: downloadedLang?.downloaded
        };
      });
      
      setLanguages(languagesWithStatus);
      
      // Get total storage used
      const totalStorage = await getTotalStorageUsed();
      setStorageUsed(totalStorage);
      
      // If highlightLanguage is provided, scroll to that language
      if (highlightLanguage) {
        // Would implement scrolling to the highlighted language here
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle offline mode
  const toggleOfflineMode = async (value) => {
    try {
      await setOfflineMode(value);
      setOfflineModeState(value);
      
      if (value && downloadedLanguages.length === 0) {
        Alert.alert(
          'Download Language Packs',
          'You need to download language packs to use offline mode effectively.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to toggle offline mode:', error);
    }
  };
  
  // Start downloading a language pack
  const handleDownload = (language) => {
    setSelectedLanguage(language);
    setShowQualityModal(true);
  };
  
  // Download with selected quality
  const downloadWithQuality = async () => {
    if (!selectedLanguage) return;
    
    setShowQualityModal(false);
    
    try {
      setDownloading(selectedLanguage.code);
      
      // Start download
      await downloadLanguagePack(
        selectedLanguage.code,
        selectedLanguage.name,
        selectedQuality
      );
      
      // Refresh data
      await loadData();
      
      Alert.alert(
        'Download Complete',
        `${selectedLanguage.name} language pack has been downloaded for offline use.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to download language pack:', error);
      Alert.alert('Error', `Failed to download language pack: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };
  
  // Delete a language pack
  const handleDelete = (language) => {
    Alert.alert(
      'Delete Language Pack',
      `Are you sure you want to delete the ${language.name} language pack?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLanguagePack(language.code);
              // Refresh data
              await loadData();
            } catch (error) {
              console.error('Failed to delete language pack:', error);
              Alert.alert('Error', 'Failed to delete language pack');
            }
          }
        },
      ]
    );
  };
  
  // Render a language item
  const renderLanguageItem = ({ item }) => {
    const isCurrentlyDownloading = downloading === item.code;
    
    return (
      <View style={[
        styles.languageItem,
        item.code === highlightLanguage && styles.highlightedLanguage
      ]}>
        <View style={styles.languageInfo}>
          <View style={styles.languageHeader}>
            <Text style={styles.languageName}>{item.name}</Text>
            {item.isDownloaded && (
              <View style={styles.downloadedBadge}>
                <Ionicons name="cloud-offline" size={12} color="white" />
                <Text style={styles.downloadedBadgeText}>Downloaded</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.languageCode}>{item.code.toUpperCase()}</Text>
          
          {item.isDownloaded && (
            <View style={styles.languageDetails}>
              <Text style={styles.qualityText}>
                Quality: {item.quality.charAt(0).toUpperCase() + item.quality.slice(1)}
              </Text>
              <Text style={styles.sizeText}>
                Size: {item.downloadedSize} MB
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.languageActions}>
          {isCurrentlyDownloading ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="small" color="#4a6ea9" />
              <Text style={styles.downloadingText}>Downloading...</Text>
            </View>
          ) : item.isDownloaded ? (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#ff3b30" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => handleDownload(item)}
            >
              <Ionicons name="cloud-download-outline" size={18} color="#4a6ea9" />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  // Render quality selection modal
  const renderQualityModal = () => (
    <Modal
      visible={showQualityModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Download {selectedLanguage?.name} Language Pack
            </Text>
            <TouchableOpacity
              onPress={() => setShowQualityModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            Select the quality level of the language pack. Higher quality packs provide better translations but use more storage space.
          </Text>
          
          <ScrollView style={styles.qualityOptions}>
            {['basic', 'standard', 'premium'].map(quality => (
              <TouchableOpacity 
                key={quality}
                style={[
                  styles.qualityOption,
                  selectedQuality === quality && styles.selectedQualityOption
                ]}
                onPress={() => setSelectedQuality(quality)}
              >
                <View style={styles.qualityHeader}>
                  <Text style={[
                    styles.qualityName,
                    selectedQuality === quality && styles.selectedQualityText
                  ]}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Text>
                  <Text style={styles.qualitySize}>
                    {LANGUAGE_PACK_SIZES[quality].size} MB
                  </Text>
                </View>
                
                <View style={styles.featuresList}>
                  {LANGUAGE_PACK_SIZES[quality].features.map(feature => (
                    <View key={feature} style={styles.featureItem}>
                      <Ionicons name="checkmark" size={14} color="#4CAF50" />
                      <Text style={styles.featureText}>
                        {feature.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.downloadActionButton}
            onPress={downloadWithQuality}
          >
            <Text style={styles.downloadActionButtonText}>
              Download ({LANGUAGE_PACK_SIZES[selectedQuality].size} MB)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.offlineModeContainer}>
          <Text style={styles.offlineModeTitle}>Offline Mode</Text>
          <Text style={styles.offlineModeDescription}>
            Download language packs to use translation without internet
          </Text>
          <Switch
            value={offlineMode}
            onValueChange={toggleOfflineMode}
            trackColor={{ false: '#d3d3d3', true: '#c6d8f6' }}
            thumbColor={offlineMode ? '#4a6ea9' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.storageContainer}>
          <Text style={styles.storageTitle}>
            Storage Used: {storageUsed} MB
          </Text>
          <View style={styles.storageBarContainer}>
            <View 
              style={[
                styles.storageBar, 
                { width: `${Math.min(100, (storageUsed / 100) * 100)}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      
      {/* Languages List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4a6ea9" />
          <Text style={{ marginTop: 10 }}>Loading languages...</Text>
        </View>
      ) : (
        <FlatList
          data={languages}
          renderItem={renderLanguageItem}
          keyExtractor={item => item.code}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Available Languages</Text>
          }
        />
      )}
      
      {/* Quality selection modal */}
      {renderQualityModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  offlineModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  offlineModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  offlineModeDescription: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginHorizontal: 10,
  },
  storageContainer: {
    marginBottom: 10,
  },
  storageTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  storageBarContainer: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageBar: {
    height: '100%',
    backgroundColor: '#4a6ea9',
  },
  list: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  languageItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  highlightedLanguage: {
    borderColor: '#4a6ea9',
    borderWidth: 2,
    backgroundColor: '#f5f8ff',
  },
  languageInfo: {
    flex: 1,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  downloadedBadgeText: {
    fontSize: 10,
    color: 'white',
    marginLeft: 4,
  },
  languageCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  languageDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  qualityText: {
    fontSize: 12,
    color: '#999',
    marginRight: 10,
  },
  sizeText: {
    fontSize: 12,
    color: '#999',
  },
  languageActions: {
    justifyContent: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f8ff',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#4a6ea9',
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#4a6ea9',
    marginLeft: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#ff3b30',
    marginLeft: 5,
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadingText: {
    fontSize: 14,
    color: '#4a6ea9',
    marginLeft: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  qualityOptions: {
    maxHeight: 300,
  },
  qualityOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedQualityOption: {
    borderColor: '#4a6ea9',
    backgroundColor: '#f5f8ff',
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qualityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedQualityText: {
    color: '#4a6ea9',
  },
  qualitySize: {
    fontSize: 14,
    color: '#666',
  },
  featuresList: {
    marginTop: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  downloadActionButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  downloadActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LanguagePacksScreen;