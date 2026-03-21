import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Settings, Edit3, MessageCircle, Award, BookOpen, Target, Briefcase, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import TagChip from '@/components/TagChip';
import { useAuth } from '@/context/AuthContext';
import { profileService, type ProfileResponse } from '@/services/profileService';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    router.replace('/');
  }, [logout, router]);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true); 
      setError(null);
      const result = await profileService.getProfile();
      setProfile(result);
    } catch (e) {
      console.error('[ProfileScreen] Failed to load profile', e);
      const isNetworkError =
        (e as { code?: string; message?: string })?.code === 'ERR_NETWORK' ||
        (e as { message?: string })?.message === 'Network Error';
      setError(
        isNetworkError
          ? "Can't reach the server. Make sure the backend is running (e.g. at http://localhost:8081)."
          : 'Failed to load profile'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error ?? 'Profile not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          {profile.personal_info.avatar ? (
            <Image source={{ uri: profile.personal_info.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
               <Text style={{ fontSize: 32, fontWeight: 'bold', color: Colors.textMuted }}>
                 {profile.personal_info.full_name.charAt(0).toUpperCase()}
               </Text>
            </View>
          )}
          <Text style={styles.name}>{profile.personal_info.full_name}</Text>
          <Text style={styles.deptYear}>
            {(profile.personal_info.branch_or_domain[0] || 'Unknown Branch')} · Batch {profile.personal_info.academic_batch}
          </Text>
          <View style={styles.scoreBadge}>
            <Award size={16} color={Colors.primaryDark} />
            <Text style={styles.scoreText}>Academic Profile</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/profile-creation' as any)}
          >
            <Edit3 size={14} color={Colors.primaryDark} />
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bioCard}>
          <Text style={styles.bioText}>
            {profile.bio || (profile.skills_and_interests.skills.length > 0 || profile.skills_and_interests.interests.length > 0
              ? `Skills: ${profile.skills_and_interests.skills.join(', ')}`
              : 'No additional bio information yet.')}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BookOpen size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Domains</Text>
          </View>
          <View style={styles.chipsWrap}>
            {profile.personal_info.branch_or_domain.map(d => (
              <TagChip key={d} label={d} />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Briefcase size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.chipsWrap}>
            {profile.skills_and_interests.skills.map(s => (
              <TagChip key={s} label={s} small />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Briefcase size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>
          {profile.experience.map(exp => (
            <View key={`${exp.company}-${exp.role}-${exp.duration}`} style={styles.goalItem}>
              <View style={styles.goalDot} />
              <Text style={styles.goalText}>
                {exp.role} @ {exp.company} ({exp.duration})
              </Text>
            </View>
          ))}
        </View>

        {profile.goals && profile.goals.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Target size={18} color={Colors.primaryDark} />
              <Text style={styles.sectionTitle}>Goals</Text>
            </View>
            {profile.goals.map(goal => (
              <View key={goal} style={styles.goalItem}>
                <View style={styles.goalDot} />
                <Text style={styles.goalText}>{goal}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Briefcase size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Projects</Text>
          </View>
          {profile.projects.map(project => (
            <TouchableOpacity 
              key={project.title} 
              style={styles.projectItem}
              onPress={() => setExpandedProject(prev => prev === project.title ? null : project.title)}
            >
              <Text style={styles.projectText}>{project.title}</Text>
              {expandedProject === project.title && (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={{ fontSize: fontSize.sm, color: Colors.textSecondary, marginBottom: spacing.xs }}>
                    <Text style={{ fontWeight: 'bold' }}>Role:</Text> {project.role}
                  </Text>
                  {project.description && (
                    <Text style={{ fontSize: fontSize.sm, color: Colors.textSecondary, marginBottom: spacing.xs }}>
                      {project.description}
                    </Text>
                  )}
                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <Text style={{ fontSize: fontSize.xs, color: Colors.textMuted }}>
                      <Text style={{ fontWeight: 'bold' }}>Tech:</Text> {project.tech_stack.join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.white,
  },
});
