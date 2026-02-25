import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface TagChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
  testID?: string;
}

export default function TagChip({ label, selected, onPress, small, testID }: TagChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        testID={testID}
        style={[
          styles.chip,
          selected && styles.chipSelected,
          small && styles.chipSmall,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <Text style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          small && styles.chipTextSmall,
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.chipBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelected: {
    backgroundColor: Colors.chipSelected,
  },
  chipSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.chipText,
  },
  chipTextSelected: {
    color: Colors.chipSelectedText,
  },
  chipTextSmall: {
    fontSize: fontSize.xs,
  },
});
