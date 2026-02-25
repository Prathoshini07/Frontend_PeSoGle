import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import InputField from '@/components/InputField';
import PrimaryButton from '@/components/PrimaryButton';
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const sendOtpMutation = useMutation({
    mutationFn: () => authService.sendOtp({ email }),
    onSuccess: () => {
      console.log('[Login] OTP sent successfully');
      router.push({ pathname: '/(auth)/otp-verification' as any, params: { email } });
    },
    onError: (err) => {
      console.log('[Login] OTP send error:', err);
      setError('Failed to send OTP. Please try again.');
    },
  });

  const handleSendOtp = useCallback(() => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    sendOtpMutation.mutate();
  }, [email, sendOtpMutation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Mail size={28} color={Colors.primaryDark} />
          </View>
          <Text style={styles.title}>Welcome to PeSoGle</Text>
          <Text style={styles.subtitle}>Enter your academic email to get started</Text>
        </View>
        <View style={styles.form}>
          <InputField
            label="Academic Email"
            placeholder="your.name@university.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={error}
            testID="email-input"
          />
          <PrimaryButton
            title="Send OTP"
            onPress={handleSendOtp}
            loading={sendOtpMutation.isPending}
            disabled={!email.trim()}
            testID="send-otp-btn"
          />
        </View>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxxl + spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryDark + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    color: Colors.primaryDark,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 18,
  },
});
