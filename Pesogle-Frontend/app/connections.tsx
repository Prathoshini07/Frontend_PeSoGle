import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectService, type ConnectRequest } from '@/services/connectService';
import type { User } from '@/mocks/users';
import { useRouter, Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import { Check, X, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { spacing, borderRadius, fontSize, fontWeight, shadow } from '@/constants/theme';


export default function ConnectionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'chats' | 'pending' | 'blocked'>('chats');

  const { data: connections = [], isLoading: isLoadingConnections, refetch: refetchConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectService.getConnectionsWithProfiles().then(res => res.data),
  });

  const { data: incomingRequests = [], isLoading: isLoadingIncoming, refetch: refetchIncoming } = useQuery({
    queryKey: ['connection-requests-incoming'],
    queryFn: () => connectService.getIncomingRequestsWithProfiles().then(res => res.data.map(req => ({
      ...req,
      user: req.sender,
      type: 'incoming' as const
    }))),
  });

  const { data: outgoingRequests = [], isLoading: isLoadingOutgoing, refetch: refetchOutgoing } = useQuery({
    queryKey: ['connection-requests-outgoing'],
    queryFn: () => connectService.getOutgoingRequestsWithProfiles().then(res => res.data.map(req => ({
      ...req,
      user: req.receiver,
      type: 'outgoing' as const
    }))),
    enabled: tab === 'pending',
  });

  const [pendingSubTab, setPendingSubTab] = useState<'received' | 'sent'>('received');


  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => connectService.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['connection-requests-incoming'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => connectService.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests-incoming'] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => connectService.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      setTab('chats');
    },
  });


  const { data: blockedUsers = [], isLoading: isLoadingBlocked, refetch: refetchBlocked } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => connectService.getBlockedUsersWithProfiles().then(res => res.data),
    enabled: tab === 'blocked',
  });


  const renderThread = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.threadItem}
      onPress={() => router.push({ pathname: '/chat/[id]' as any, params: { id: item.id, name: item.name } })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.avatar }} style={styles.threadAvatar} />
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName}>{item.name}</Text>
          <Text style={styles.threadTime}>Connected</Text>
        </View>
      </View>
      <MessageCircle size={20} color={Colors.primaryDark} style={{ opacity: 0.6 }} />
    </TouchableOpacity>
  ), [router]);

  const renderPendingItem = useCallback(({ item }: { item: ConnectRequest & { user: User; type: 'incoming' | 'outgoing' } }) => (
    <View style={styles.pendingItem}>
      <Image source={{ uri: item.user.avatar }} style={styles.pendingAvatar} />
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName}>{item.user.name}</Text>
        <Text style={styles.pendingDept}>{item.user.department}</Text>
      </View>
      {item.type === 'incoming' ? (
        <>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => acceptMutation.mutate(item.request_id)}
          >
            <Check size={18} color={Colors.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => rejectMutation.mutate(item.request_id)}
          >
            <X size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.sentLabel}>
          <Text style={styles.sentLabelText}>Sent</Text>
        </View>
      )}
    </View>
  ), [acceptMutation, rejectMutation]);


  const renderBlocked = useCallback(({ item }: { item: User }) => (
    <View style={styles.threadItem}>
      <Image source={{ uri: item.avatar }} style={styles.threadAvatar} />
      <View style={styles.threadContent}>
        <Text style={styles.threadName}>{item.name}</Text>
        <Text style={styles.threadTime}>Blocked</Text>
      </View>
      <TouchableOpacity
        style={styles.unblockBtn}
        onPress={() => unblockMutation.mutate(item.id)}
      >
        <Text style={styles.unblockBtnText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  ), [unblockMutation]);


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Connections' }} />
      <View style={styles.tabRow}>
        {(['chats', 'pending', 'blocked'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'chats' && (
        <FlatList
          data={connections}
          renderItem={renderThread}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, connections.length === 0 && { flexGrow: 1 }]}
          refreshing={isLoadingConnections}
          onRefresh={refetchConnections}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No connections yet. Find peers on the Matches tab!</Text>
            </View>
          }
        />
      )}
      {tab === 'pending' && (
        <>
          <View style={styles.subTabRow}>
            <TouchableOpacity 
              style={[styles.subTab, pendingSubTab === 'received' && styles.subTabActive]}
              onPress={() => setPendingSubTab('received')}
            >
              <Text style={[styles.subTabText, pendingSubTab === 'received' && styles.subTabTextActive]}>Received</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.subTab, pendingSubTab === 'sent' && styles.subTabActive]}
              onPress={() => setPendingSubTab('sent')}
            >
              <Text style={[styles.subTabText, pendingSubTab === 'sent' && styles.subTabTextActive]}>Sent</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={pendingSubTab === 'received' ? incomingRequests : outgoingRequests}
            renderItem={renderPendingItem}
            keyExtractor={(item) => item.request_id}
            contentContainerStyle={[styles.list, (pendingSubTab === 'received' ? incomingRequests.length : outgoingRequests.length) === 0 && { flexGrow: 1 }]}
            refreshing={pendingSubTab === 'received' ? isLoadingIncoming : isLoadingOutgoing}
            onRefresh={pendingSubTab === 'received' ? refetchIncoming : refetchOutgoing}

            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {pendingSubTab === 'received' ? 'No pending requests received' : 'No requests sent yet'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {tab === 'blocked' && (
        <FlatList
          data={blockedUsers}
          renderItem={renderBlocked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, blockedUsers.length === 0 && { flexGrow: 1 }]}
          refreshing={isLoadingBlocked}
          onRefresh={refetchBlocked}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No blocked connections</Text>
            </View>
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  tabActive: {
    backgroundColor: Colors.primaryDark,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  threadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.borderLight,
  },
  threadContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  threadName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  threadTime: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
  },
  threadMessage: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: Colors.white,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  pendingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.borderLight,
  },
  pendingInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pendingName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: Colors.primaryDark,
  },
  pendingDept: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  subTab: {
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: Colors.primaryDark,
  },
  subTabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.textMuted,
  },
  subTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: fontWeight.bold,
  },
  sentLabel: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: borderRadius.sm,
  },
  sentLabelText: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  emptyState: {

    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: Colors.textMuted,
  },
  unblockBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unblockBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: Colors.primaryDark,
  },
});

