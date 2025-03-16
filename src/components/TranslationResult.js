import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TranslationResult = ({ 
  translatedText, 
  sourceLanguage, 
  targetLanguage,
  isOfflineMessage
}) => {
  // Share the translation
  const handleShare = async () => {
    try {
      await Share.share({
        message: translatedText,
        title: `Translation from ${sourceLanguage.toUpperCase()} to ${targetLanguage.toUpperCase()}`
      });
    } catch (error) {
      console.error('Error sharing translation:', error);
    }
  };
  
  // Copy to clipboard functionality would be added here
  const handleCopy = () => {
    // Using Clipboard API would go here
    // In a real app we would use Clipboard.setString(translatedText)
    alert('Text copied to clipboard');
  };
  
  if (!translatedText) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Translation:</Text>
      <View style={[
        styles.translationBox,
        isOfflineMessage && styles.offlineMessageBox
      ]}>
        {isOfflineMessage ? (
          <>
            <Ionicons name="alert-circle-outline" size={24} color="#ff8c00" style={styles.warningIcon} />
            <Text style={styles.offlineMessage}>{translatedText}</Text>
          </>
        ) : (
          <Text style={styles.translatedText}>{translatedText}</Text>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        {!isOfflineMessage && (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCopy}
            >
              <Ionicons name="copy-outline" size={20} color="#4a6ea9" />
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#4a6ea9" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  translationBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  offlineMessageBox: {
    backgroundColor: '#fff8e8',
    borderColor: '#ffcc80',
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  offlineMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#e67e00',
    flex: 1,
  },
  warningIcon: {
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    color: '#4a6ea9',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TranslationResult;