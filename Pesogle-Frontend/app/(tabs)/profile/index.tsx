import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Settings, Edit3, MessageCircle, Award, BookOpen, Target, Briefcase, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import TagChip from '@/components/TagChip';
import { currentUser } from '@/mocks/users';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    router.replace('/');
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/connections' as any)}>
                <MessageCircle size={20} color={Colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
                <LogOut size={20} color={Colors.accent} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.deptYear}>{currentUser.department} · {currentUser.year}</Text>
          <View style={styles.scoreBadge}>
            <Award size={16} color={Colors.primaryDark} />
            <Text style={styles.scoreText}>Academic Score: {currentUser.academicScore}/100</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Edit3 size={14} color={Colors.primaryDark} />
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bioCard}>
          <Text style={styles.bioText}>{currentUser.bio}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BookOpen size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Domains</Text>
          </View>
          <View style={styles.chipsWrap}>
            {currentUser.domains.map(d => <TagChip key={d} label={d} />)}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Briefcase size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.chipsWrap}>
            {currentUser.skills.map(s => <TagChip key={s} label={s} small />)}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Goals</Text>
          </View>
          {currentUser.goals.map(goal => (
            <View key={goal} style={styles.goalItem}>
              <View style={styles.goalDot} />
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Briefcase size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Projects</Text>
          </View>
          {currentUser.projects.map(project => (
            <View key={project} style={styles.projectItem}>
              <Text style={styles.projectText}>{project}</Text>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/resume-bot' as any)}>
            <BookOpen size={22} color={Colors.accent} />
            <Text style={styles.actionTitle}>Resume Bot</Text>
            <Text style={styles.actionSub}>Analyze & improve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/career-simulator' as any)}>
            <Target size={22} color={Colors.primaryDark} />
            <Text style={styles.actionTitle}>Career Path</Text>
            <Text style={styles.actionSub}>Skill gap analysis</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: spacing.md,
    backgroundColor: Colors.borderLight,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  deptYear: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chipBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  scoreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.primaryDark,
  },
  bioCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  bioText: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  goalText: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
  },
  projectItem: {
    backgroundColor: Colors.primaryBg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  projectText: {
    fontSize: fontSize.md,
    color: Colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.sm,
  },
  actionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  actionSub: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
  },
});
