import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import ProjectCard from '@/components/ProjectCard';
import TagChip from '@/components/TagChip';
import { mockProjects } from '@/mocks/projects';
import type { Project } from '@/mocks/projects';

const statusFilters = ['All', 'Active', 'Planning', 'Completed'];

export default function ProjectsScreen() {
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredProjects = statusFilter === 'All'
    ? mockProjects
    : mockProjects.filter(p => p.status === statusFilter.toLowerCase());

  const handleCreateProject = useCallback(() => {
    Alert.alert('Create Project', 'Project creation coming soon!');
  }, []);

  const renderProject = useCallback(({ item }: { item: Project }) => (
    <ProjectCard project={item} onPress={() => console.log('[Projects] View project:', item.id)} />
  ), []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Project Rooms',
          headerRight: () => (
            <TouchableOpacity style={styles.addBtn} onPress={handleCreateProject}>
              <Plus size={20} color={Colors.white} />
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        data={filteredProjects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.filterRow}>
            {statusFilters.map(status => (
              <TagChip
                key={status}
                label={status}
                selected={statusFilter === status}
                onPress={() => setStatusFilter(status)}
                small
              />
            ))}
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
  addBtn: {
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: spacing.md,
  },
});
