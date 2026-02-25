import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Target, TrendingUp, Users, ChevronRight, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import TagChip from '@/components/TagChip';

const targetRoles = ['ML Engineer', 'Data Scientist', 'Full-Stack Developer', 'Research Scientist', 'DevOps Engineer'];

interface SkillGap {
  skill: string;
  current: number;
  required: number;
}

const mockSkillGaps: SkillGap[] = [
  { skill: 'Python', current: 85, required: 90 },
  { skill: 'TensorFlow', current: 70, required: 85 },
  { skill: 'System Design', current: 30, required: 75 },
  { skill: 'MLOps', current: 20, required: 70 },
  { skill: 'Docker', current: 40, required: 65 },
  { skill: 'Distributed Systems', current: 25, required: 60 },
];

const mockRoadmap = [
  { step: 1, title: 'Complete MLOps Fundamentals', duration: '2-3 weeks', status: 'current' as const },
  { step: 2, title: 'Build Docker & Kubernetes Skills', duration: '3-4 weeks', status: 'upcoming' as const },
  { step: 3, title: 'System Design for ML Systems', duration: '4-6 weeks', status: 'upcoming' as const },
  { step: 4, title: 'Distributed Training Projects', duration: '4-6 weeks', status: 'upcoming' as const },
  { step: 5, title: 'Build Production ML Portfolio', duration: '6-8 weeks', status: 'upcoming' as const },
];

const suggestedMentors = [
  { name: 'Dr. Sarah Chen', reason: 'ML systems expertise', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face' },
  { name: 'Raj Patel', reason: 'MLOps & distributed systems', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
];

export default function CareerSimulatorScreen() {
  const [selectedRole, setSelectedRole] = useState('ML Engineer');

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Career Simulator',
          headerStyle: { backgroundColor: Colors.primaryBg },
          headerTintColor: Colors.primaryDark,
          headerShadowVisible: false,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.roleSelector}>
          <Text style={styles.roleSelectorTitle}>Target Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.roleChips}>
              {targetRoles.map(role => (
                <TagChip
                  key={role}
                  label={role}
                  selected={selectedRole === role}
                  onPress={() => setSelectedRole(role)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Target size={20} color={Colors.white} />
            <Text style={styles.overviewTitle}>{selectedRole} Readiness</Text>
          </View>
          <View style={styles.overviewScore}>
            <Text style={styles.overviewPercent}>48%</Text>
            <View style={styles.overviewBar}>
              <View style={[styles.overviewBarFill, { width: '48%' }]} />
            </View>
          </View>
          <Text style={styles.overviewMessage}>You need to strengthen 4 key skills to reach your goal</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Skill Gap Analysis</Text>
          </View>
          {mockSkillGaps.map(gap => {
            const percentage = Math.round((gap.current / gap.required) * 100);
            const isGood = percentage >= 80;
            return (
              <View key={gap.skill} style={styles.skillRow}>
                <View style={styles.skillInfo}>
                  <Text style={styles.skillName}>{gap.skill}</Text>
                  <Text style={[styles.skillLevel, isGood ? styles.skillGood : styles.skillNeed]}>
                    {gap.current}/{gap.required}
                  </Text>
                </View>
                <View style={styles.skillBarOuter}>
                  <View style={styles.skillBarRequired}>
                    <View
                      style={[
                        styles.skillBarCurrent,
                        { width: `${Math.min(percentage, 100)}%` },
                        isGood ? styles.barGood : styles.barNeed,
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ArrowRight size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Learning Roadmap</Text>
          </View>
          {mockRoadmap.map((item, index) => (
            <View key={item.step} style={styles.roadmapItem}>
              <View style={styles.roadmapTimeline}>
                <View style={[styles.roadmapDot, item.status === 'current' && styles.roadmapDotActive]} />
                {index < mockRoadmap.length - 1 && <View style={styles.roadmapLine} />}
              </View>
              <View style={styles.roadmapContent}>
                <Text style={[styles.roadmapTitle, item.status === 'current' && styles.roadmapTitleActive]}>
                  {item.title}
                </Text>
                <Text style={styles.roadmapDuration}>{item.duration}</Text>
              </View>
              {item.status === 'current' && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Users size={18} color={Colors.primaryDark} />
            <Text style={styles.sectionTitle}>Suggested Mentors</Text>
          </View>
          {suggestedMentors.map(mentor => (
            <TouchableOpacity key={mentor.name} style={styles.mentorRow}>
              <View style={styles.mentorInfo}>
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <Text style={styles.mentorReason}>{mentor.reason}</Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  roleSelector: {
    marginBottom: spacing.lg,
  },
  roleSelectorTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roleChips: {
    flexDirection: 'row',
  },
  overviewCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  overviewTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.white,
  },
  overviewScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  overviewPercent: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: Colors.white,
  },
  overviewBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.white + '20',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overviewBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  overviewMessage: {
    fontSize: fontSize.sm,
    color: Colors.white + 'BB',
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  skillRow: {
    marginBottom: spacing.md,
  },
  skillInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  skillName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.primaryDark,
  },
  skillLevel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  skillGood: {
    color: Colors.success,
  },
  skillNeed: {
    color: Colors.warning,
  },
  skillBarOuter: {
    height: 6,
    borderRadius: 3,
  },
  skillBarRequired: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  skillBarCurrent: {
    height: '100%',
    borderRadius: 3,
  },
  barGood: {
    backgroundColor: Colors.success,
  },
  barNeed: {
    backgroundColor: Colors.warning,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 60,
  },
  roadmapTimeline: {
    alignItems: 'center',
    width: 20,
    marginRight: spacing.md,
  },
  roadmapDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  roadmapDotActive: {
    backgroundColor: Colors.primaryDark,
  },
  roadmapLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  roadmapContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  roadmapTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.textSecondary,
  },
  roadmapTitleActive: {
    color: Colors.primaryDark,
    fontWeight: fontWeight.semibold,
  },
  roadmapDuration: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: Colors.primaryDark + '12',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  mentorReason: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
