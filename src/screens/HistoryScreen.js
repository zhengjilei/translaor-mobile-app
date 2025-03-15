import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  SafeAreaView 
} from 'react-native';
import { getHistory, clearHistory } from '../services/historyService';

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load history when component mounts
  useEffect(() => {
    loadHistory();
    
    // Refresh history when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Load translation history
  const loadHistory = async () => {
    try {
      const historyData = await getHistory();
      setHistory(historyData.reverse()); // Show most recent first
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Clear all history after confirmation
  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all translation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              setHistory([]);
            } catch (error) {
              console.error('Failed to clear history:', error);
            }
          }
        },
      ]
    );
  };
  
  // Render a history item
  const renderHistoryItem = ({ item }) => {
    const sourceLang = item.sourceLanguage.toUpperCase();
    const targetLang = item.targetLanguage.toUpperCase();
    
    return (
      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => {
          navigation.navigate('Translate', {
            sourceText: item.sourceText,
            translatedText: item.translatedText,
            sourceLanguage: item.sourceLanguage,
            targetLanguage: item.targetLanguage
          });
        }}
      >
        <View style={styles.historyHeader}>
          <Text style={styles.languageInfo}>{sourceLang} → {targetLang}</Text>
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>
        
        <View style={styles.translationContainer}>
          <Text style={styles.sourceText} numberOfLines={1}>{item.sourceText}</Text>
          <Text style={styles.translatedText} numberOfLines={1}>{item.translatedText}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Translation History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.centerContent}>
          <Text>Loading history...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No translation history yet</Text>
          <TouchableOpacity 
            style={styles.translateButton}
            onPress={() => navigation.navigate('Translate')}
          >
            <Text style={styles.translateButtonText}>Start Translating</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => `history-${index}`}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#4a6ea9',
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  translateButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  languageInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6ea9',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  translationContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#4a6ea9',
    paddingLeft: 10,
  },
  sourceText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  translatedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default HistoryScreen;