import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getConversation, 
  addMessageToConversation, 
  recognizeSpeech 
} from '../services/conversationService';
import { getSupportedLanguages } from '../services/translationService';
import { isOfflineModeEnabled, isLanguageDownloaded } from '../services/offlineService';

const ConversationScreen = ({ navigation, route }) => {
  const { conversationId } = route.params || {};
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState('1'); // Default to user (participant 1)
  const [languages, setLanguages] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const flatListRef = useRef(null);
  
  // Load conversation and languages when component mounts
  useEffect(() => {
    loadLanguages();
    
    // Check if conversationId is provided
    if (conversationId) {
      loadConversation();
    } else {
      // If no conversationId, show error and go back
      Alert.alert('Error', 'No conversation selected', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack() 
        }
      ]);
    }
    
    // Check if offline mode is enabled
    const checkOfflineStatus = async () => {
      const offline = await isOfflineModeEnabled();
      setOfflineMode(offline);
    };
    
    checkOfflineStatus();
  }, [conversationId, navigation]);
  
  // Load languages
  const loadLanguages = async () => {
    try {
      const supportedLanguages = await getSupportedLanguages();
      setLanguages(supportedLanguages);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };
  
  // Load conversation data
  const loadConversation = async () => {
    try {
      if (!conversationId) {
        return; // Skip if no conversationId (already handled in useEffect)
      }
      
      const conversationData = await getConversation(conversationId);
      
      if (!conversationData) {
        Alert.alert('Error', 'Conversation not found');
        navigation.goBack();
        return;
      }
      
      setConversation(conversationData);
      setMessages(conversationData.messages);
      
      // Update navigation header title
      navigation.setOptions({
        title: conversationData.title || 'Conversation',
      });
    } catch (error) {
      console.error('Failed to load conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    // Check if offline mode is enabled and required languages are downloaded
    if (offlineMode) {
      const participant = conversation.participants.find(p => p.id === selectedParticipant);
      const otherParticipant = conversation.participants.find(p => p.id !== selectedParticipant);
      
      const sourceLanguageDownloaded = await isLanguageDownloaded(participant.language);
      const targetLanguageDownloaded = await isLanguageDownloaded(otherParticipant.language);
      
      if (!sourceLanguageDownloaded || !targetLanguageDownloaded) {
        Alert.alert(
          'Language Packs Required',
          'The required language packs are not downloaded for offline translation.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Download Now', 
              onPress: () => navigation.navigate('LanguagePacks') 
            }
          ]
        );
        return;
      }
    }
    
    try {
      setSendingMessage(true);
      
      // Add message to conversation
      const newMessage = await addMessageToConversation(
        conversationId,
        messageText,
        selectedParticipant
      );
      
      // Clear input
      setMessageText('');
      
      // Update messages list
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Start speech recognition
  const startSpeechRecognition = async () => {
    if (!conversation) return;
    
    try {
      setIsRecording(true);
      
      // Get the language of the selected participant
      const participant = conversation.participants.find(p => p.id === selectedParticipant);
      
      // Start speech recognition
      const recognizedText = await recognizeSpeech(participant.language);
      
      // Set the recognized text as message
      setMessageText(recognizedText);
    } catch (error) {
      console.error('Speech recognition failed:', error);
      Alert.alert('Error', 'Speech recognition failed');
    } finally {
      setIsRecording(false);
    }
  };
  
  // Switch between participants
  const switchParticipant = () => {
    if (!conversation) return;
    
    // Toggle between participant 1 and 2
    setSelectedParticipant(prevId => 
      prevId === '1' ? '2' : '1'
    );
  };
  
  // Render a message bubble
  const renderMessage = ({ item }) => {
    const isUser = item.fromParticipantId === '1';
    const participant = conversation?.participants.find(p => p.id === item.fromParticipantId);
    
    // Get language names for display
    const fromLanguageName = languages.find(l => l.code === item.fromLanguage)?.name || item.fromLanguage;
    const toLanguageName = languages.find(l => l.code === item.toLanguage)?.name || item.toLanguage;
    
    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userMessage : styles.partnerMessage
      ]}>
        <View style={styles.messageHeader}>
          <Text style={styles.participantName}>{participant?.name || 'Unknown'}</Text>
          <Text style={styles.languageLabel}>
            {fromLanguageName} → {toLanguageName}
          </Text>
        </View>
        
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.translatedText}>{item.translatedText}</Text>
        
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };
  
  // If conversation is not loaded yet, show loading indicator
  if (!conversation) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#4a6ea9" />
        <Text style={{ marginTop: 10 }}>Loading conversation...</Text>
      </View>
    );
  }
  
  // Get the current participant
  const currentParticipant = conversation.participants.find(p => p.id === selectedParticipant);
  const otherParticipant = conversation.participants.find(p => p.id !== selectedParticipant);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Participant selector */}
      <View style={styles.participantSelector}>
        <TouchableOpacity 
          style={[
            styles.participantButton, 
            selectedParticipant === '1' && styles.selectedParticipant
          ]}
          onPress={() => setSelectedParticipant('1')}
        >
          <Text style={styles.participantButtonText}>
            {conversation.participants[0].name}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.languageBadge}>
          <Text style={styles.languageBadgeText}>
            {conversation.participants[0].language.toUpperCase()} ⟷ {conversation.participants[1].language.toUpperCase()}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.participantButton, 
            selectedParticipant === '2' && styles.selectedParticipant
          ]}
          onPress={() => setSelectedParticipant('2')}
        >
          <Text style={styles.participantButtonText}>
            {conversation.participants[1].name}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Message list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ccc" />
            <Text style={styles.emptyChatText}>Start the conversation</Text>
            <Text style={styles.emptyChatDescription}>
              Select who is speaking using the buttons above, then type or tap the microphone to speak
            </Text>
          </View>
        }
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />
      
      {/* Message input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
        style={styles.inputContainer}
      >
        <View style={styles.speakingAs}>
          <Text style={styles.speakingAsText}>
            Speaking as: <Text style={styles.speakingAsName}>{currentParticipant.name}</Text> ({currentParticipant.language.toUpperCase()})
          </Text>
          
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={switchParticipant}
          >
            <Ionicons name="swap-horizontal" size={20} color="#4a6ea9" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Type in ${currentParticipant.language.toUpperCase()}...`}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          
          {messageText.trim() ? (
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={sendingMessage}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.micButton, isRecording && styles.recordingButton]}
              onPress={startSpeechRecognition}
              disabled={isRecording}
            >
              {isRecording ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="mic" size={20} color="white" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantSelector: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  participantButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedParticipant: {
    backgroundColor: '#4a6ea9',
    borderColor: '#4a6ea9',
  },
  participantButtonText: {
    fontSize: 14,
    color: '#333',
  },
  languageBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  languageBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  messagesList: {
    padding: 15,
  },
  messageBubble: {
    marginVertical: 5,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#eee',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
    borderColor: '#bbdefb',
  },
  partnerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  participantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  languageLabel: {
    fontSize: 10,
    color: '#888',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  translatedText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
    padding: 10,
  },
  speakingAs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakingAsText: {
    fontSize: 12,
    color: '#666',
  },
  speakingAsName: {
    fontWeight: '600',
    color: '#4a6ea9',
  },
  switchButton: {
    padding: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  micButton: {
    backgroundColor: '#5e8ad4',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  recordingButton: {
    backgroundColor: '#f44336',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 80,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyChatDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ConversationScreen;