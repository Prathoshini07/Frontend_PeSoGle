import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fontSize, fontWeight, spacing } from '@/constants/theme';
import InputField from '@/components/InputField';
import PrimaryButton from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

export default function SetPasswordScreen() {
  const router = useRouter();
  const { email, token, refresh_token } = useLocalSearchParams<{ email: string; token: string; refresh_token: string }>();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const setPasswordMutation = useMutation({
    mutationFn: () => authService.setPassword({
      email: email || '',
      password,
      confirm_password: confirmPassword,
      token: token || '',
      refresh_token: refresh_token || ''
    }),
    onSuccess: () => {
      console.log('[SetPassword] Success, logging in');
      login(email || '', 'mock-token-' + Date.now(), false);
      router.replace('/profile-creation' as any);
    },
    onError: (err: any) => {
      const serverError = err?.response?.data?.detail || 'Failed to set password. Please try again.';
      setErrors({ password: serverError });
    },
  });

  const handleSubmit = useCallback(() => {
    const newErrors: { password?: string; confirm?: string } = {};
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setPasswordMutation.mutate();
  }, [password, confirmPassword, setPasswordMutation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Lock size={28} color={Colors.primaryDark} />
          </View>
          <Text style={styles.title}>Set Password</Text>
          <Text style={styles.subtitle}>Create a secure password for your account</Text>
        </View>
        <View style={styles.form}>
          <InputField
            label="New Password"
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={(text) => { setPassword(text); setErrors({}); }}
            secureTextEntry
            error={errors.password}
            testID="password-input"
          />
          <InputField
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(text) => { setConfirmPassword(text); setErrors({}); }}
            secureTextEntry
            error={errors.confirm}
            testID="confirm-password-input"
          />
          <PrimaryButton
            title="Set Password & Continue"
            onPress={handleSubmit}
            loading={setPasswordMutation.isPending}
            disabled={!password || !confirmPassword}
            testID="set-password-btn"
          />
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
    gap: spacing.sm,
  },
});
