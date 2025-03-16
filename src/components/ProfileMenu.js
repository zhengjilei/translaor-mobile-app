import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import logger from '../utils/logger';

const ProfileMenu = ({ 
  visible, 
  onClose, 
  navigation, 
  topPosition = 60, 
  rightPosition = 20,
  darkMode = false
}) => {
  // Define theme colors based on dark mode setting
  const theme = {
    background: darkMode ? '#1e1e1e' : 'white',
    text: darkMode ? '#f5f5f5' : '#333333',
    icon: darkMode ? '#f5f5f5' : '#333333',
    divider: darkMode ? '#333333' : '#eeeeee',
    overlay: darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)',
  };

  // Navigate to history screen
  const navigateToHistory = () => {
    logger.debug('Navigating to History screen from profile menu', 'ProfileMenu');
    onClose();
    navigation.navigate('History');
  };

  // Navigate to settings screen
  const navigateToSettings = () => {
    logger.debug('Navigating to Settings screen from profile menu', 'ProfileMenu');
    onClose();
    navigation.navigate('Settings');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[
          styles.profileMenu, 
          { 
            top: topPosition, 
            right: rightPosition,
            backgroundColor: theme.background 
          }
        ]}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={navigateToHistory}
          >
            <Ionicons name="time-outline" size={22} color={theme.icon} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>History</Text>
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: theme.divider }]} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={navigateToSettings}
          >
            <Ionicons name="settings-outline" size={22} color={theme.icon} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  profileMenu: {
    position: 'absolute',
    width: 180,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});

export default ProfileMenu; 