import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getConversations, createConversation, deleteConversation } from '../services/conversationService';
import { getSupportedLanguages } from '../services/translationService';

const ConversationListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  
  // Input fields for new conversation
  const [title, setTitle] = useState('');
  const [user1Name, setUser1Name] = useState('Me');
  const [user1Language, setUser1Language] = useState('en');
  const [user2Name, setUser2Name] = useState('Partner');
  const [user2Language, setUser2Language] = useState('es');
  
  // Load conversations and languages when component mounts
  useEffect(() => {
    loadConversations();
    loadLanguages();
    
    // Refresh conversations when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadConversations();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Load all conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const conversationsList = await getConversations();
      setConversations(conversationsList);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load supported languages
  const loadLanguages = async () => {
    try {
      const supportedLanguages = await getSupportedLanguages();
      setLanguages(supportedLanguages);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };
  
  // Create a new conversation
  const handleCreateConversation = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title for the conversation');
        return;
      }
      
      const newConversation = await createConversation(
        title,
        { name: user1Name, language: user1Language },
        { name: user2Name, language: user2Language }
      );
      
      // Reset form
      setTitle('');
      
      // Close modal
      setShowNewConversationModal(false);
      
      // Add to conversations list
      setConversations(prevConversations => [newConversation, ...prevConversations]);
      
      // Navigate to the new conversation
      navigation.navigate('Conversation', { conversationId: newConversation.id });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to create conversation');
    }
  };
  
  // Delete a conversation
  const handleDeleteConversation = (conversationId) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
              // Update the displayed conversations
              setConversations(conversations.filter(conv => conv.id !== conversationId));
            } catch (error) {
              console.error('Failed to delete conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          }
        },
      ]
    );
  };
  
  // Render a conversation item
  const renderConversationItem = ({ item }) => {
    // Get language names for display
    const getLanguageName = (code) => {
      return languages.find(lang => lang.code === code)?.name || code;
    };
    
    const user1Language = getLanguageName(item.participants[0].language);
    const user2Language = getLanguageName(item.participants[1].language);
    
    // Format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Conversation', { conversationId: item.id })}
      >
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationTitle}>{item.title}</Text>
          <View style={styles.participantsContainer}>
            <View style={styles.participant}>
              <Text style={styles.participantName}>{item.participants[0].name}</Text>
              <Text style={styles.participantLanguage}>{user1Language}</Text>
            </View>
            <Ionicons name="swap-horizontal" size={16} color="#999" style={{marginHorizontal: 5}} />
            <View style={styles.participant}>
              <Text style={styles.participantName}>{item.participants[1].name}</Text>
              <Text style={styles.participantLanguage}>{user2Language}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            {item.messages.length > 0 
              ? `Last message: ${formatDate(item.updatedAt)}`
              : `Created: ${formatDate(item.createdAt)}`}
          </Text>
          <View style={styles.messageCount}>
            <Text style={styles.messageCountText}>
              {item.messages.length} message{item.messages.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  // Render new conversation modal
  const renderNewConversationModal = () => (
    <Modal
      visible={showNewConversationModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Conversation</Text>
            <TouchableOpacity
              onPress={() => setShowNewConversationModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Conversation Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter conversation title"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.participantForm}>
            <Text style={styles.participantLabel}>Person 1</Text>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  value={user1Name}
                  onChangeText={setUser1Name}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Language</Text>
                <TouchableOpacity 
                  style={styles.selectInput}
                  onPress={() => {
                    // Show language picker or navigate to language selection screen
                    // Simplified for demo
                    Alert.alert('Select Language', 'This would show a language picker');
                  }}
                >
                  <Text>
                    {languages.find(l => l.code === user1Language)?.name || 'English'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.participantForm}>
            <Text style={styles.participantLabel}>Person 2</Text>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Partner's name"
                  value={user2Name}
                  onChangeText={setUser2Name}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Language</Text>
                <TouchableOpacity 
                  style={styles.selectInput}
                  onPress={() => {
                    // Show language picker or navigate to language selection screen
                    // Simplified for demo
                    Alert.alert('Select Language', 'This would show a language picker');
                  }}
                >
                  <Text>
                    {languages.find(l => l.code === user2Language)?.name || 'Spanish'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateConversation}
          >
            <Text style={styles.createButtonText}>Create Conversation</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No Conversations Yet</Text>
            <Text style={styles.emptyText}>
              Start a new conversation to translate in real-time between two languages
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setShowNewConversationModal(true)}
            >
              <Text style={styles.startButtonText}>Start a Conversation</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* New conversation button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setShowNewConversationModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      
      {/* New conversation modal */}
      {renderNewConversationModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 14,
    color: '#555',
    marginRight: 5,
  },
  participantLanguage: {
    fontSize: 12,
    color: '#4a6ea9',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  messageCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4a6ea9',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  messageCountText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
    justifyContent: 'center',
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
    paddingTop: 100,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  participantForm: {
    marginBottom: 15,
  },
  participantLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
  },
  selectInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConversationListScreen;