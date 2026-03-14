import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { profileService, type ProfileResponse } from '@/services/profileService';
import TagChip from '@/components/TagChip';
import { MapPin, Briefcase, GraduationCap, Calendar } from 'lucide-react-native';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileService.getProfileById(id);
        setProfile(data);
      } catch (e) {
        console.error('Failed to load profile', e);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      loadProfile();
    }
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>User profile not found.</Text>
      </View>
    );
  }

  const pInfo = profile.personal_info;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {pInfo.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{pInfo.full_name}</Text>
        <Text style={styles.degree}>{pInfo.degree}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoRow}>
          <GraduationCap size={18} color={Colors.textMuted} />
          <Text style={styles.infoText}>{pInfo.institution}</Text>
        </View>
        <View style={styles.infoRow}>
          <Briefcase size={18} color={Colors.textMuted} />
          <Text style={styles.infoText}>{pInfo.branch_or_domain.join(', ')}</Text>
        </View>
        <View style={styles.infoRow}>
          <Calendar size={18} color={Colors.textMuted} />
          <Text style={styles.infoText}>Batch {pInfo.academic_batch}</Text>
        </View>
      </View>

      {profile.skills_and_interests && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Interests</Text>
          <View style={styles.chipsContainer}>
            {profile.skills_and_interests.skills.map(s => (
              <TagChip key={s} label={s} selected={true} small />
            ))}
            {profile.skills_and_interests.interests.map(i => (
              <TagChip key={i} label={i} selected={false} small />
            ))}
          </View>
        </View>
      )}

      {profile.projects && profile.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {profile.projects.map((proj, idx) => (
            <View key={idx} style={styles.projectCard}>
              <Text style={styles.projectTitle}>{proj.title}</Text>
              <Text style={styles.projectRole}>{proj.role}</Text>
              {proj.description && <Text style={styles.projectDesc}>{proj.description}</Text>}
              <View style={styles.chipsContainer}>
                {proj.tech_stack.map(tech => (
                  <TagChip key={tech} label={tech} small />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {profile.experience && profile.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {profile.experience.map((exp, idx) => (
            <View key={idx} style={styles.expCard}>
              <Text style={styles.expRole}>{exp.role}</Text>
              <Text style={styles.expCompany}>{exp.company}</Text>
              <Text style={styles.expDuration}>{exp.duration}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: Colors.white,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  degree: {
    fontSize: fontSize.md,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: Colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: spacing.md,
    fontFamily: 'Norwester',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.md,
    color: Colors.textPrimary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  projectCard: {
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    paddingLeft: spacing.md,
  },
  projectTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
  },
  projectRole: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: spacing.sm,
  },
  expCard: {
    marginBottom: spacing.md,
  },
  expRole: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
  },
  expCompany: {
    fontSize: fontSize.md,
    color: Colors.primaryDark,
  },
  expDuration: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: Colors.error,
  },
});
