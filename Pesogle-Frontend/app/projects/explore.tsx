import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import ProjectCard from '@/components/ProjectCard';
import { projectService, type Project } from '@/services/projectService';
import { useQuery } from '@tanstack/react-query';
import EmptyState from '@/components/EmptyState';

export default function ExploreProjectsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['explore-projects', submittedQuery],
    queryFn: () => projectService.getExploreProjects(submittedQuery)
  });

  const handleSearch = () => {
    setSubmittedQuery(searchQuery);
  };

  const renderProject = useCallback(({ item }: { item: Project }) => (
    <ProjectCard project={item} onPress={() => router.push(`/project/${item._id}` as any)} />
  ), [router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Explore Ideas',
          headerBackTitle: 'Projects',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.primaryBg },
        }}
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search completed projects & ideas..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      ) : (
        <FlatList
          data={projects || []}
          renderItem={renderProject}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title={submittedQuery ? "No matching projects" : "Explore amazing ideas"}
              description={submittedQuery ? `No archived projects match "${submittedQuery}".` : "Search to explore past projects and get inspired."}
              icon={<Search size={32} color={Colors.primaryDark} />}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  searchContainer: {
    padding: spacing.lg,
    paddingTop: 0,
    backgroundColor: Colors.primaryBg,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: fontSize.md,
    color: Colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
