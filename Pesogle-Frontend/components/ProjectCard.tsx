import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Users, CheckCircle2, Clock, CircleDot } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import type { Project } from '@/mocks/projects';

interface ProjectCardProps {
  project: Project;
  onPress?: () => void;
  testID?: string;
}

export default function ProjectCard({ project, onPress, testID }: ProjectCardProps) {
  const statusConfig = {
    active: { color: Colors.success, label: 'Active', icon: CircleDot },
    completed: { color: Colors.primaryDark, label: 'Completed', icon: CheckCircle2 },
    planning: { color: Colors.warning, label: 'Planning', icon: Clock },
  };

  const status = statusConfig[project.status];
  const StatusIcon = status.icon;
  const doneTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  return (
    <TouchableOpacity testID={testID} style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <StatusIcon size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{project.description}</Text>
      </View>
      <View style={styles.tagsRow}>
        {project.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{doneTasks}/{totalTasks} tasks</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.membersRow}>
          {project.members.slice(0, 3).map((member, index) => (
            <Image
              key={member.id}
              source={{ uri: member.avatar }}
              style={[styles.memberAvatar, { marginLeft: index > 0 ? -8 : 0 }]}
            />
          ))}
          <View style={styles.memberCount}>
            <Users size={12} color={Colors.textSecondary} />
            <Text style={styles.memberCountText}>{project.members.length}</Text>
          </View>
        </View>
        <Text style={styles.date}>{project.createdAt}</Text>
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
    ...shadow.sm,
  },
  header: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  description: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: Colors.chipBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: Colors.chipText,
    fontWeight: fontWeight.medium,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  progressLabel: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  progressValue: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.card,
    backgroundColor: Colors.borderLight,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: 3,
  },
  memberCountText: {
    fontSize: fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  date: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
  },
});
