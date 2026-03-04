import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { LogIn, Lock, Mail } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import InputField from '@/components/InputField';
import PrimaryButton from '@/components/PrimaryButton';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => authService.login({ email, password }),
    onSuccess: (response) => {
      console.log('[Login] Success');
      login(email, response.data.token, response.data.user.profileComplete);

      // Navigate based on profile status
      if (response.data.user.profileComplete) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/profile-creation');
      }
    },
    onError: (err: any) => {
      console.log('[Login] Error:', err);
      setError(err?.response?.data?.detail || 'Invalid email or password');
    },
  });

  const handleLogin = useCallback(() => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    loginMutation.mutate();
  }, [email, password, loginMutation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <LogIn size={28} color={Colors.primaryDark} />
          </View>
          <Text style={styles.title}>PeSoGle Login</Text>
          <Text style={styles.subtitle}>Enter your credentials to access your account</Text>
        </View>
        <View style={styles.form}>
          <InputField
            label="Email"
            placeholder="your.name@university.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={error && !password ? error : ''}
            testID="email-input"
          />
          <InputField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            error={error && password ? error : ''}
            testID="password-input"
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Login"
            onPress={handleLogin}
            loading={loginMutation.isPending}
            disabled={!email.trim() || !password.trim()}
            testID="login-btn"
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.replace('/(auth)/signup')}
          >
            <Text style={styles.signupLinkText}>
              Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
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
    paddingTop: spacing.xxxxl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    color: Colors.accent,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  signupLink: {
    alignItems: 'center',
    padding: spacing.md,
  },
  signupLinkText: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
  },
  signupLinkBold: {
    color: Colors.accent, // Changed from primary to accent as primary might not exist
    fontWeight: fontWeight.bold,
  },
});
