import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { PenSquare, Search, FileText } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import PostCard from '@/components/PostCard';
import { categories } from '@/mocks/posts';
import { postService } from '@/services/postService';
import { profileService } from '@/services/profileService';
import type { Post } from '@/mocks/posts';

export default function DiscussionsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const postTypes = ['All', 'POST', 'BLOG', 'QUESTION'];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const prof = await profileService.getProfile();
        if (prof) setCurrentUserId(prof.user_id);
      } catch (err) { console.log('[Discussions] Fetch user error', err); }
    };
    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadPosts = async () => {
        setLoading(true);
        try {
          const categoryMap: Record<string, string> = {
            'AI & ML': 'AI_ML',
            'Web Development': 'WEB_DEV',
            'Core Engineering': 'SYSTEMS',
            'Research': 'RESEARCH',
            'Career Guidance': 'PLACEMENTS',
            'Project Help': 'PROJECTS',
            'Study Resources': 'GENERAL',
            'Other': 'OTHER'
          };
          
          const finalCategory = categoryMap[selectedCategory] || selectedCategory;
          const response = await postService.getPosts(finalCategory, selectedType, submittedSearch);
          
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
    }, [selectedCategory, selectedType, submittedSearch])
  );

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard 
      post={item} 
      currentUserId={currentUserId}
      onPress={() => router.push(`/(tabs)/discussions/post/${item.id}` as any)} 
      onDelete={() => setPosts(prev => prev.filter(p => p.id !== item.id))}
    />
  ), [router, currentUserId]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <FileText size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Posts Found</Text>
        <Text style={styles.emptyText}>There are no posts related to this category yet.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Posts',
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)}>
                <Search size={22} color={Colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.composeBtn} onPress={() => router.push('/(tabs)/discussions/compose' as any)}>
                <PenSquare size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          <View style={styles.filtersContainer}>
            {isSearchVisible && (
              <View style={styles.searchContainer}>
                <TextInput
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => setSubmittedSearch(searchQuery)}
                  style={styles.searchInput}
                  returnKeyType="search"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            )}
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
                      {type === 'BLOG' ? 'Blogs' : type === 'QUESTION' ? 'Q&A' : type === 'POST' ? 'Posts' : 'All Types'}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  searchContainer: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    fontSize: fontSize.sm,
    color: Colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
