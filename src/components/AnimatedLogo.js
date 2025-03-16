import React, { memo } from 'react';
import { StyleSheet, View, Animated, Text } from 'react-native';

// Simplified logo component - no text or circles
const AnimatedLogo = memo(({ style, scale = 1, fadeAnim }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Empty component - no text or circles */}
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ scale }]
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default AnimatedLogo; 