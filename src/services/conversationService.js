import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateText } from './translationService';
import { saveToHistory } from './historyService';

const CONVERSATIONS_STORAGE_KEY = 'translator_conversations';

// Data structures for conversation service:
// Conversation: {
//   id: string,
//   title: string,
//   participants: [
//     { id: string, language: string, name: string },
//     { id: string, language: string, name: string }
//   ],
//   messages: [
//     { id: string, text: string, translatedText: string, from: string, to: string, timestamp: string },
//   ],
//   createdAt: string,
//   updatedAt: string
// }

// Get all saved conversations
export const getConversations = async () => {
  try {
    const conversationsData = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (conversationsData) {
      return JSON.parse(conversationsData);
    }
    return [];
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
};

// Get a specific conversation
export const getConversation = async (conversationId) => {
  try {
    const conversations = await getConversations();
    return conversations.find(conv => conv.id === conversationId);
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return null;
  }
};

// Create a new conversation
export const createConversation = async (title, participant1, participant2) => {
  try {
    const conversations = await getConversations();
    
    const newConversation = {
      id: Date.now().toString(),
      title: title || `Conversation (${new Date().toLocaleDateString()})`,
      participants: [
        { id: '1', language: participant1.language, name: participant1.name || 'You' },
        { id: '2', language: participant2.language, name: participant2.name || 'Partner' }
      ],
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    conversations.push(newConversation);
    await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    
    return newConversation;
  } catch (error) {
    console.error('Failed to create conversation:', error);
    throw error;
  }
};

// Add a message to a conversation
export const addMessageToConversation = async (
  conversationId, 
  text, 
  fromParticipantId,
  useAutoDetect = false
) => {
  try {
    const conversations = await getConversations();
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (conversationIndex === -1) {
      throw new Error('Conversation not found');
    }
    
    const conversation = conversations[conversationIndex];
    const fromParticipant = conversation.participants.find(p => p.id === fromParticipantId);
    const toParticipant = conversation.participants.find(p => p.id !== fromParticipantId);
    
    if (!fromParticipant || !toParticipant) {
      throw new Error('Participant not found');
    }
    
    // Translate the message
    const translatedText = await translateText(
      text,
      fromParticipant.language,
      toParticipant.language
    );
    
    // Create the message
    const newMessage = {
      id: Date.now().toString(),
      text: text,
      translatedText: translatedText,
      fromLanguage: fromParticipant.language,
      toLanguage: toParticipant.language,
      fromParticipantId: fromParticipantId,
      timestamp: new Date().toISOString()
    };
    
    // Add to conversation
    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date().toISOString();
    
    // Save updated conversations
    await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    
    // Save to translation history
    await saveToHistory({
      sourceText: text,
      translatedText: translatedText,
      sourceLanguage: fromParticipant.language,
      targetLanguage: toParticipant.language,
      contextType: 'conversation',
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    });
    
    return newMessage;
  } catch (error) {
    console.error('Failed to add message to conversation:', error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  try {
    const conversations = await getConversations();
    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    
    await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updatedConversations));
    return true;
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return false;
  }
};

// Update conversation title
export const updateConversationTitle = async (conversationId, newTitle) => {
  try {
    const conversations = await getConversations();
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (conversationIndex === -1) {
      throw new Error('Conversation not found');
    }
    
    conversations[conversationIndex].title = newTitle;
    conversations[conversationIndex].updatedAt = new Date().toISOString();
    
    await AsyncStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    return true;
  } catch (error) {
    console.error('Failed to update conversation title:', error);
    return false;
  }
};

// Mock speech-to-text API for the conversation feature
export const recognizeSpeech = async (language) => {
  // In a real app, this would use the device's speech recognition API
  
  // For demo, return a random phrase based on language
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
  
  const englishPhrases = [
    'Hello, how are you today?',
    'Can you help me with directions?',
    'I would like to order some food please',
    'What time does the museum open?',
    'Do you speak English?',
    'How much does this cost?',
    'Thank you for your help'
  ];
  
  const spanishPhrases = [
    'Hola, ¿cómo estás hoy?',
    '¿Puedes ayudarme con las direcciones?',
    'Me gustaría pedir algo de comer por favor',
    '¿A qué hora abre el museo?',
    '¿Hablas inglés?',
    '¿Cuánto cuesta esto?',
    'Gracias por tu ayuda'
  ];
  
  const frenchPhrases = [
    'Bonjour, comment allez-vous aujourd\'hui?',
    'Pouvez-vous m\'aider avec les directions?',
    'Je voudrais commander à manger s\'il vous plaît',
    'À quelle heure ouvre le musée?',
    'Parlez-vous anglais?',
    'Combien ça coûte?',
    'Merci pour votre aide'
  ];
  
  // Select phrases based on language
  let phrases;
  switch (language) {
    case 'es':
      phrases = spanishPhrases;
      break;
    case 'fr':
      phrases = frenchPhrases;
      break;
    case 'en':
    default:
      phrases = englishPhrases;
      break;
  }
  
  // Return a random phrase
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
};