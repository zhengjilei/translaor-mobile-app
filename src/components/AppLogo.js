import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const AppLogo = ({ style, darkMode = false }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.logoWrapper}>
        <Text style={styles.logoText}>
          <Text style={styles.blueText}>U</Text>
          <Text style={styles.redText}>n</Text>
          <Text style={styles.yellowText}>i</Text>
          <Text style={styles.blueText}>v</Text>
          <Text style={styles.greenText}>e</Text>
          <Text style={styles.redText}>r</Text>
          <Text style={[styles.colorfulText, darkMode && styles.lightColorfulText]}>sal</Text>
        </Text>
        <Text style={[
          styles.translatorText, 
          darkMode && styles.darkTranslatorText
        ]}>
          Translator
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginTop: 2,
      },
      android: {
        marginTop: 0,
      },
    }),
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    ...Platform.select({
      android: {
        letterSpacing: 0.5,
      },
      ios: {
        letterSpacing: 0.5,
      },
    }),
  },
  blueText: {
    color: '#4285F4',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  redText: {
    color: '#EA4335',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  yellowText: {
    color: '#FBBC05',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  greenText: {
    color: '#34A853',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorfulText: {
    color: '#5F6368',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  lightColorfulText: {
    color: '#d0d0d0',
  },
  translatorText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#4285F4',
    ...Platform.select({
      android: {
        letterSpacing: 0.5,
      },
      ios: {
        letterSpacing: 0.5,
      },
    }),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  darkTranslatorText: {
    color: '#5BB2FC',
  },
});

export default AppLogo; 