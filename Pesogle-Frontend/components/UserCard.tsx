import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import type { User } from '@/mocks/users';

interface UserCardProps {
  user: User;
  onPress?: () => void;
  onConnect?: () => void;
  compact?: boolean;
  testID?: string;
}

export default function UserCard({ user, onPress, onConnect, compact, testID }: UserCardProps) {
  const matchColor = user.matchPercentage >= 80 ? Colors.matchHigh
    : user.matchPercentage >= 60 ? Colors.matchMedium
    : Colors.matchLow;

  if (compact) {
    return (
      <TouchableOpacity testID={testID} style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        <Image source={{ uri: user.avatar }} style={styles.compactAvatar} />
        <Text style={styles.compactName} numberOfLines={1}>{user.name}</Text>
        <View style={[styles.matchBadge, { backgroundColor: matchColor }]}>
          <Text style={styles.matchText}>{user.matchPercentage}%</Text>
        </View>
        <Text style={styles.compactReason} numberOfLines={2}>{user.matchReason}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity testID={testID} style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.department}>{user.department} · {user.year}</Text>
          <View style={styles.roleRow}>
            <View style={[styles.roleBadge, user.role === 'mentor' && styles.mentorBadge]}>
              <Text style={[styles.roleText, user.role === 'mentor' && styles.mentorText]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.matchCircle, { borderColor: matchColor }]}>
          <Text style={[styles.matchCircleText, { color: matchColor }]}>{user.matchPercentage}%</Text>
        </View>
      </View>
      <Text style={styles.reason} numberOfLines={2}>{user.matchReason}</Text>
      <View style={styles.skillsRow}>
        {user.skills.slice(0, 4).map((skill) => (
          <View key={skill} style={styles.skillTag}>
            <Text style={styles.skillTagText}>{skill}</Text>
          </View>
        ))}
        {user.skills.length > 4 && (
          <View style={styles.skillTag}>
            <Text style={styles.skillTagText}>+{user.skills.length - 4}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.viewBtn} onPress={onPress}>
          <Text style={styles.viewBtnText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.connectBtn} onPress={onConnect}>
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.borderLight,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  department: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  roleBadge: {
    backgroundColor: Colors.chipBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  mentorBadge: {
    backgroundColor: '#FEF3C7',
  },
  roleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: Colors.primaryDark,
  },
  mentorText: {
    color: '#92400E',
  },
  matchCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCircleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  reason: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  skillTag: {
    backgroundColor: Colors.chipBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
  },
  skillTagText: {
    fontSize: fontSize.xs,
    color: Colors.chipText,
    fontWeight: fontWeight.medium,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  viewBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.primaryDark,
  },
  connectBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.white,
  },
  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: 160,
    marginRight: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  compactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: spacing.sm,
    backgroundColor: Colors.borderLight,
  },
  compactName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  matchBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  matchText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: Colors.white,
  },
  compactReason: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
