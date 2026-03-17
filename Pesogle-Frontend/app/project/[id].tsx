import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList, TextInput, Alert, Modal, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type Project, type Task, type Member, type DocumentInfo } from '@/services/projectService';
import { profileService } from '@/services/profileService';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import TagChip from '@/components/TagChip';
import { CircleDot, CheckCircle2, Clock, Users, Plus, Edit2, Upload, FileText, X, Trash2, Send } from 'lucide-react-native';
import EmptyState from '@/components/EmptyState';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { Search } from 'lucide-react-native';

const TeamMemberItem = ({ userId, role, isLead, onRemove, onNameResolved }: { userId: string, role: string, isLead: boolean, onRemove: () => void, onNameResolved: (name: string) => void }) => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfileById(userId),
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  React.useEffect(() => {
    if (profile?.personal_info?.full_name) {
      onNameResolved(profile.personal_info.full_name);
    }
  }, [profile]);

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberAvatar}>
        <Users size={20} color={Colors.white} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {isLoading ? 'Loading...' : (profile?.personal_info?.full_name || `User: ${userId.substring(0,8)}...`)}
        </Text>
        <Text style={styles.memberRole}>{role.replace('_', ' ').toUpperCase()}</Text>
      </View>
      {isLead && (
        <TouchableOpacity onPress={onRemove} style={styles.deleteMemberBtn}>
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'documents'>('overview');
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  
  // New Task State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Edit Project State
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editTagsStr, setEditTagsStr] = useState('');

  // Viewing Document State
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  // Document Modal State
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [docModalMode, setDocModalMode] = useState<'upload' | 'edit'>('upload');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [targetDocId, setTargetDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docPhase, setDocPhase] = useState<string>('DRAFT');

  // Member Modal State
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{user_id: string, full_name: string, email: string}[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{user_id: string, full_name: string} | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<Member['role']>('student_member');



  const DOCUMENT_PHASES = [
    'DRAFT', 'ABSTRACT_SUBMITTED', 'ABSTRACT_APPROVED', 'IMPLEMENTATION', 
    'MID_REVIEW', 'FINAL_REPORT_SUBMITTED', 'COMPLETED', 'ARCHIVED'
  ];

  const MEMBER_ROLES: Member['role'][] = [
    'student_member', 'student_lead', 'faculty_guide', 'faculty_reviewer'
  ];

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id),
    enabled: !!id
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => projectService.getProjectTasks(id),
    enabled: !!id
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['project-members', id],
    queryFn: () => projectService.getProjectMembers(id),
    enabled: !!id
  });

  // PRE-FETCH MEMBER NAMES GLOBALLY
  const memberQueries = useQueries({
    queries: (members || []).map(m => ({
      queryKey: ['profile', m.user_id],
      queryFn: () => profileService.getProfileById(m.user_id),
      staleTime: 1000 * 60 * 5,
    }))
  });

  React.useEffect(() => {
    let changed = false;
    const newNames = { ...memberNames };
    
    memberQueries.forEach((q, idx) => {
      const uId = members?.[idx]?.user_id;
      const name = q.data?.personal_info?.full_name;
      if (uId && name && memberNames[uId] !== name) {
        newNames[uId] = name;
        changed = true;
      }
    });

    if (changed) {
      setMemberNames(newNames);
    }
  }, [memberQueries, members]);

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['project-documents', id],
    queryFn: () => projectService.getProjectDocuments(id),
    enabled: !!id
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile()
  });

  const myMember = members?.find(m => m.user_id === profile?.user_id);
  const isLead = myMember?.role === 'student_lead' || myMember?.role === 'faculty_guide';

  const createTaskMut = useMutation({
    mutationFn: () => projectService.createTask(id, {
      title: newTaskTitle,
      description: newTaskDesc,
      assigned_to: newTaskAssignees,
      priority: 'MEDIUM'
    }),
    onSuccess: () => {
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignees([]);
      setIsAddingTask(false);
      queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: (err) => {
      Alert.alert('Error', 'Failed to create task');
    }
  });

  const toggleTaskStatusMut = useMutation({
    mutationFn: ({ taskId, currentStatus }: { taskId: string, currentStatus: string }) => 
      projectService.updateTask(id, taskId, {
        status: currentStatus === 'DONE' ? 'TODO' : 'DONE'
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update task status');
    }
  });

  const addCommentMut = useMutation({
    mutationFn: (taskId: string) => projectService.addTaskComment(id, taskId, commentText),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add comment');
    }
  });
  
  const deleteCommentMut = useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string, commentId: string }) => 
      projectService.deleteTaskComment(id, taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', id] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete comment');
    }
  });

  const updateProjectMut = useMutation({
    mutationFn: () => {
      const tagsArray = editTagsStr.split(',').map(s => s.trim()).filter(Boolean);
      return projectService.updateProject(id, {
        abstract: editDesc, 
        domain: tagsArray
      } as any);
    },
    onSuccess: () => {
      setIsEditingProject(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update project details.');
    }
  });

  const handleMemberSearch = async (query: string) => {
    setMemberSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearchingMembers(true);
    try {
      const results = await profileService.searchProfiles(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const addMemberMut = useMutation({
    mutationFn: () => projectService.addMember(id, selectedUser!.user_id, newMemberRole),
    onSuccess: () => {
      setMemberSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setNewMemberRole('student_member');
      setIsMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['project-members', id] });
      Alert.alert('Success', 'Member added successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to add member';
      Alert.alert('Error', msg);
    }
  });


  const uploadDocMut = useMutation({
    mutationFn: (formData: FormData) => projectService.uploadDocument(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setIsDocModalVisible(false); // Assuming setIsUploadModalVisible is a typo and should be setIsDocModalVisible
      setSelectedFile(null); // Assuming resetUploadForm is a typo and should be setSelectedFile(null)
      Alert.alert('Success', 'Document uploaded successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to upload document.');
    }
  });

  const updateDocMut = useMutation({
    mutationFn: (formData: FormData) => projectService.updateDocument(id, targetDocId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setIsDocModalVisible(false);
      setTargetDocId(null);
      Alert.alert('Success', 'Document updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update document.');
    }
  });

  const deleteDocMut = useMutation({
    mutationFn: (docId: string) => projectService.deleteDocument(id, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      Alert.alert('Success', 'Document deleted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete document.');
    }
  });

  const removeMemberMut = useMutation({
    mutationFn: (userId: string) => projectService.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', id] });
      if (Platform.OS === 'web') {
        window.alert('Member removed successfully');
      } else {
        Alert.alert('Success', 'Member removed successfully');
      }
    },
    onError: () => {
      if (Platform.OS === 'web') {
        window.alert('Failed to remove member');
      } else {
        Alert.alert('Error', 'Failed to remove member');
      }
    }
  });

  if (projLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primaryDark} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Project not found.</Text>
      </View>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
      case 'ABSTRACT_SUBMITTED':
      case 'ABSTRACT_APPROVED':
        return { color: Colors.warning, label: 'Planning', icon: Clock };
      case 'IMPLEMENTATION':
      case 'MID_REVIEW':
      case 'FINAL_REPORT_SUBMITTED':
        return { color: Colors.success, label: 'Active', icon: CircleDot };
      case 'COMPLETED':
      case 'ARCHIVED':
        return { color: Colors.primaryDark, label: 'Completed', icon: CheckCircle2 };
      default:
        return { color: Colors.textMuted, label: status || 'Unknown', icon: CircleDot };
    }
  };

  const status = getStatusConfig(project.status);
  const StatusIcon = status.icon;
  const progressPercent = project.progress || 0;
  const tags = [...(project.domain || []), ...(project.tech_stack || [])];

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Validation', 'Task title is required');
      return;
    }
    createTaskMut.mutate();
  };

  const initEditProject = () => {
    setEditDesc(project.abstract || project.description || '');
    setEditTagsStr(tags.join(', '));
    setIsEditingProject(true);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // 50MB limit check
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size && file.size > MAX_SIZE) {
          Alert.alert('File Too Large', 'Maximum file size allowed is 50MB.');
          return;
        }

        setSelectedFile(file);
        setDocTitle(file.name || '');
        setDocPhase(project.status || 'DRAFT');
        setDocModalMode('upload');
        setIsDocModalVisible(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleDocumentSubmit = async () => {
    if (!docTitle.trim()) {
      Alert.alert('Validation', 'Document title is required');
      return;
    }

    const formData = new FormData();
    formData.append('title', docTitle);
    // Ensure docPhase is one of the valid enum values (underscored)
    formData.append('phase', docPhase);

    if (docModalMode === 'upload' && selectedFile) {
      if (Platform.OS === 'web') {
        let fileToUpload = selectedFile.file;
        if (!fileToUpload) {
          // If .file is missing, fetch the blob from uri
          const response = await fetch(selectedFile.uri);
          fileToUpload = await response.blob();
        }
        formData.append('file', fileToUpload, selectedFile.name);
      } else {
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/octet-stream'
        } as any);
      }
      uploadDocMut.mutate(formData);
    } else if (docModalMode === 'edit' && targetDocId) {
      updateDocMut.mutate(formData);
    }
  };

  const initEditDocument = (doc: DocumentInfo) => {
    setDocTitle(doc.title);
    setDocPhase(doc.phase);
    setTargetDocId(doc._id);
    setDocModalMode('edit');
    setIsDocModalVisible(true);
  };

  const handleDeleteDocument = (docId: string, title: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`);
      if (confirmed) {
        deleteDocMut.mutate(docId);
      }
    } else {
      Alert.alert(
        'Delete Document',
        `Are you sure you want to delete "${title}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => deleteDocMut.mutate(docId)
          }
        ]
      );
    }
  };

  const handleViewDocument = async (docId: string) => {
    try {
      setViewingDocId(docId);
      const details = await projectService.getDocumentDetails(id, docId);
      if (details.file_url) {
        if (Platform.OS === 'web') {
          window.open(details.file_url, '_blank');
        } else {
          Linking.openURL(details.file_url);
        }
      } else {
        Alert.alert('Error', 'Document link is not available.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not open document. You may not have permission.');
    } finally {
      setViewingDocId(null);
    }
  };

  const handleRemoveMember = (userId: string, name: string) => {
    if (userId === profile?.user_id) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to remove ${name} from the project?`);
      if (confirmed) {
        removeMemberMut.mutate(userId);
      }
    } else {
      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${name} from the project?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive', 
            onPress: () => removeMemberMut.mutate(userId) 
          }
        ]
      );
    }
  };

  const handleDeleteComment = (taskId: string, commentId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this comment?')) {
        deleteCommentMut.mutate({ taskId, commentId });
      }
    } else {
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteCommentMut.mutate({ taskId, commentId }) }
        ]
      );
    }
  };

  const getUserName = (userId: string) => {
    if (userId === profile?.user_id) return 'Me';
    return memberNames[userId] || userId.substring(0, 8);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Project Room', headerBackTitle: 'Back' }} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{project.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <StatusIcon size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressValue}>{Math.round(progressPercent)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'team' && styles.activeTab]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>Team</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>Documents</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentScroll}>
        
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Description</Text>
              {!project.locked && (
                <TouchableOpacity onPress={initEditProject} style={styles.iconBtn}>
                  <Edit2 size={16} color={Colors.textSecondary} />
                  <Text style={styles.iconBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.description}>{project.description || (project as any).abstract}</Text>
            
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Tags & Tech Stack</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag, idx) => (
                <TagChip key={`${tag}-${idx}`} label={tag} small />
              ))}
            </View>
          </View>
        )}

        {activeTab === 'tasks' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Project Tasks</Text>
              {!project.locked && (
                <TouchableOpacity onPress={() => setIsAddingTask(!isAddingTask)} style={styles.addBtn}>
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.addBtnText}>Add Task</Text>
                </TouchableOpacity>
              )}
            </View>

            {isAddingTask && (
              <View style={styles.addTaskForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Task Title"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Task Description"
                  value={newTaskDesc}
                  onChangeText={setNewTaskDesc}
                  multiline
                />
                <Text style={styles.inputLabel}>Assign Members</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assigneeSelector}>
                  {members?.map(member => (
                    <TouchableOpacity 
                      key={member.user_id}
                      style={[
                        styles.assigneeChip, 
                        newTaskAssignees.includes(member.user_id) && styles.assigneeChipSelected
                      ]}
                      onPress={() => {
                        if (newTaskAssignees.includes(member.user_id)) {
                          setNewTaskAssignees(newTaskAssignees.filter(id => id !== member.user_id));
                        } else {
                          setNewTaskAssignees([...newTaskAssignees, member.user_id]);
                        }
                      }}
                    >
                      <Text style={[styles.assigneeChipText, newTaskAssignees.includes(member.user_id) && styles.assigneeChipTextSelected]}>
                        {getUserName(member.user_id)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity 
                  style={styles.submitTaskBtn}
                  onPress={() => createTaskMut.mutate()}
                  disabled={createTaskMut.isPending || !newTaskTitle}
                >
                  <Text style={styles.submitTaskBtnText}>
                    {createTaskMut.isPending ? 'Saving...' : 'Save Task'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {tasksLoading ? (
              <ActivityIndicator color={Colors.primaryDark} style={{ marginTop: spacing.md }} />
            ) : tasks?.length === 0 ? (
              <EmptyState 
                title="No Tasks" 
                description="Get started by creating the first task." 
                imageSource={require('@/assets/images/no_tasks.png')} 
                actionLabel="Add Task"
                onAction={() => setIsAddingTask(true)}
              />
            ) : (
              tasks?.map(task => (
                <View key={task._id} style={[styles.taskCard, task.status === 'DONE' && styles.taskCardDone]}>
                  <View style={styles.taskHeader}>
                    <TouchableOpacity 
                      style={styles.taskCheckWrapper}
                      onPress={() => toggleTaskStatusMut.mutate({ taskId: task._id, currentStatus: task.status })}
                    >
                      <View style={[styles.taskCheckbox, task.status === 'DONE' && styles.taskCheckboxChecked]}>
                        {task.status === 'DONE' && <CheckCircle2 size={14} color={Colors.white} />}
                      </View>
                    </TouchableOpacity>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, task.status === 'DONE' && styles.taskTitleDone]}>
                        {task.title}
                      </Text>
                      <View style={styles.taskAssigneesRow}>
                        {task.assigned_to?.map(uid => (
                          <View key={uid} style={styles.miniAssigneeTag}>
                            <Text style={styles.miniAssigneeTagText}>
                              {getUserName(uid)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity 
                      onPress={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                      style={styles.commentToggle}
                    >
                      <FileText size={18} color={Colors.textMuted} />
                      <Text style={styles.commentCountText}>{task.comments?.length || 0}</Text>
                    </TouchableOpacity>
                  </View>

                  {task.description ? (
                    <Text style={[styles.taskDesc, task.status === 'DONE' && styles.taskDescDone]}>
                      {task.description}
                    </Text>
                  ) : null}

                  {expandedTaskId === task._id && (
                    <View style={styles.commentsSection}>
                      <View style={styles.commentsList}>
                        {task.comments?.map((comment, idx) => (
                          <View key={idx} style={styles.commentItem}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.commentUser}>
                                  {getUserName(comment.user_id)}
                                </Text>
                                <Text style={styles.commentContent}>{comment.content}</Text>
                              </View>
                              {(comment.user_id === profile?.user_id || isLead) && (
                                <TouchableOpacity 
                                  onPress={() => handleDeleteComment(task._id, comment.id)}
                                  disabled={deleteCommentMut.isPending}
                                  style={{ padding: 4 }}
                                >
                                  <Trash2 size={12} color={Colors.error} />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ))}
                        {(!task.comments || task.comments.length === 0) && (
                          <Text style={styles.noCommentsText}>No internal comments yet.</Text>
                        )}
                      </View>
                      
                      <View style={styles.commentInputRow}>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="Add a comment..."
                          value={commentText}
                          onChangeText={setCommentText}
                          multiline
                        />
                        <TouchableOpacity 
                          style={styles.sendCommentBtn}
                          onPress={() => addCommentMut.mutate(task._id)}
                          disabled={!commentText || addCommentMut.isPending}
                        >
                          {addCommentMut.isPending ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                          ) : (
                            <Send size={20} color={Colors.white} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'team' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Team Members</Text>
              {isLead && (
                <TouchableOpacity onPress={() => setIsMemberModalVisible(true)} style={styles.addBtn}>
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.addBtnText}>Add Member</Text>
                </TouchableOpacity>
              )}
            </View>

            {membersLoading ? (
              <ActivityIndicator color={Colors.primaryDark} style={{ marginTop: spacing.md }} />
            ) : members?.length === 0 ? (
              <EmptyState title="No Members" description="This project has no active members." icon={<Users size={32} color={Colors.primaryDark} />} />
            ) : (
              members?.map(member => (
                <TeamMemberItem 
                  key={member._id} 
                  userId={member.user_id} 
                  role={member.role} 
                  isLead={isLead && member.user_id !== profile?.user_id}
                  onRemove={() => handleRemoveMember(member.user_id, memberNames[member.user_id] || member.user_id.substring(0,8))}
                  onNameResolved={(name) => setMemberNames(prev => ({ ...prev, [member.user_id]: name }))}
                />
              ))
            )}

          </View>
        )}

        {activeTab === 'documents' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Project Documents</Text>
              {!project.locked && (
                <TouchableOpacity onPress={handlePickDocument} style={styles.addBtn} disabled={uploadDocMut.isPending}>
                  {uploadDocMut.isPending ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Upload size={16} color={Colors.white} />
                      <Text style={styles.addBtnText}>Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {docsLoading ? (
              <ActivityIndicator color={Colors.primaryDark} style={{ marginTop: spacing.md }} />
            ) : documents?.length === 0 ? (
              <EmptyState 
                title="No Documents" 
                description="Upload project abstracts and files here." 
                imageSource={require('@/assets/images/no_documents.png')} 
                actionLabel="Upload"
                onAction={handlePickDocument}
              />
            ) : (
              documents?.map(doc => (
                <View key={doc._id} style={styles.taskCard}>
                  <TouchableOpacity 
                    style={styles.taskHeader}
                    onPress={() => handleViewDocument(doc._id)}
                    disabled={viewingDocId === doc._id}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <FileText size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                      <Text style={styles.taskTitle}>{doc.file_name || doc.title}</Text>
                      {viewingDocId === doc._id && <ActivityIndicator size="small" color={Colors.primaryDark} style={{ marginLeft: 8 }} />}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity onPress={() => initEditDocument(doc)} style={styles.iconBtn}>
                        <Edit2 size={14} color={Colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteDocument(doc._id, doc.title)} style={styles.iconBtn}>
                        <Trash2 size={14} color={Colors.error} />
                      </TouchableOpacity>
                      <View style={styles.taskStatusBadge}>
                        <Text style={styles.taskStatusText}>{doc.phase.replace('_', ' ')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.taskDesc}>Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</Text>
                  {doc.feedback && (
                    <Text style={[styles.taskDesc, { color: doc.approved ? Colors.success : Colors.error, marginTop: 4 }]}>
                      Feedback: {doc.feedback}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* Edit Project Modal */}
      <Modal visible={isEditingProject} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Project Details</Text>
              <TouchableOpacity onPress={() => setIsEditingProject(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Description / Abstract</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                placeholder="Describe your project"
              />

              <Text style={styles.inputLabel}>Tags & Tech Stack (comma separated)</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={editTagsStr}
                onChangeText={setEditTagsStr}
                multiline
                placeholder="React, MongoDB, AI"
              />

              <TouchableOpacity 
                style={[styles.submitTaskBtn, { marginTop: spacing.md }]} 
                onPress={() => updateProjectMut.mutate()}
                disabled={updateProjectMut.isPending}
              >
                <Text style={styles.submitTaskBtnText}>{updateProjectMut.isPending ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Document Detail/Edit Modal */}
      <Modal visible={isDocModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{docModalMode === 'upload' ? 'Upload Document' : 'Edit Document Details'}</Text>
              <TouchableOpacity onPress={() => setIsDocModalVisible(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Document Title</Text>
              <TextInput
                style={styles.input}
                value={docTitle}
                onChangeText={setDocTitle}
                placeholder="Enter title"
              />

              <Text style={styles.inputLabel}>Phase / Status</Text>
              <View style={styles.tagsContainer}>
                {DOCUMENT_PHASES.map((phase) => (
                  <TouchableOpacity 
                    key={phase} 
                    style={[
                      styles.statusSelectBtn, 
                      docPhase === phase && styles.statusSelectBtnActive
                    ]}
                    onPress={() => setDocPhase(phase)}
                  >
                    <Text style={[
                      styles.statusSelectText,
                      docPhase === phase && styles.statusSelectTextActive
                    ]}>{phase.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.submitTaskBtn, { marginTop: spacing.xl }]} 
                onPress={handleDocumentSubmit}
                disabled={uploadDocMut.isPending || updateDocMut.isPending}
              >
                <Text style={styles.submitTaskBtnText}>
                  {uploadDocMut.isPending || updateDocMut.isPending ? 'Processing...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Member Management Modal */}
      <Modal
        visible={isMemberModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsMemberModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Team Member</Text>
              <TouchableOpacity onPress={() => setIsMemberModalVisible(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Search by Name</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={[styles.input, { marginBottom: 0, flex: 1 }]}
                  placeholder="Type name to search..."
                  value={selectedUser ? selectedUser.full_name : memberSearchQuery}
                  onChangeText={handleMemberSearch}
                  autoCapitalize="none"
                  editable={!selectedUser}
                />
                {selectedUser && (
                  <TouchableOpacity 
                    onPress={() => setSelectedUser(null)} 
                    style={{ position: 'absolute', right: 10, top: 12 }}
                  >
                    <X size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {!selectedUser && memberSearchQuery.length >= 3 && (
                <View style={styles.searchResultsContainer}>
                  {isSearchingMembers ? (
                    <ActivityIndicator size="small" color={Colors.accent} style={{ padding: 10 }} />
                  ) : searchResults.length === 0 ? (
                    <Text style={styles.noResultsText}>No users found</Text>
                  ) : (
                    searchResults.map(user => (
                      <TouchableOpacity 
                        key={user.user_id} 
                        style={styles.searchResultItem}
                        onPress={() => setSelectedUser({ user_id: user.user_id, full_name: user.full_name })}
                      >
                        <Text style={styles.searchResultName}>{user.full_name}</Text>
                        <Text style={styles.searchResultEmail}>{user.email}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              <Text style={[styles.inputLabel, { marginTop: spacing.lg }]}>Select Role</Text>
              <View style={styles.statusSelectContainer}>
                {MEMBER_ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.statusSelectBtn,
                      newMemberRole === role && styles.statusSelectBtnActive
                    ]}
                    onPress={() => setNewMemberRole(role)}
                  >
                    <Text style={[
                      styles.statusSelectText,
                      newMemberRole === role && styles.statusSelectTextActive
                    ]}>
                      {role.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.submitTaskBtn, { marginTop: spacing.xl }]} 
                onPress={() => addMemberMut.mutate()}
                disabled={addMemberMut.isPending || !selectedUser}
              >
                <Text style={styles.submitTaskBtnText}>
                  {addMemberMut.isPending ? 'Adding...' : 'Add Member'}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: Colors.error,
  },
  header: {
    backgroundColor: Colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginRight: spacing.md,
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
    fontWeight: fontWeight.bold,
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  progressValue: {
    fontSize: fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryDark,
    borderRadius: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: fontSize.md,
    color: Colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  activeTabText: {
    color: Colors.accent,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  contentScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: spacing.md,
    fontFamily: 'Norwester',
  },
  description: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  iconBtnText: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  addTaskForm: {
    backgroundColor: Colors.primaryBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitTaskBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  submitTaskBtnText: {
    color: Colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  taskCard: {
    backgroundColor: Colors.primaryBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  taskTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
    marginRight: spacing.sm,
  },
  taskStatusBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskStatusText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: fontWeight.bold,
  },
  taskDesc: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    marginTop: spacing.xs,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
  },
  memberRole: {
    fontSize: fontSize.sm,
    color: Colors.accent,
    fontWeight: fontWeight.medium,
    marginTop: 2,
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
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  statusSelectBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: spacing.xs,
  },
  statusSelectBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  assigneeSelector: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  assigneeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: spacing.xs,
  },
  assigneeChipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  assigneeChipText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: fontWeight.bold,
  },
  assigneeChipTextSelected: {
    color: Colors.white,
  },
  taskCardDone: {
    opacity: 0.6,
    borderLeftColor: Colors.textMuted,
  },
  taskCheckWrapper: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxChecked: {
    backgroundColor: Colors.accent,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskDescDone: {
    textDecorationLine: 'line-through',
  },
  taskAssigneesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  miniAssigneeTag: {
    backgroundColor: Colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  miniAssigneeTagText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: Colors.textSecondary,
  },
  commentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  commentCountText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: fontWeight.bold,
  },
  commentsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  commentsList: {
    marginBottom: spacing.md,
  },
  commentItem: {
    backgroundColor: Colors.white,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  commentUser: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: Colors.accent,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  noCommentsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    maxHeight: 60,
  },
  sendCommentBtn: {
    backgroundColor: Colors.primaryDark,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteMemberBtn: {
    padding: spacing.xs,
  },
  statusSelectText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  statusSelectTextActive: {
    color: Colors.white,
    fontWeight: fontWeight.bold,
  },
  statusSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  searchResultsContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: borderRadius.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    maxHeight: 200,
    overflow: 'hidden',
    ...shadow.sm,
  },
  searchResultItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  searchResultName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
  },
  searchResultEmail: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  noResultsText: {
    padding: spacing.md,
    textAlign: 'center',
    color: Colors.textMuted,
    fontStyle: 'italic',
  }
});
