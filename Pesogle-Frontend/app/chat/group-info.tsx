import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { UserMinus, UserPlus, LogOut, Shield, Info, Trash2, UserCheck, Crown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { chatService } from '@/services/chatService';
import { profileService, type ProfileResponse } from '@/services/profileService';

// Cross-platform confirm: Alert.alert is a no-op on web, so use window.confirm there.
function confirmAction(title: string, message: string, onConfirm: () => void, confirmText = 'OK', isDestructive = false) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmText, style: isDestructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  }
}

export default function GroupInfoScreen() {
  const router = useRouter();
  const { id: chatId, name, ownerId, participants, admins } = useLocalSearchParams<{ 
    id: string; 
    name: string; 
    ownerId: string; 
    participants: string;
    admins: string;
  }>();
  
  const [members, setMembers] = useState<ProfileResponse[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [currentOwnerId, setCurrentOwnerId] = useState<string>(ownerId);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch current user profile
      const profile = await profileService.getProfile();
      setCurrentUserId(profile.user_id);

      // 2. Fetch fresh group thread data
      const threadRes = await chatService.getThread(chatId);
      if (threadRes.success && threadRes.data) {
        const thread = threadRes.data;
        
        // Update admin IDs and owner
        const threadAdmins = thread.admins || [];
        const threadOwner = thread.ownerId || '';
        const allAdminIds = Array.from(new Set([...threadAdmins, threadOwner].filter(id => !!id)));
        
        console.log('[GroupInfo] Thread Data:', { chatId, threadOwner, threadAdmins, allAdminIds });
        
        setAdminIds(allAdminIds);
        if (threadOwner) setCurrentOwnerId(threadOwner);
        
        // Fetch full profiles for all participants
        if (thread.participants && thread.participants.length > 0) {
          console.log('[GroupInfo] Participants:', thread.participants);
          const profilesMap = await profileService.getProfilesBulk(thread.participants);
          const memberList = Object.values(profilesMap);
          console.log('[GroupInfo] Resolved members:', memberList.length);
          setMembers(memberList);
        } else {
          setMembers([]);
        }
      } else {
        Alert.alert('Error', threadRes.message || 'Failed to load group details');
      }
    } catch (error) {
      console.error('[GroupInfo] Failed to fetch members:', error);
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [fetchMembers])
  );

  const handleMakeAdmin = (userId: string, userName: string) => {
    confirmAction(
      'Make Admin',
      `Are you sure you want to make ${userName} an admin?`,
      async () => {
        const res = await chatService.makeAdmin(chatId, userId);
        if (res.success) {
          fetchMembers();
          Alert.alert('Success', `${userName} is now an admin`);
        } else {
          Alert.alert('Error', res.message || 'Failed to promote member');
        }
      },
      'Make Admin'
    );
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    confirmAction(
      'Remove Member',
      `Are you sure you want to remove ${userName} from the group?`,
      async () => {
        const res = await chatService.removeGroupMember(chatId, userId);
        if (res.success) {
          fetchMembers();
          Alert.alert('Success', `${userName} has been removed from the group`);
        } else {
          Alert.alert('Error', res.message || 'Failed to remove member');
        }
      },
      'Remove',
      true
    );
  };

  const handleTransferOwnership = (userId: string, userName: string) => {
    confirmAction(
      'Transfer Ownership',
      `Are you sure you want to transfer ownership to ${userName}? You will stay as an admin but lose owner rights.`,
      async () => {
        const res = await chatService.transferOwner(chatId, userId);
        if (res.success) {
          fetchMembers();
          Alert.alert('Success', `Ownership transferred to ${userName}`);
        } else {
          Alert.alert('Error', res.message || 'Failed to transfer ownership');
        }
      },
      'Transfer',
      true
    );
  };

  const handleLeaveGroup = () => {
    confirmAction(
      'Leave Group',
      'Are you sure you want to leave this group?',
      async () => {
        if (currentUserId) {
          const res = await chatService.removeGroupMember(chatId, currentUserId);
          if (res.success) {
            router.replace('/connections' as any);
          } else {
            Alert.alert('Error', res.message || 'Failed to leave group');
          }
        }
      },
      'Leave',
      true
    );
  };

  const isMeAdmin = currentUserId ? adminIds.includes(currentUserId) : false;

  const renderMember = ({ item }: { item: ProfileResponse }) => {
    const isMe = item.user_id === currentUserId;
    const isItemAdmin = adminIds.includes(item.user_id);
    const isItemOwner = item.user_id === currentOwnerId;

    return (
      <View style={styles.memberItem}>
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=' + item.personal_info.full_name }} 
          style={styles.memberAvatar} 
        />
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName} numberOfLines={1}>{item.personal_info.full_name} {isMe && '(You)'}</Text>
          </View>
          <View style={styles.memberSubRow}>
            <Text style={styles.memberDept} numberOfLines={1}>{item.personal_info.institution}</Text>
            {(isItemAdmin || isItemOwner) && (
              <View style={[styles.adminBadge, isItemOwner && styles.ownerBadge]}>
                <Shield size={10} color={isItemOwner ? Colors.accent : Colors.textMuted} />
                <Text style={[styles.adminBadgeText, isItemOwner && styles.ownerBadgeText]}>
                  {isItemOwner ? 'Owner' : 'Admin'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.actions}>
          {isMeAdmin && !isMe && !isItemAdmin && (
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleMakeAdmin(item.user_id, item.personal_info.full_name)}
            >
              <UserCheck size={20} color={Colors.accent} />
            </TouchableOpacity>
          )}

          {currentUserId === currentOwnerId && !isMe && (
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleTransferOwnership(item.user_id, item.personal_info.full_name)}
            >
              <Crown size={20} color={Colors.warning || '#f1c40f'} />
            </TouchableOpacity>
          )}
          
          {isMeAdmin && !isMe && !isItemOwner && (
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleRemoveMember(item.user_id, item.personal_info.full_name)}
            >
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Group Info' }} />
      
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=' + name + '&size=128' }} 
          style={styles.groupAvatar} 
        />
        <Text style={styles.groupName}>{name}</Text>
        <Text style={styles.groupMeta}>Group Chat • {members.length} members</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Members</Text>
        {isMeAdmin && (
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => router.push({
              pathname: '/chat/add-member' as any,
              params: { 
                chatId, 
                participants: members.map(m => m.user_id).join(',') 
              }
            })}
          >
            <UserPlus size={18} color={Colors.accent} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveGroup}>
              <LogOut size={20} color={Colors.error} />
              <Text style={styles.leaveBtnText}>Leave Group</Text>
            </TouchableOpacity>
          }
        />
      )}

      {!isMeAdmin && (
        <View style={styles.infoCard}>
          <Info size={20} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            Only group admins can add or remove members and promote others.
          </Text>
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
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.borderLight,
    marginBottom: spacing.md,
  },
  groupName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  groupMeta: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: Colors.accent,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.borderLight,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberName: {
    maxWidth: '70%',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  memberDept: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  ownerBadge: {
    backgroundColor: 'rgba(57, 107, 240, 0.1)',
    borderColor: Colors.accent,
    borderWidth: 0.5,
  },
  ownerBadgeText: {
    color: Colors.accent,
  },
  memberSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  leaveBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.error,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
