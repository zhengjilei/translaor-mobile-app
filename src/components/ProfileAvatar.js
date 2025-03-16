import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

const ProfileAvatar = ({ 
  initial = 'U', 
  size = 40, 
  color = '#673ab7', 
  onPress,
  style 
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View 
        style={[
          styles.avatar, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: color 
          }
        ]}
      >
        <Text style={[styles.initial, { fontSize: size * 0.45 }]}>
          {initial.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileAvatar; 