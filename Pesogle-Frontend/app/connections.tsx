import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Check, X, MessageCircle, Search, UserPlus, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { chatService, type ChatThread } from '@/services/chatService';
import { connectService, type ConnectionRequest } from '@/services/connectService';
import { profileService, type ProfileResponse } from '@/services/profileService';

type ConnectionTab = 'chats' | 'pending' | 'search';

export default function ConnectionsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<ConnectionTab>('chats');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [searchResults, setSearchResults] = useState<ProfileResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [threadsRes, pendingRes, outgoingRes, idsRes] = await Promise.all([
        chatService.getThreads(),
        connectService.getIncomingRequests(),
        connectService.getOutgoingRequests(),
        connectService.getConnectionIds()
      ]);
      if (threadsRes.success) setThreads(threadsRes.data);
      if (pendingRes.success) setPendingRequests(pendingRes.data);
      if (outgoingRes.success) setOutgoingRequests(outgoingRes.data);
      if (idsRes.success) setConnectedIds(idsRes.data);
    } catch (error) {
      console.error('[Connections] Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await profileService.searchProfiles(query);
      setSearchResults(results);
    } catch (error) {
      console.error('[Connections] Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    const res = await connectService.acceptRequest(id);
    if (res.success) fetchData();
  };

  const handleReject = async (id: string) => {
    const res = await connectService.rejectRequest(id);
    if (res.success) fetchData();
  };

  const handleInvite = async (userId: string) => {
    const res = await connectService.sendRequest(userId);
    if (res.success) {
      alert('Invite sent!');
      fetchData();
    } else {
      Alert.alert('Connection Request', res.message || 'Failed to send invite');
    }
  };

  const handleStartChat = async (userId: string, name: string) => {
    const res = await chatService.getOrCreateIndividualThread(userId);
    if (res.success) {
      router.push({ pathname: '/chat/[id]' as any, params: { id: res.data.id, name } });
    } else {
      Alert.alert('Unable to start chat', res.message || 'Make sure you are connected first.');
    }
  };

  const renderThread = useCallback(({ item }: { item: ChatThread }) => (
    <TouchableOpacity
      style={styles.threadItem}
      onPress={() => router.push({ 
        pathname: '/chat/[id]' as any, 
        params: { 
          id: item.id, 
          name: item.participantName, 
          type: item.type, 
          ownerId: item.ownerId,
          participants: item.participants?.join(','),
          admins: item.admins?.join(',')
        } 
      })}
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

  const renderPending = useCallback(({ item }: { item: ConnectionRequest }) => (
    <View style={styles.pendingItem}>
      <Image source={{ uri: `https://ui-avatars.com/api/?name=${item.sender_id}` }} style={styles.pendingAvatar} />
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName}>Request from {item.sender_id.substring(0, 8)}</Text>
        <Text style={styles.pendingDept}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.request_id)}>
        <Check size={18} color={Colors.success} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.request_id)}>
        <X size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  ), []);

  const renderSearchResult = useCallback(({ item }: { item: ProfileResponse }) => {
    const isConnected = connectedIds.includes(item.user_id);
    const outgoing = outgoingRequests.find(r => r.receiver_id === item.user_id);
    const incoming = pendingRequests.find(r => r.sender_id === item.user_id);
    
    return (
      <View style={styles.pendingItem}>
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=' + item.personal_info.full_name }} 
          style={styles.pendingAvatar} 
        />
        <View style={styles.pendingInfo}>
          <Text style={styles.pendingName}>{item.personal_info.full_name}</Text>
          <Text style={styles.pendingDept}>{item.personal_info.institution}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isConnected ? (
            <TouchableOpacity style={styles.chatBtn} onPress={() => handleStartChat(item.user_id, item.personal_info.full_name)}>
              <MessageCircle size={18} color={Colors.primaryDark} />
            </TouchableOpacity>
          ) : incoming ? (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(incoming.request_id)}>
                <Check size={18} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(incoming.request_id)}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : outgoing ? (
            <View style={[styles.actionBtn, { opacity: 0.5 }]}>
              <Check size={18} color={Colors.textMuted} />
            </View>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleInvite(item.user_id)}>
              <UserPlus size={18} color={Colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [connectedIds, outgoingRequests, pendingRequests, handleInvite, handleStartChat, handleAccept, handleReject]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Connections',
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: spacing.md }}
              onPress={() => router.push('/chat/create-group' as any)}
            >
              <Users size={22} color={Colors.primaryDark} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (tab !== 'search' && text.length > 0) setTab('search');
            handleSearch(text);
          }}
        />
      </View>

      <View style={styles.tabRow}>
        {(['chats', 'pending', 'search'] as ConnectionTab[]).map(t => (
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
      
      {loading && (
        <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 10 }} />
      )}

      {tab === 'chats' && (
        <FlatList
          data={threads}
          renderItem={renderThread}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active chats yet</Text>
            </View>
          }
        />
      )}
      {tab === 'pending' && (
        <FlatList
          data={pendingRequests}
          renderItem={renderPending}
          keyExtractor={(item) => item.request_id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
        />
      )}
      {tab === 'search' && (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{searchQuery.length < 3 ? 'Type at least 3 characters to search' : 'No users found'}</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadow.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontSize: fontSize.md,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
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
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDark + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
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
  },
});
