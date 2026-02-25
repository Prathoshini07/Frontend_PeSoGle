import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TextInputProps } from 'react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface InputFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  testID?: string;
}

export default function InputField({ label, error, testID, ...props }: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }, [borderAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.inputBorder, Colors.primaryDark],
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, { borderColor }, error ? styles.inputError : null]}>
        <TextInput
          testID={testID}
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: spacing.sm,
  },
  labelFocused: {
    color: Colors.primaryDark,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    backgroundColor: Colors.inputBg,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: fontSize.md,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  error: {
    fontSize: fontSize.xs,
    color: Colors.error,
    marginTop: spacing.xs,
  },
});
