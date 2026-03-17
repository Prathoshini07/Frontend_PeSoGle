import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, Alert 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { 
  Check, X, MessageCircle, Search, UserPlus, Users 
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { chatService } from '@/services/chatService';
import { connectService, type ConnectRequest } from '@/services/connectService';
import { profileService, type ProfileResponse } from '@/services/profileService';
import type { User } from '@/mocks/users';

type ConnectionTab = 'chats' | 'pending' | 'blocked' | 'search';

export default function ConnectionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ConnectionTab>('chats');
  const [pendingSubTab, setPendingSubTab] = useState<'received' | 'sent'>('received');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- Queries ---

  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectService.getConnectionsWithProfiles().then(res => res.data),
  });

  const { data: incomingRequests = [], isLoading: isLoadingIncoming } = useQuery({
    queryKey: ['connection-requests-incoming'],
    queryFn: () => connectService.getIncomingRequestsWithProfiles().then(res => res.data.map(req => ({
      ...req,
      user: req.sender,
      type: 'incoming' as const
    }))),
  });

  const { data: outgoingRequests = [], isLoading: isLoadingOutgoing } = useQuery({
    queryKey: ['connection-requests-outgoing'],
    queryFn: () => connectService.getOutgoingRequestsWithProfiles().then(res => res.data.map(req => ({
      ...req,
      user: req.receiver,
      type: 'outgoing' as const
    }))),
    enabled: tab === 'pending' || tab === 'search',
  });

  const { data: blockedUsers = [], isLoading: isLoadingBlocked } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => connectService.getBlockedUsersWithProfiles().then(res => res.data),
    enabled: tab === 'blocked',
  });

  // --- Mutations ---

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

  // --- Search Logic ---

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await profileService.searchProfiles(query);
      setSearchResults(results);
    } catch (error) {
      console.error('[Connections] Search failed:', error);
    } finally {
      setIsSearching(false);
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

  // --- Render Functions ---

  const renderThread = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.threadItem}
      onPress={() => router.push({ 
        pathname: '/chat/[id]' as any, 
        params: { id: item.id, name: item.name } 
      })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.avatar }} style={styles.threadAvatar} />
      <div style={styles.threadContent}>
        <div style={styles.threadHeader}>
          <Text style={styles.threadName}>{item.name}</Text>
          <Text style={styles.threadTime}>Connected</Text>
        </div>
      </div>
      <MessageCircle size={20} color={Colors.primaryDark} style={{ opacity: 0.6 }} />
    </TouchableOpacity>
  ), [router]);

  const renderPendingItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.pendingItem}>
      <Image source={{ uri: item.user.avatar }} style={styles.pendingAvatar} />
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName}>{item.user.name}</Text>
        <Text style={styles.pendingDept}>{item.user.department}</Text>
      </View>
      {item.type === 'incoming' ? (
        <>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptMutation.mutate(item.request_id)}>
            <Check size={18} color={Colors.success} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectMutation.mutate(item.request_id)}>
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

  const renderSearchResult = useCallback(({ item }: { item: ProfileResponse }) => {
    const isConnected = connections.some(c => c.id === item.user_id);
    const outgoing = outgoingRequests.find(r => r.receiver_id === item.user_id);
    const incoming = incomingRequests.find(r => r.sender_id === item.user_id);
    
    return (
      <View style={styles.pendingItem}>
        <Image 
          source={{ uri: `https://ui-avatars.com/api/?name=${item.personal_info.full_name}` }} 
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
              <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptMutation.mutate(incoming.request_id)}>
                <Check size={18} color={Colors.success} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.actionBtn} 
              disabled={!!outgoing}
              onPress={async () => {
                const res = await connectService.sendRequest(item.user_id);
                if (res.success) queryClient.invalidateQueries({ queryKey: ['connection-requests-outgoing'] });
              }}
            >
              {outgoing ? <Check size={18} color={Colors.textMuted} /> : <UserPlus size={18} color={Colors.accent} />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [connections, outgoingRequests, incomingRequests]);

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
          value={searchQuery}
          onChangeText={(text) => {
            if (tab !== 'search' && text.length > 0) setTab('search');
            handleSearch(text);
          }}
        />
      </View>

      <View style={styles.tabRow}>
        {(['chats', 'pending', 'blocked', 'search'] as const).map(t => (
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
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['connections'] })}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No connections yet.</Text></View>}
        />
      )}

      {tab === 'pending' && (
        <>
          <View style={styles.subTabRow}>
            <TouchableOpacity style={[styles.subTab, pendingSubTab === 'received' && styles.subTabActive]} onPress={() => setPendingSubTab('received')}>
              <Text style={[styles.subTabText, pendingSubTab === 'received' && styles.subTabTextActive]}>Received</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.subTab, pendingSubTab === 'sent' && styles.subTabActive]} onPress={() => setPendingSubTab('sent')}>
              <Text style={[styles.subTabText, pendingSubTab === 'sent' && styles.subTabTextActive]}>Sent</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={pendingSubTab === 'received' ? incomingRequests : outgoingRequests}
            renderItem={renderPendingItem}
            keyExtractor={(item) => item.request_id}
            contentContainerStyle={styles.list}
          />
        </>
      )}

      {tab === 'blocked' && (
        <FlatList
          data={blockedUsers}
          renderItem={({ item }) => (
            <View style={styles.threadItem}>
              <Image source={{ uri: item.avatar }} style={styles.threadAvatar} />
              <View style={styles.threadContent}><Text style={styles.threadName}>{item.name}</Text></View>
              <TouchableOpacity style={styles.unblockBtn} onPress={() => unblockMutation.mutate(item.id)}>
                <Text style={styles.unblockBtnText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}

      {tab === 'search' && (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.user_id}
          ListHeaderComponent={isSearching ? <ActivityIndicator color={Colors.accent} /> : null}
        />
      )}
    </View>
  );
}

// ... styles as defined in the master branch (with actionBtn and chatBtn added back)