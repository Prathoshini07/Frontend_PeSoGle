import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Brain, Users, BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import PrimaryButton from '@/components/PrimaryButton';

// Width will be handled by useWindowDimensions hook

interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: <Brain size={56} color={Colors.primaryDark} />,
    title: 'AI-Powered\nPeer Matching',
    description: 'Our intelligent algorithm analyzes your academic profile, skills, and goals to connect you with the most compatible mentors and peers.',
    accent: Colors.primaryDark,
  },
  {
    id: '2',
    icon: <Users size={56} color={Colors.accent} />,
    title: 'Collaborative\nProject Rooms',
    description: 'Create and join academic project rooms. Assign roles, track tasks, and collaborate in real-time with your research group.',
    accent: Colors.accent,
  },
  {
    id: '3',
    icon: <BookOpen size={56} color="#16A34A" />,
    title: 'Structured\nMentorship',
    description: 'Build meaningful academic relationships through structured mentorship. Get career guidance, research advice, and skill development support.',
    accent: '#16A34A',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(auth)/login' as any);
    }
  }, [currentIndex, router]);

  const handleSkip = useCallback(() => {
    router.replace('/(auth)/login' as any);
  }, [router]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems[0]?.index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderSlide = useCallback(({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.iconContainer, { backgroundColor: item.accent + '10' }]}>
          <View style={[styles.iconInner, { backgroundColor: item.accent + '15' }]}>
            {item.icon}
          </View>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    );
  }, [width]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      <View style={styles.bottomArea}>
        <View style={styles.pagination}>
          {slides.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: slides[currentIndex].accent }]}
              />
            );
          })}
        </View>
        <PrimaryButton
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxxl + spacing.xl,
  },
  skipBtn: {
    padding: spacing.sm,
  },
  skipText: {
    fontSize: fontSize.md,
    color: Colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  slide: {
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxxl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxxl,
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: Colors.primaryDark,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: spacing.lg,
  },
  slideDescription: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  bottomArea: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxxl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    width: '100%',
  },
});
