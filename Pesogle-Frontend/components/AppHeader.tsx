import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { shadow, spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function AppHeader() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.leftSection}>
                    <TouchableOpacity style={styles.profileBtn}>
                        <View style={styles.avatar} />
                    </TouchableOpacity>
                </View>

                <View style={styles.centerSection}>
                    <Image
                        source={require('@/assets/images/Pesogle-removebg-preview.png')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>

                <View style={styles.rightSection}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Search size={22} color={Colors.primaryDark} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.iconBtn}
                        onPress={() => router.push('/connections' as any)}
                    >
                        <Bell size={22} color={Colors.primaryDark} />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: Colors.primaryBg,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        height: 80, // Reduced height as requested
        backgroundColor: Colors.white,
        borderBottomWidth: 1.5,
        borderBottomColor: Colors.borderLight,
        ...shadow.md,
    },
    leftSection: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerSection: {
        flex: 4, // More balanced flex
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    logo: {
        width: 250,
        height: 60,
        transform: [{ scale: 1.4 }], // Force it larger despite whitespace
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.borderLight,
    },
    profileBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
        ...shadow.sm,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadow.sm,
    },
    notifDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accent,
        borderWidth: 1.5,
        borderColor: Colors.white,
    },
});
