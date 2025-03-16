import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Animated, 
  Dimensions, 
  SafeAreaView,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import logger from '../utils/logger';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Values for word-by-word animation
  const word1Opacity = useRef(new Animated.Value(0)).current;
  const word2Opacity = useRef(new Animated.Value(0)).current;
  const word3Opacity = useRef(new Animated.Value(0)).current;
  const word4Opacity = useRef(new Animated.Value(0)).current;
  const word5Opacity = useRef(new Animated.Value(0)).current;
  
  // Store animation references for cleanup
  const animationRef = useRef(null);
  
  useEffect(() => {
    logger.info('SplashScreen mounted, starting animations', 'SplashScreen');
    
    // Set initial values to ensure proper animation
    fadeAnim.setValue(0);
    translateYAnim.setValue(20);
    scaleAnim.setValue(0.8);
    word1Opacity.setValue(0);
    word2Opacity.setValue(0);
    word3Opacity.setValue(0);
    word4Opacity.setValue(0);
    word5Opacity.setValue(0);
    
    // Create a timeout to ensure we navigate even if animations fail
    const navigateTimeoutId = setTimeout(() => {
      logger.warn('SplashScreen safety timeout triggered - forcing navigation', 'SplashScreen');
      navigation.replace('Home');
    }, 5000); // Safety timeout - force navigate after 5 seconds
    
    // Start the animation sequence
    animationRef.current = Animated.sequence([
      // First, fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Animate each word of the slogan appearing
      Animated.stagger(150, [
        Animated.timing(word1Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(word2Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(word3Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(word4Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(word5Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      
      // Wait for 3 seconds
      Animated.delay(3000),
    ]);
    
    // Start the animation and handle completion
    animationRef.current.start(({ finished }) => {
      // Clear the safety timeout since animation completed
      clearTimeout(navigateTimeoutId);
      
      // Only navigate if the animation finished (wasn't interrupted)
      if (finished) {
        logger.info('SplashScreen animations completed, navigating to Home', 'SplashScreen');
        // Simplified navigation logic - works for both platforms
        navigation.replace('Home');
      } else {
        logger.warn('SplashScreen animations interrupted', 'SplashScreen');
      }
    });
    
    // Cleanup function to stop animations when unmounting
    return () => {
      logger.debug('SplashScreen unmounting, cleaning up animations', 'SplashScreen');
      
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      // Clear the safety timeout
      clearTimeout(navigateTimeoutId);
      
      // Reset all animated values to prevent lingering animations
      fadeAnim.setValue(0);
      translateYAnim.setValue(0);
      scaleAnim.setValue(0);
      word1Opacity.setValue(0);
      word2Opacity.setValue(0);
      word3Opacity.setValue(0);
      word4Opacity.setValue(0);
      word5Opacity.setValue(0);
    };
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Animated slogan - now the only text element on screen */}
        <View style={styles.sloganContainer}>
          <Animated.View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Animated.Text style={[styles.wordAnim, styles.blue, { opacity: word1Opacity }]}>
              Break{' '}
            </Animated.Text>
            <Animated.Text style={[styles.wordAnim, styles.red, { opacity: word2Opacity }]}>
              language{' '}
            </Animated.Text>
            <Animated.Text style={[styles.wordAnim, styles.yellow, { opacity: word3Opacity }]}>
              barriers{' '}
            </Animated.Text>
            <Animated.Text style={[styles.wordAnim, styles.green, { opacity: word4Opacity }]}>
              anywhere,{' '}
            </Animated.Text>
            <Animated.Text style={[styles.wordAnim, styles.blue, { opacity: word5Opacity }]}>
              anytime
            </Animated.Text>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sloganContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordAnim: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  blue: {
    color: '#4285F4',
  },
  red: {
    color: '#EA4335',
  },
  yellow: {
    color: '#FBBC05',
  },
  green: {
    color: '#34A853',
  },
});

export default SplashScreen; 