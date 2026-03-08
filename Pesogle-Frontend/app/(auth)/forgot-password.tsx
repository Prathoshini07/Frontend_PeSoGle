import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import InputField from '@/components/InputField';
import PrimaryButton from '@/components/PrimaryButton';
import { authService } from '@/services/authService';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const sendOtpMutation = useMutation({
        mutationFn: () => authService.sendOtp({ email, flow_type: 'reset' }),
        onSuccess: () => {
            console.log('[ForgotPassword] OTP sent successfully');
            router.push({
                pathname: '/(auth)/otp-verification' as any,
                params: { email, flowType: 'reset' }
            });
        },
        onError: (err: any) => {
            console.log('[ForgotPassword] OTP send error:', err);
            const message = err?.response?.data?.detail || 'Failed to send reset code. Please try again.';
            setError(message);
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
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Colors.primaryDark} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <KeyRound size={28} color={Colors.primaryDark} />
                    </View>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Don't worry! Enter your email and we'll send you a code to reset your password.
                    </Text>
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
                        title="Send Reset Code"
                        onPress={handleSendOtp}
                        loading={sendOtpMutation.isPending}
                        disabled={!email.trim()}
                        style={styles.button}
                        testID="send-otp-btn"
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
    navBar: {
        height: 56,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        marginTop: Platform.OS === 'ios' ? spacing.xxxl : spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primaryDark + '05',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.xxl,
        paddingTop: spacing.lg,
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
        lineHeight: 22,
    },
    form: {
        flex: 1,
    },
    button: {
        marginTop: spacing.md,
    },
});
