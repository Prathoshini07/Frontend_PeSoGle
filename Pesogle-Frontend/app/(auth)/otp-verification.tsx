import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import PrimaryButton from '@/components/PrimaryButton';
import { authService } from '@/services/authService';

const OTP_LENGTH = 8;

export default function OtpVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: () => authService.verifyOtp({ email: email || '', otp: otp.join('') }),
    onSuccess: () => {
      console.log('[OTP] Verified successfully');
      router.push({ pathname: '/(auth)/set-password' as any, params: { email } });
    },
    onError: () => {
      setError('Invalid OTP. Please try again.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authService.sendOtp({ email: email || '' }),
    onSuccess: () => {
      setCountdown(60);
      setOtp(new Array(OTP_LENGTH).fill(''));
      console.log('[OTP] Resent successfully');
    },
  });

  const handleOtpChange = useCallback((text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerify = useCallback(() => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter the complete OTP');
      return;
    }
    verifyMutation.mutate();
  }, [otp, verifyMutation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={28} color={Colors.primaryDark} />
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 8-digit code sent to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null, error ? styles.otpInputError : null]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text.slice(-1), index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              testID={`otp-input-${index}`}
            />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title="Verify OTP"
          onPress={handleVerify}
          loading={verifyMutation.isPending}
          disabled={otp.join('').length !== OTP_LENGTH}
          style={styles.verifyBtn}
          testID="verify-otp-btn"
        />
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>Resend code in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
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
    lineHeight: 22,
  },
  emailText: {
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  otpInput: {
    width: 38,
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.inputBg,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.primaryDark + '08',
  },
  otpInputError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: fontSize.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verifyBtn: {
    marginTop: spacing.md,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  countdownText: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
  },
  resendText: {
    fontSize: fontSize.md,
    color: Colors.accent,
    fontWeight: fontWeight.semibold,
  },
});
