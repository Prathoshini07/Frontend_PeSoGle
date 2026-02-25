import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Check, X, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { mockThreads, type ChatThread } from '@/services/chatService';

type ConnectionTab = 'chats' | 'pending' | 'blocked';

const pendingConnections = [
  { id: 'p1', name: 'Dr. Sarah Chen', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face', department: 'Computer Science' },
  { id: 'p2', name: 'Michael Wright', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', department: 'Computer Science' },
];

export default function ConnectionsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<ConnectionTab>('chats');

  const renderThread = useCallback(({ item }: { item: ChatThread }) => (
    <TouchableOpacity
      style={styles.threadItem}
      onPress={() => router.push({ pathname: '/chat/[id]' as any, params: { id: item.id, name: item.participantName } })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.participantAvatar }} style={styles.threadAvatar} />
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName}>{item.participantName}</Text>
          <Text style={styles.threadTime}>{item.lastMessageTime}</Text>
        </View>
        <Text style={styles.threadMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  ), [router]);

  const renderPending = useCallback(({ item }: { item: typeof pendingConnections[0] }) => (
    <View style={styles.pendingItem}>
      <Image source={{ uri: item.avatar }} style={styles.pendingAvatar} />
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName}>{item.name}</Text>
        <Text style={styles.pendingDept}>{item.department}</Text>
      </View>
      <TouchableOpacity style={styles.acceptBtn}>
        <Check size={18} color={Colors.success} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.rejectBtn}>
        <X size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Connections' }} />
      <View style={styles.tabRow}>
        {(['chats', 'pending', 'blocked'] as ConnectionTab[]).map(t => (
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
          data={mockThreads}
          renderItem={renderThread}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
      {tab === 'pending' && (
        <FlatList
          data={pendingConnections}
          renderItem={renderPending}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
