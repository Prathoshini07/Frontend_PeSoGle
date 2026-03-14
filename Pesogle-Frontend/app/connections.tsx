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

  const { data: requests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['connection-requests'],
    queryFn: () => connectService.getIncomingRequestsWithProfiles().then(res => res.data),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => connectService.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => connectService.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
    },
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
        <Text style={styles.threadMessage} numberOfLines={1}>{item.bio}</Text>
      </View>
      <MessageCircle size={20} color={Colors.primaryDark} style={{ opacity: 0.6 }} />
    </TouchableOpacity>
  ), [router]);

  const renderPending = useCallback(({ item }: { item: ConnectRequest & { sender: User } }) => (
    <View style={styles.pendingItem}>
      <Image source={{ uri: item.sender.avatar }} style={styles.pendingAvatar} />
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName}>{item.sender.name}</Text>
        <Text style={styles.pendingDept}>{item.sender.department}</Text>
      </View>
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
    </View>
  ), [acceptMutation, rejectMutation]);

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
          contentContainerStyle={styles.list}
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
        <FlatList
          data={requests}
          renderItem={renderPending}
          keyExtractor={(item) => item.request_id}
          contentContainerStyle={styles.list}
          refreshing={isLoadingRequests}
          onRefresh={refetchRequests}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
        />
      )}
      {tab === 'blocked' && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No blocked connections</Text>
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: Colors.textMuted,
  },
});
