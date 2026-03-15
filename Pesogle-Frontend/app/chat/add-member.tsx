import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Check, Search, UserPlus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { chatService } from '@/services/chatService';
import { connectService } from '@/services/connectService';
import { profileService, type ProfileResponse } from '@/services/profileService';

export default function AddMemberScreen() {
  const router = useRouter();
  const { chatId, participants } = useLocalSearchParams<{ chatId: string; participants: string }>();
  const [connections, setConnections] = useState<ProfileResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentParticipantIds = participants ? participants.split(',') : [];

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const idsRes = await connectService.getConnectionIds();
        if (idsRes.success && idsRes.data.length > 0) {
          // Filter out existing participants
          const filteredIds = idsRes.data.filter(id => !currentParticipantIds.includes(id));
          if (filteredIds.length > 0) {
            const profilesMap = await profileService.getProfilesBulk(filteredIds);
            setConnections(Object.values(profilesMap));
          } else {
            setConnections([]);
          }
        }
      } catch (error) {
        console.error('[AddMember] Failed to load connections:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConnections();
  }, [participants]);

  const toggleMember = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Selection', 'Please select at least one person to add');
      return;
    }

    setAdding(true);
    try {
      let successCount = 0;
      for (const userId of selectedIds) {
        const res = await chatService.addGroupMember(chatId, userId);
        if (res.success) successCount++;
      }

      if (successCount > 0) {
        Alert.alert('Success', `Added ${successCount} member(s) to the group`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to add members');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setAdding(false);
    }
  };

  const filteredConnections = connections.filter(c => 
    c.personal_info.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMember = useCallback(({ item }: { item: ProfileResponse }) => {
    const isSelected = selectedIds.includes(item.user_id);
    return (
      <TouchableOpacity 
        style={[styles.memberItem, isSelected && styles.memberItemSelected]}
        onPress={() => toggleMember(item.user_id)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=' + item.personal_info.full_name }} 
          style={styles.avatar} 
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.personal_info.full_name}</Text>
          <Text style={styles.memberDept}>{item.personal_info.institution}</Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
          {isSelected && <Check size={14} color={Colors.white} />}
        </View>
      </TouchableOpacity>
    );
  }, [selectedIds]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Add Members',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleAdd} 
              disabled={adding || selectedIds.length === 0}
              style={{ opacity: (adding || selectedIds.length === 0) ? 0.5 : 1 }}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search connections..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.membersHeader}>
        <Text style={styles.membersTitle}>Select Connections</Text>
        <Text style={styles.membersCount}>{selectedIds.length} selected</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredConnections}
          renderItem={renderMember}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {connections.length === 0 ? "All your connections are already in this group." : "No matches found."}
              </Text>
            </View>
          }
        />
      )}

      {adding && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={Colors.white} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  addBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.accent,
    marginRight: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadow.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.textPrimary,
    fontSize: fontSize.md,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  membersTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  membersCount: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadow.sm,
  },
  memberItemSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '05',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.borderLight,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  memberDept: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
