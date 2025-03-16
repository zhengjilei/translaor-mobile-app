// PhrasebookScreen component - Manages saved phrases
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  Animated,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPhrasebook, 
  getDefaultCategories, 
  saveToPhrasebook, 
  deletePhraseFromPhrasebook, 
  searchPhrasebook,
  getCategories,
  getCurrentLanguagePair,
  switchLanguagePair
} from '../services/phrasebookService';
import { getTranslationContexts, getContextPhrases } from '../services/translationService';

const PhrasebookScreen = ({ navigation, route }) => {
  const [phrases, setPhrases] = useState([]);
  const [filteredPhrases, setFilteredPhrases] = useState([]);
  const [groupedPhrases, setGroupedPhrases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [displayInSourceLanguage, setDisplayInSourceLanguage] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [showSwitchNotification, setShowSwitchNotification] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [phraseToDelete, setPhraseToDelete] = useState(null);
  const itemRefs = useRef({});
  const [openedRowId, setOpenedRowId] = useState(null);
  
  // Available language pairs for quick switching
  const languagePairs = [
    { source: 'en', target: 'es', sourceName: 'English', targetName: 'Spanish' },
    { source: 'en', target: 'fr', sourceName: 'English', targetName: 'French' },
    { source: 'en', target: 'de', sourceName: 'English', targetName: 'German' },
    { source: 'en', target: 'zh', sourceName: 'English', targetName: 'Chinese' },
  ];
  
  // Load phrasebook data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadPhrasebook();
      loadCategories();
      loadLanguagePair();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const loadPhrasebook = async () => {
    setLoading(true);
    try {
      const data = await getPhrasebook();
      setPhrases(data);
      applyFilters(data, selectedCategory, searchQuery);
    } catch (error) {
      console.error('Error loading phrasebook:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadLanguagePair = async () => {
    try {
      const { sourceLang, targetLang } = await getCurrentLanguagePair();
      setSourceLanguage(sourceLang);
      setTargetLanguage(targetLang);
    } catch (error) {
      console.error('Error loading language pair:', error);
    }
  };
  
  const getCurrentLanguagePairDisplay = () => {
    return displayInSourceLanguage ? getLanguageName(sourceLanguage) : getLanguageName(targetLanguage);
  };
  
  const getLanguageName = (code) => {
    const languages = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ru: 'Russian',
    };
    return languages[code] || code;
  };
  
  const toggleDisplayLanguage = () => {
    setDisplayInSourceLanguage(!displayInSourceLanguage);
    showLanguageSwitchNotification();
  };

  // Apply filters based on category and search query
  const applyFilters = (allPhrases, category, query) => {
    let result = [...allPhrases];
    
    // Apply category filter
    if (category && category !== 'All') {
      result = result.filter(phrase => phrase.category === category);
    }
    
    // Apply search filter
    if (query) {
      const queryLower = query.toLowerCase();
      result = result.filter(phrase =>
        phrase.sourceText.toLowerCase().includes(queryLower) ||
        (phrase.targetText && phrase.targetText.toLowerCase().includes(queryLower))
      );
    }
    
    setFilteredPhrases(result);
    
    // Group by category
    const grouped = groupByCategory(result);
    setGroupedPhrases(grouped);
  };
  
  const groupByCategory = (phrases) => {
    const groups = {};
    
    phrases.forEach(phrase => {
      const category = phrase.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = {
          title: category,
          data: []
        };
      }
      groups[category].data.push(phrase);
    });
    
    // Convert to array and sort
    return Object.values(groups).sort((a, b) => {
      if (a.title === 'Favorites') return -1;
      if (b.title === 'Favorites') return 1;
      return a.title.localeCompare(b.title);
    });
  };
  
  // Handle search input
  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(phrases, selectedCategory, text);
  };
  
  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    applyFilters(phrases, category, searchQuery);
  };
  
  // Memoized category pill component for better performance
  const CategoryPill = memo(({ item, selectedCategory, onSelect, getCategoryIcon }) => {
    const categoryId = item.id;
    const categoryName = item.name;
    return (
      <TouchableOpacity
        style={[
          styles.categoryPill,
          selectedCategory === categoryId && styles.selectedCategory,
        ]}
        onPress={() => onSelect(categoryId)}
      >
        <Ionicons
          name={getCategoryIcon(categoryName)}
          size={16}
          color={selectedCategory === categoryId ? 'white' : '#666'}
          style={styles.categoryIcon}
        />
        <Text
          style={[
            styles.categoryText,
            selectedCategory === categoryId && styles.selectedCategoryText,
          ]}
        >
          {categoryName}
        </Text>
      </TouchableOpacity>
    );
  });
  
  // Handle delete phrase
  const confirmDelete = (phrase) => {
    setPhraseToDelete(phrase);
    setShowDeleteModal(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptics not available');
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!phraseToDelete) return;
    
    try {
      await deletePhraseFromPhrasebook(phraseToDelete.id);
      setPhrases(prevPhrases => 
        prevPhrases.filter(p => p.id !== phraseToDelete.id)
      );
      applyFilters(
        phrases.filter(p => p.id !== phraseToDelete.id),
        selectedCategory,
        searchQuery
      );
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.warn('Haptics not available');
      }
    } catch (error) {
      console.error('Error deleting phrase:', error);
    } finally {
      setShowDeleteModal(false);
      setPhraseToDelete(null);
    }
  };
  
  const showLanguageSwitchNotification = () => {
    setShowSwitchNotification(true);
    
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Fade out after delay
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setShowSwitchNotification(false);
      });
    }, 2000);
  };
  
  // Swipeable right actions (delete)
  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => confirmDelete(item)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };
  
  const onSwipeOpen = (id) => {
    setOpenedRowId(id);
    
    // Close any other open rows
    Object.keys(itemRefs.current).forEach(key => {
      if (key !== id && itemRefs.current[key]) {
        itemRefs.current[key].close();
      }
    });
  };
  
  // Empty state component
  const EmptyState = ({ searchQuery, selectedCategory, navigation }) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={64} color="#4a6ea9" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No phrases found' : 'Your phrasebook is empty'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `No phrases match "${searchQuery}"${
              selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''
            }`
          : 'Start adding phrases to your phrasebook for quick access during your travels'}
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Translate')}
      >
        <Text style={styles.addButtonText}>Add Your First Phrase</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Function to get icon name based on category
  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'all':
        return 'apps';
      case 'greetings':
        return 'hand-left';
      case 'dining':
        return 'restaurant';
      case 'transportation':
        return 'car';
      case 'accommodation':
        return 'bed';
      case 'shopping':
        return 'cart';
      case 'emergency':
        return 'medical';
      case 'business':
        return 'briefcase';
      case 'favorites':
        return 'star';
      default:
        return 'text';
    }
  };
  
  // Memoized phrase item component
  const PhraseItem = memo(({ item, displayInSourceLanguage, sourceLanguage, targetLanguage, itemRefs, openedRowId, onOpenSwipe, onPress, onDelete }) => {
    return (
      <Swipeable
        renderRightActions={(progress, dragX) => (
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => onDelete(item)}
          >
            <Ionicons name="trash-outline" size={24} color="white" />
            <Text style={styles.deleteActionText}>Delete</Text>
          </TouchableOpacity>
        )}
        overshootRight={false}
        onSwipeableOpen={() => onOpenSwipe(item.id)}
        ref={(ref) => {
          if (ref && openedRowId === item.id) {
            if (itemRefs.current[item.id]) {
              itemRefs.current[item.id].close();
            }
            itemRefs.current[item.id] = ref;
          }
        }}
      >
        <TouchableOpacity 
          style={styles.phraseItem}
          onPress={() => onPress(item)}
        >
          <View style={styles.phraseContent}>
            <Text style={styles.sourceText}>
              {displayInSourceLanguage ? item.sourceText : item.targetText}
            </Text>
            <Text style={[
              displayInSourceLanguage ? 
                (item.targetText ? styles.translatedText : styles.untranslatedText) : 
                (item.sourceText ? styles.translatedText : styles.untranslatedText)
            ]}>
              {displayInSourceLanguage ? 
                (item.targetText || 'Not translated yet') : 
                item.sourceText}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  });
  
  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPhrasebook();
      await loadCategories();
      await loadLanguagePair();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search phrases"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      {/* Language Switcher - Hidden for now but preserved for future use */}
      {/* 
      <View style={styles.languageSwitcherContainer}>
        <Text style={styles.languageSwitcherLabel}>Display language:</Text>
        <TouchableOpacity 
          style={styles.languageSwitcherButton}
          onPress={toggleDisplayLanguage}
        >
          <Text style={styles.languageSwitcherText}>
            {getCurrentLanguagePairDisplay()}
          </Text>
          <View style={styles.switchIconContainer}>
            <Ionicons name="swap-horizontal" size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>
      */}
      
      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All' }, ...categories]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryPill
              item={item}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
              getCategoryIcon={getCategoryIcon}
            />
          )}
          style={styles.categoriesList}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </View>

      {/* Phrases List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4a6ea9" />
        </View>
      ) : filteredPhrases.length === 0 ? (
        <EmptyState 
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          navigation={navigation}
        />
      ) : (
        <SectionList
          sections={groupedPhrases}
          keyExtractor={(item) => `phrase-${item.id}`}
          contentContainerStyle={styles.listContainer}
          stickySectionHeadersEnabled={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: 76, // Approximate height of each item
            offset: 76 * index,
            index,
          })}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons
                  name={getCategoryIcon(section.title)}
                  size={20}
                  color="#4a6ea9"
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <PhraseItem
              item={item}
              displayInSourceLanguage={displayInSourceLanguage}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              itemRefs={itemRefs}
              openedRowId={openedRowId}
              onOpenSwipe={onSwipeOpen}
              onPress={(phrase) => {
                // Navigate to TranslateScreen with phrase data
                navigation.navigate('Translate', { 
                  sourceText: phrase.sourceText,
                  sourceLanguage: phrase.sourceLanguage || sourceLanguage,
                  targetLanguage: phrase.targetLanguage || targetLanguage,
                  fromPhrasebook: true
                });
              }}
              onDelete={confirmDelete}
            />
          )}
        />
      )}

      {/* Add Phrase FAB */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('Translate')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Language Switch Notification */}
      {showSwitchNotification && (
        <Animated.View 
          style={[
            styles.switchNotification,
            {opacity: fadeAnim}
          ]}
        >
          <Text style={styles.switchNotificationText}>
            Switched to {getCurrentLanguagePairDisplay()}
          </Text>
        </Animated.View>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            width: '80%',
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff3b30" />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#333',
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Delete Phrase
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              marginBottom: 20,
            }}>
              Are you sure you want to delete this phrase? This action cannot be undone.
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: '100%',
            }}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: '#eee',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#666',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteConfirm}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: '#ff3b30',
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'white',
                }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  deleteAction: {
    flex: 1,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginVertical: 4,
  },
  deleteActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
  loadingText: {
    fontSize: 16,
    color: '#333',
    letterSpacing: 0.15,
  },
  languageSwitcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 12,
    marginTop: 6,
    marginBottom: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  languageSwitcherLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  languageSwitcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e5f0',
  },
  languageSwitcherText: {
    fontSize: 14,
    color: '#4a6ea9',
    fontWeight: '600',
    marginRight: 8,
  },
  switchIconContainer: {
    backgroundColor: '#4a6ea9',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchNotification: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: 'rgba(74, 110, 169, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 100,
  },
  switchNotificationText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default PhrasebookScreen;