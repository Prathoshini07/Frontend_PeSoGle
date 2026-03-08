import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';
import { fontSize, fontWeight, spacing } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { status } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(taglineFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, taglineFade]);

  useEffect(() => {
    if (status === 'loading') return;

    const timer = setTimeout(() => {
      console.log('[Splash] Auth status:', status);
      if (status === 'authenticated') {
        router.replace('/(tabs)/home' as any);
      } else if (status === 'needsProfile') {
        router.replace('/profile-creation' as any);
      } else {
        router.replace('/onboarding' as any);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <View style={styles.container}>
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoArea,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Image
            source={require('../assets/images/Pesogle-removebg-preview.png')}
            style={styles.logoImage}
            contentFit="contain"
            transition={500}
          />
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineFade }]}>
          AI-Driven Academic Mentorship
        </Animated.Text>

        <Animated.View style={[styles.dots, { opacity: taglineFade }]}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryDark + '08',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.accent + '08',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 250, // Added height to match logo
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 500, // Significantly larger
    height: 250,
  },
  tagline: {
    fontSize: fontSize.xl, // More prominent tagline
    color: Colors.textSecondary,
    marginBottom: spacing.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryDark + '20',
  },
  dotActive: {
    backgroundColor: Colors.primaryDark,
    width: 24,
  },
});
