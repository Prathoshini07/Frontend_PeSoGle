import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
    }, 2200);

    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <View style={styles.container}>
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />
      <Animated.View style={[styles.logoArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoInitial}>P</Text>
        </View>
        <Text style={styles.logoText}>PeSoGle</Text>
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
  logoArea: {
    alignItems: 'center',
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoInitial: {
    fontSize: 40,
    fontWeight: fontWeight.heavy,
    color: Colors.white,
  },
  logoText: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.heavy,
    color: Colors.primaryDark,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: fontWeight.medium,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.xxxl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryDark + '20',
  },
  dotActive: {
    backgroundColor: Colors.primaryDark,
    width: 20,
  },
});
