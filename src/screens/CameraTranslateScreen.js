import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  recognizeTextFromImage, 
  translateImageText, 
  processImageWithOverlay
} from '../services/cameraTranslationService';
import { getSupportedLanguages } from '../services/translationService';
import { isOfflineModeEnabled, isLanguageDownloaded } from '../services/offlineService';
import LanguageSelector from '../components/LanguageSelector';

const CameraTranslateScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [languages, setLanguages] = useState([]);
  const [mode, setMode] = useState('translate'); // 'translate' or 'overlay'
  const [mockType, setMockType] = useState('menu'); // For demo: 'menu', 'sign', 'document'
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Request camera permissions and load languages when component mounts
  useEffect(() => {
    (async () => {
      // Request camera permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Camera Permission Required',
            'This app needs camera permission to translate using your camera.'
          );
        }
      }
      
      // Load supported languages
      const supportedLanguages = await getSupportedLanguages();
      const languageOptions = [
        { label: 'Auto Detect', value: 'auto' },
        ...supportedLanguages.map(lang => ({ label: lang.name, value: lang.code }))
      ];
      setLanguages(languageOptions);
      
      // Check if offline mode is enabled
      const offline = await isOfflineModeEnabled();
      setOfflineMode(offline);
    })();
  }, []);
  
  // Take photo with camera
  const takePicture = async () => {
    try {
      setTranslatedText('');
      setRecognizedText('');
      setBoundingBoxes([]);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };
  
  // Select photo from gallery
  const pickImage = async () => {
    try {
      setTranslatedText('');
      setRecognizedText('');
      setBoundingBoxes([]);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to load image');
    }
  };
  
  // Process image for translation
  const processImage = async (uri) => {
    try {
      setAnalyzing(true);
      
      // Check if required languages are downloaded for offline mode
      if (offlineMode) {
        if (sourceLanguage !== 'auto') {
          const isSourceAvailable = await isLanguageDownloaded(sourceLanguage);
          if (!isSourceAvailable) {
            Alert.alert(
              'Language Pack Required',
              `The ${languages.find(l => l.value === sourceLanguage)?.label || sourceLanguage} language pack is required for offline translation.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Download Now', 
                  onPress: () => navigation.navigate('LanguagePacks', { highlightLanguage: sourceLanguage }) 
                }
              ]
            );
            setAnalyzing(false);
            return;
          }
        }
        
        const isTargetAvailable = await isLanguageDownloaded(targetLanguage);
        if (!isTargetAvailable) {
          Alert.alert(
            'Language Pack Required',
            `The ${languages.find(l => l.value === targetLanguage)?.label || targetLanguage} language pack is required for offline translation.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Download Now', 
                onPress: () => navigation.navigate('LanguagePacks', { highlightLanguage: targetLanguage }) 
              }
            ]
          );
          setAnalyzing(false);
          return;
        }
      }
      
      // Process based on selected mode
      if (mode === 'overlay') {
        // Process image with overlay translation
        const result = await processImageWithOverlay(
          uri,
          sourceLanguage === 'auto' ? null : sourceLanguage,
          targetLanguage,
          { mockType: mockType }
        );
        
        setRecognizedText(result.recognizedText);
        setTranslatedText(result.translatedText);
        setBoundingBoxes(result.boundingBoxes);
        
        // Set detected language if auto was selected
        if (sourceLanguage === 'auto') {
          setSourceLanguage(result.sourceLanguage);
        }
      } else {
        // Process image for text translation
        const recognitionResult = await recognizeTextFromImage(
          uri,
          { 
            languageHint: sourceLanguage === 'auto' ? null : sourceLanguage,
            mockType: mockType
          }
        );
        
        setRecognizedText(recognitionResult.text);
        
        // If we auto-detected the language, set it
        if (sourceLanguage === 'auto') {
          setSourceLanguage(recognitionResult.languageDetected);
        }
        
        // Translate the recognized text
        const translationResult = await translateImageText(
          recognitionResult.text,
          recognitionResult.languageDetected,
          targetLanguage
        );
        
        setTranslatedText(translationResult.translatedText);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', error.message || 'Failed to process image');
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Toggle between translation modes
  const toggleMode = () => {
    setMode(mode === 'translate' ? 'overlay' : 'translate');
    // Re-process the image if we have one
    if (imageUri) {
      processImage(imageUri);
    }
  };
  
  // Toggle between mock types (for demo purposes)
  const toggleMockType = () => {
    const types = ['menu', 'sign', 'document'];
    const currentIndex = types.indexOf(mockType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMockType(types[nextIndex]);
    
    // Re-process the image if we have one
    if (imageUri) {
      processImage(imageUri);
    }
  };
  
  // Render translation overlay
  const renderOverlay = () => {
    if (!boundingBoxes.length) return null;
    
    return boundingBoxes.map((box, index) => (
      <View
        key={`box-${index}`}
        style={{
          position: 'absolute',
          left: box.x,
          top: box.y,
          width: box.width,
          backgroundColor: 'rgba(74, 110, 169, 0.7)',
          padding: 5,
          borderRadius: 2,
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>
          {translatedText.split('\n')[box.lineIndex] || ''}
        </Text>
      </View>
    ));
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Camera Preview / Image Container */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            {mode === 'overlay' && renderOverlay()}
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="camera" size={80} color="#ccc" />
            <Text style={styles.placeholderText}>
              Take a photo or select an image to translate
            </Text>
          </View>
        )}
      </View>
      
      {/* Language Selector and Controls */}
      <View style={styles.controlsContainer}>
        {/* Mock type toggle (for demo purposes) */}
        <TouchableOpacity 
          style={styles.mockTypeButton} 
          onPress={toggleMockType}
        >
          <Text style={styles.mockTypeText}>
            Demo: {mockType.charAt(0).toUpperCase() + mockType.slice(1)}
          </Text>
        </TouchableOpacity>
        
        {/* Language Selection */}
        <View style={styles.languageSelection}>
          <View style={styles.languageContainer}>
            <Text style={styles.label}>From:</Text>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => {
                // Show language picker or navigate to language selection screen
                // Simplified for demo
                Alert.alert('Select Source Language', 'This would show a language picker');
              }}
            >
              <Text style={styles.languageButtonText}>
                {languages.find(l => l.value === sourceLanguage)?.label || 'Auto Detect'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#4a6ea9" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={() => {
              if (sourceLanguage !== 'auto') {
                const tempLang = sourceLanguage;
                setSourceLanguage(targetLanguage);
                setTargetLanguage(tempLang);
                
                // Reprocess image if available
                if (imageUri && recognizedText) {
                  processImage(imageUri);
                }
              }
            }}
          >
            <Text style={styles.swapButtonText}>⇄</Text>
          </TouchableOpacity>
          
          <View style={styles.languageContainer}>
            <Text style={styles.label}>To:</Text>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => {
                // Show language picker or navigate to language selection screen
                // Simplified for demo
                Alert.alert('Select Target Language', 'This would show a language picker');
              }}
            >
              <Text style={styles.languageButtonText}>
                {languages.find(l => l.value === targetLanguage)?.label || 'English'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#4a6ea9" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Camera Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={takePicture}
            disabled={analyzing}
          >
            <Ionicons name="camera" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={pickImage}
            disabled={analyzing}
          >
            <Ionicons name="images" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'overlay' && styles.modeButtonActive]}
            onPress={toggleMode}
            disabled={analyzing}
          >
            <Ionicons 
              name={mode === 'overlay' ? 'eye' : 'document-text'} 
              size={24} 
              color={mode === 'overlay' ? 'white' : '#4a6ea9'} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Loading indicator */}
      {analyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4a6ea9" />
          <Text style={styles.loadingText}>Analyzing image...</Text>
        </View>
      )}
      
      {/* Text Translation Results */}
      {mode === 'translate' && imageUri && (
        <ScrollView style={styles.resultsContainer}>
          {recognizedText ? (
            <>
              <View style={styles.textSection}>
                <Text style={styles.sectionTitle}>Recognized Text:</Text>
                <View style={styles.textBox}>
                  <Text style={styles.recognizedText}>{recognizedText}</Text>
                </View>
              </View>
              
              <View style={styles.textSection}>
                <Text style={styles.sectionTitle}>Translation:</Text>
                <View style={styles.textBox}>
                  <Text style={styles.translatedText}>{translatedText}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.centerContent}>
              <Text>No text recognized</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  placeholderText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  controlsContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  mockTypeButton: {
    position: 'absolute',
    top: -30,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    zIndex: 10,
  },
  mockTypeText: {
    color: 'white',
    fontSize: 12,
  },
  languageSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  languageContainer: {
    width: '40%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  languageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  languageButtonText: {
    fontSize: 14,
    color: '#333',
  },
  swapButton: {
    backgroundColor: '#4a6ea9',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  swapButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#4a6ea9',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  galleryButton: {
    backgroundColor: '#5e8ad4',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modeButton: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a6ea9',
  },
  modeButtonActive: {
    backgroundColor: '#4a6ea9',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 16,
    maxHeight: '40%',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  recognizedText: {
    fontSize: 14,
    color: '#333',
  },
  translatedText: {
    fontSize: 14,
    color: '#333',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default CameraTranslateScreen;