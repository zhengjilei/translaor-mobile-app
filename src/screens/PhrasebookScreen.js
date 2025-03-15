import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getPhrasebook, 
  getDefaultCategories, 
  saveToPhrasebook, 
  deletePhraseFromPhrasebook, 
  searchPhrasebook
} from '../services/phrasebookService';
import { getTranslationContexts, getContextPhrases } from '../services/translationService';

const PhrasebookScreen = ({ navigation, route }) => {
  const [phrases, setPhrases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Load phrases when component mounts or is focused
  useEffect(() => {
    loadPhrases();
    
    // Refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadPhrases();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Load all phrases and categories
  const loadPhrases = async () => {
    try {
      setLoading(true);
      
      // Get all phrases
      const savedPhrases = await getPhrasebook();
      setPhrases(savedPhrases);
      
      // Get default categories
      const defaultCategories = getDefaultCategories();
      setCategories(defaultCategories);
      
      // Check if we need to add common phrases
      if (savedPhrases.length === 0) {
        addCommonPhrases();
      }
    } catch (error) {
      console.error('Failed to load phrasebook:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Add common phrases for first-time users
  const addCommonPhrases = async () => {
    try {
      // Get default contexts (restaurant, transportation, etc.)
      const contexts = getTranslationContexts();
      
      // For each context, add some common phrases
      for (const context of contexts) {
        const phrases = getContextPhrases(context.id);
        
        // Add each phrase to phrasebook
        for (const phrase of phrases) {
          await saveToPhrasebook({
            sourceText: phrase,
            translatedText: '', // Would be translated in a real app
            sourceLanguage: 'en',
            targetLanguage: 'es', // Default target language
            categoryId: context.id,
            contextType: 'common',
            isFavorite: false
          });
        }
      }
      
      // Reload phrases
      loadPhrases();
    } catch (error) {
      console.error('Failed to add common phrases:', error);
    }
  };
  
  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query) {
      // If query is empty, load all phrases
      loadPhrases();
      return;
    }
    
    try {
      const results = await searchPhrasebook(query);
      setPhrases(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  // Filter phrases by selected category
  const filteredPhrases = selectedCategory === 'all' 
    ? phrases 
    : phrases.filter(phrase => phrase.categoryId === selectedCategory);
  
  // Group phrases by category for section list
  const getPhraseSections = () => {
    if (selectedCategory !== 'all') {
      // If a specific category is selected, just show those phrases
      return [{
        title: categories.find(cat => cat.id === selectedCategory)?.name || 'Phrases',
        data: filteredPhrases
      }];
    }
    
    // Otherwise group by category
    const sections = categories.map(category => {
      return {
        title: category.name,
        id: category.id,
        icon: category.icon,
        data: phrases.filter(phrase => phrase.categoryId === category.id)
      };
    });
    
    // Only include sections with data
    return sections.filter(section => section.data.length > 0);
  };
  
  // Handle deleting a phrase
  const handleDeletePhrase = (phraseId) => {
    Alert.alert(
      'Delete Phrase',
      'Are you sure you want to delete this phrase?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhraseFromPhrasebook(phraseId);
              // Update the displayed phrases
              setPhrases(phrases.filter(phrase => phrase.id !== phraseId));
            } catch (error) {
              console.error('Failed to delete phrase:', error);
              Alert.alert('Error', 'Failed to delete phrase');
            }
          }
        },
      ]
    );
  };
  
  // Handle using a phrase in translation
  const handleUsePhrase = (phrase) => {
    navigation.navigate('Translate', {
      sourceText: phrase.sourceText,
      sourceLanguage: phrase.sourceLanguage,
      targetLanguage: phrase.targetLanguage
    });
  };
  
  // Render a category pill
  const renderCategoryPill = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategory === item.id && styles.selectedCategory
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      {item.icon && (
        <Ionicons 
          name={item.icon} 
          size={16} 
          color={selectedCategory === item.id ? 'white' : '#4a6ea9'} 
          style={styles.categoryIcon}
        />
      )}
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  // Render a phrase item
  const renderPhraseItem = ({ item }) => (
    <View style={styles.phraseItem}>
      <View style={styles.phraseContent}>
        <Text style={styles.sourceText}>{item.sourceText}</Text>
        {item.translatedText ? (
          <Text style={styles.translatedText}>{item.translatedText}</Text>
        ) : (
          <Text style={styles.untranslatedText}>Not translated yet</Text>
        )}
      </View>
      
      <View style={styles.phraseActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUsePhrase(item)}
        >
          <Ionicons name="arrow-forward-circle" size={20} color="#4a6ea9" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeletePhrase(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render a section header
  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        {section.icon && (
          <Ionicons 
            name={section.icon} 
            size={18} 
            color="#4a6ea9" 
            style={styles.sectionIcon}
          />
        )}
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      <Text style={styles.sectionCount}>{section.data.length} phrases</Text>
    </View>
  );
  
  // Render list empty state
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No phrases found' : 'Your phrasebook is empty'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'Try a different search term'
          : 'Add phrases from translations to save them for quick access while traveling'}
      </Text>
      
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('Translate')}
        >
          <Text style={styles.addButtonText}>Start Translating</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search phrases..."
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>
      
      {/* Category Pills */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={[{ id: 'all', name: 'All' }, ...categories]}
          renderItem={renderCategoryPill}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      {/* Phrases List */}
      {loading ? (
        <View style={styles.centerContent}>
          <Text>Loading phrasebook...</Text>
        </View>
      ) : (
        <SectionList
          sections={getPhraseSections()}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderPhraseItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={
            filteredPhrases.length === 0 ? { flex: 1 } : styles.listContainer
          }
        />
      )}
      
      {/* Add button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('Translate')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategory: {
    backgroundColor: '#4a6ea9',
    borderColor: '#4a6ea9',
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: 'white',
  },
  listContainer: {
    paddingBottom: 80, // Space for the floating button
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#999',
  },
  phraseItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  phraseContent: {
    flex: 1,
  },
  sourceText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  translatedText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  untranslatedText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  phraseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a6ea9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default PhrasebookScreen;