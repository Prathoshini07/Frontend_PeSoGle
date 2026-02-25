import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { ArrowUp, MessageSquare, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import type { Post } from '@/mocks/posts';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  testID?: string;
}

export default function PostCard({ post, onPress, testID }: PostCardProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.card, post.hasAcceptedAnswer && styles.cardAccepted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.meta}>{post.authorDepartment} · {post.createdAt}</Text>
        </View>
        {post.hasAcceptedAnswer && (
          <View style={styles.acceptedBadge}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.acceptedText}>Solved</Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.content} numberOfLines={2}>{post.content}</Text>
      <View style={styles.tagsRow}>
        {post.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <View style={styles.stat}>
          <ArrowUp size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{post.upvotes}</Text>
        </View>
        <View style={styles.stat}>
          <MessageSquare size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{post.answers} answers</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{post.category}</Text>
        </View>
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
  cardAccepted: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
  },
  authorInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  meta: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  acceptedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: Colors.success,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  content: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
  },
  categoryBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: fontSize.xs,
    color: Colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
});
