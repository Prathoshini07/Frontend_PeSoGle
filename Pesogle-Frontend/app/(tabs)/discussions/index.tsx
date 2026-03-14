import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { PenSquare } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import { categories } from '@/mocks/posts';
import { postService } from '@/services/postService';
import type { Post } from '@/mocks/posts';

export default function DiscussionsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const postTypes = ['All', 'POST', 'BLOG', 'QUESTION'];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadPosts = async () => {
        setLoading(true);
        try {
          const response = await postService.getPosts(selectedCategory, selectedType);
          if (response.success && isActive) {
            setPosts(response.data);
          }
        } catch (error) {
          console.log('[Discussions] Failed to load posts:', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      loadPosts();

      return () => {
        isActive = false;
      };
    }, [selectedCategory, selectedType])
  );

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} onPress={() => router.push(`/(tabs)/discussions/post/${item.id}` as any)} />
  ), [router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Posts',
          headerRight: () => (
            <TouchableOpacity style={styles.composeBtn} onPress={() => router.push('/(tabs)/discussions/compose' as any)}>
              <PenSquare size={20} color={Colors.white} />
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.filtersContainer}>
            <View style={styles.typeRowWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeRow}
              >
                {postTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>
                      {type === 'BLOG' ? 'Blogs' : type === 'QUESTION' ? 'Q&A' : type === 'POST' ? 'Discussions' : 'All Types'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  typeRowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeRow: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  typeChip: {
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  typeChipActive: {
    borderBottomColor: Colors.primaryDark,
  },
  typeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: Colors.textMuted,
  },
  typeTextActive: {
    color: Colors.primaryDark,
  },
  categoryRow: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },
});
