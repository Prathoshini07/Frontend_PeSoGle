import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowUp, MessageSquare, CheckCircle, BookOpen, FileText, HelpCircle, Trash2, PenSquare } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { profileService } from '@/services/profileService';
import { postService } from '@/services/postService';
import type { Post } from '@/mocks/posts';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  testID?: string;
  isDetailed?: boolean;
  currentUserId?: string;
  onDelete?: () => void;
}

export default function PostCard({ post, onPress, testID, isDetailed, currentUserId, onDelete }: PostCardProps) {
  const [authorName, setAuthorName] = useState(post.authorName);
  const [authorAvatar, setAuthorAvatar] = useState(post.authorAvatar);
  const [upvoteCount, setUpvoteCount] = useState(post.upvotes);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUpvoteCount(post.upvotes);
  }, [post.upvotes]);

  useEffect(() => {
    if (authorName === 'Anonymous User') {
      const fetchProfile = async () => {
        try {
          const profile: any = await profileService.getProfileById(post.authorId);
          if (profile) {
            const name = profile.personal_info?.full_name || profile.name;
            if (name) {
              setAuthorName(name);
              setAuthorAvatar(profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`);
            }
          }
        } catch (e) {
          // Profile not found
        }
      };
      fetchProfile();
    }
  }, [post.authorId, authorName]);


  const renderIcon = () => {
    switch (post.type) {
      case 'BLOG':
        return <BookOpen size={16} color={Colors.primaryDark} style={{ marginRight: 6 }} />;
      case 'QUESTION':
        return <HelpCircle size={16} color={Colors.accent} style={{ marginRight: 6 }} />;
      case 'POST':
      default:
        return <FileText size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />;
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await postService.upvotePost(post.id);
      if (res.success) {
        setUpvoteCount((prev) => prev + 1);
      }
    } catch (e: any) {
      if (e.response?.status === 409) {
        try {
          await postService.removeVote(post.id);
          setUpvoteCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
          console.log('[PostCard] Remove vote error', err);
        }
      } else {
        console.log('[PostCard] Upvote Error', e);
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await postService.deletePost(post.id);
      if (res.success && onDelete) {
        onDelete();
      }
    } catch (err) {
      console.log('[PostCard] Delete error', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.card, post.hasAcceptedAnswer && styles.cardAccepted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Image source={{ uri: authorAvatar }} style={styles.avatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.meta}>{post.authorDepartment} · {post.createdAt}</Text>
        </View>

        {post.hasAcceptedAnswer && (
          <View style={styles.acceptedBadge}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.acceptedText}>Solved</Text>
          </View>
        )}

        {currentUserId === post.authorId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/discussions/compose', params: { editId: post.id } } as any)} style={styles.actionBtn}>
              <PenSquare size={16} color={Colors.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn} disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Trash2 size={16} color={Colors.error} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.titleRow}>
        {renderIcon()}
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
      </View>
      <Text style={styles.content} numberOfLines={isDetailed ? undefined : 3}>{post.content}</Text>

      {isDetailed && post.media && post.media.length > 0 && post.media[0].url && (
        <Image
          source={{ uri: post.media[0].url }}
          style={styles.postMedia}
          contentFit="contain"
          transition={200}
        />
      )}
      <View style={styles.tagsRow}>
        {post.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.stat} onPress={handleUpvote}>
          <ArrowUp size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{upvoteCount}</Text>
        </TouchableOpacity>
        <View style={styles.stat}>
          <MessageSquare size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>
            {post.answers} {post.type === 'QUESTION' ? 'answers' : 'comments'}
          </Text>
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
  authorId: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  meta: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    lineHeight: 22,
  },
  content: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  postMedia: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: Colors.borderLight,
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
});
