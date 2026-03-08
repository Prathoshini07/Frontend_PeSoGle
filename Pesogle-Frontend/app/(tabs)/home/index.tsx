import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Bell, ChevronRight, TrendingUp, Sparkles, BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import UserCard from '@/components/UserCard';
import PostCard from '@/components/PostCard';
import { mockUsers, currentUser } from '@/mocks/users';
import { mockPosts } from '@/mocks/posts';

export default function HomeScreen() {
  const router = useRouter();
  const topMentors = mockUsers.filter(u => u.role === 'mentor' || u.matchPercentage >= 80).slice(0, 4);
  const trendingPosts = mockPosts.slice(0, 3);

  const renderMentorCard = useCallback(({ item }: { item: typeof mockUsers[0] }) => (
    <UserCard user={item} compact onPress={() => console.log('[Home] View mentor:', item.id)} />
  ), []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerRight: () => (
            <TouchableOpacity style={styles.notifBtn}>
              <Bell size={22} color={Colors.primaryDark} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentGreeting}>
          <Text style={styles.greetingText}>Good morning,</Text>
          <Text style={styles.userNameText}>{currentUser.name.split(' ')[0]} 👋</Text>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Sparkles size={20} color={Colors.accent} />
          </View>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Your AI Summary</Text>
            <Text style={styles.welcomeText}>
              Based on your ML interests, we found 3 new mentor matches and 2 relevant research projects this week.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Mentors</Text>
            <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/(tabs)/matches' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={Colors.accent} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={topMentors}
            renderItem={renderMentorCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mentorList}
          />
        </View>

        <View style={styles.skillGapCard}>
          <View style={styles.skillGapHeader}>
            <TrendingUp size={20} color={Colors.primaryDark} />
            <Text style={styles.skillGapTitle}>Career Snapshot</Text>
          </View>
          <Text style={styles.skillGapSubtitle}>ML Engineer readiness</Text>
          <View style={styles.skillBarContainer}>
            <View style={styles.skillBar}>
              <View style={[styles.skillBarFill, { width: '72%' }]} />
            </View>
            <Text style={styles.skillPercent}>72%</Text>
          </View>
          <View style={styles.skillGapTags}>
            <View style={styles.missingTag}>
              <Text style={styles.missingTagText}>MLOps</Text>
            </View>
            <View style={styles.missingTag}>
              <Text style={styles.missingTagText}>System Design</Text>
            </View>
            <View style={styles.missingTag}>
              <Text style={styles.missingTagText}>Distributed Systems</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.skillGapAction} onPress={() => router.push('/career-simulator' as any)}>
            <Text style={styles.skillGapActionText}>View Full Analysis</Text>
            <ChevronRight size={14} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Discussions</Text>
            <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/(tabs)/discussions' as any)}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={Colors.accent} />
            </TouchableOpacity>
          </View>
          {trendingPosts.map(post => (
            <PostCard key={post.id} post={post} onPress={() => console.log('[Home] View post:', post.id)} />
          ))}
        </View>

        <TouchableOpacity style={styles.resumeCard} onPress={() => router.push('/resume-bot' as any)}>
          <BookOpen size={24} color={Colors.white} />
          <View style={styles.resumeContent}>
            <Text style={styles.resumeTitle}>Resume Bot</Text>
            <Text style={styles.resumeSubtitle}>AI-powered resume analysis & improvement tips</Text>
          </View>
          <ChevronRight size={20} color={Colors.white} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  contentGreeting: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  greetingText: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  userNameText: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: Colors.primaryDark,
    marginTop: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
  },
  greeting: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
  },
  headerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  welcomeCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  welcomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.white,
    marginBottom: spacing.xs,
  },
  welcomeText: {
    fontSize: fontSize.sm,
    color: Colors.white + 'CC',
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: Colors.accent,
    fontWeight: fontWeight.medium,
  },
  mentorList: {
    paddingRight: spacing.lg,
  },
  skillGapCard: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    ...shadow.sm,
  },
  skillGapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  skillGapTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  skillGapSubtitle: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: spacing.md,
  },
  skillBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skillBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 4,
  },
  skillPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  skillGapTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  missingTag: {
    backgroundColor: Colors.accent + '12',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.sm,
  },
  missingTagText: {
    fontSize: fontSize.xs,
    color: Colors.accent,
    fontWeight: fontWeight.medium,
  },
  skillGapAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillGapActionText: {
    fontSize: fontSize.sm,
    color: Colors.accent,
    fontWeight: fontWeight.semibold,
  },
  resumeCard: {
    backgroundColor: Colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  resumeContent: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.white,
  },
  resumeSubtitle: {
    fontSize: fontSize.sm,
    color: Colors.white + 'CC',
    marginTop: 2,
  },
});
