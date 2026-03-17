import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Text, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, Search, X, Folder } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import ProjectCard from '@/components/ProjectCard';
import TagChip from '@/components/TagChip';
import { projectService, type Project } from '@/services/projectService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/EmptyState';

const statusFilters = ['All', 'Active', 'Planning', 'Completed'];

export default function ProjectsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Create Project Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [techStack, setTechStack] = useState('');

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectService.getMyProjects()
  });

  const createProjectMutation = useMutation({
    mutationFn: () => projectService.createProject({
      title,
      abstract: description,
      domain: domain.split(',').map(s => s.trim()).filter(s => s !== ''),
      tech_stack: techStack.split(',').map(s => s.trim()).filter(s => s !== '')
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setIsModalVisible(false);
      resetForm();
      router.push(`/project/${data.project_id}` as any);
      Alert.alert('Success', 'Project created successfully!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create project.');
    }
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDomain('');
    setTechStack('');
  };

  const getFilteredProjects = () => {
    if (!projects) return [];
    
    if (statusFilter === 'All') return projects;
    
    return projects.filter(p => {
      switch (statusFilter) {
        case 'Planning':
          return ['DRAFT', 'ABSTRACT_SUBMITTED', 'ABSTRACT_APPROVED'].includes(p.status);
        case 'Active':
          return ['IMPLEMENTATION', 'MID_REVIEW', 'FINAL_REPORT_SUBMITTED'].includes(p.status);
        case 'Completed':
          return ['COMPLETED', 'ARCHIVED'].includes(p.status);
        default:
          return true;
      }
    });
  };

  const filteredProjects = getFilteredProjects();

  const handleCreateProject = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const renderProject = useCallback(({ item }: { item: Project }) => (
    <ProjectCard project={item} onPress={() => router.push(`/project/${item._id}` as any)} />
  ), [router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Project Rooms',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/projects/explore' as any)}>
                <Search size={20} color={Colors.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.addBtn]} onPress={handleCreateProject}>
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          renderItem={renderProject}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title="No Projects Found"
              description={`You don't have any ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} projects yet.`}
              icon={<Folder size={32} color={Colors.primaryDark} />}
            />
          }
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
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Project</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. AI Matching System"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about the project..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Domains (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. AI, Machine Learning"
                value={domain}
                onChangeText={setDomain}
              />

              <Text style={styles.label}>Tech Stack (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. React, Python, MongoDB"
                value={techStack}
                onChangeText={setTechStack}
              />

              <TouchableOpacity 
                style={[styles.submitBtn, createProjectMutation.isPending && styles.submitBtnDisabled]}
                onPress={() => createProjectMutation.mutate()}
                disabled={createProjectMutation.isPending || !title || !description}
              >
                <Text style={styles.submitBtnText}>
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: Colors.accent,
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  modalForm: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: Colors.primaryBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  }
});
