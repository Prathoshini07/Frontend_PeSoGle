import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Search as SearchIcon, ArrowLeft, User as UserIcon, GraduationCap, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import { profileService, type ProfileResponse } from '@/services/profileService';
import { connectService } from '@/services/connectService';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch initial connection stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [connRes, reqRes] = await Promise.all([
          connectService.getConnectionIds(),
          connectService.getOutgoingRequests()
        ]);
        
        if (connRes.success) setConnectedIds(connRes.data);
        if (reqRes.success) setRequestedIds(reqRes.data.map(r => r.receiver_id));
      } catch (err) {
        console.error('[Search] Failed to fetch connection stats:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await profileService.searchProfiles(text);
      setResults(data);
    } catch (error) {
      console.error('[Search] Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConnect = async (userId: string) => {
    if (connectedIds.includes(userId) || requestedIds.includes(userId)) return;

    try {
      const res = await connectService.sendRequest(userId);
      if (res.success) {
        setRequestedIds(prev => [...prev, userId]);
      } else {
        // Handle specific "already connected" or "already exists" errors gracefully
        if (res.message?.toLowerCase().includes('already')) {
           // Refresh IDs just in case
           const [crews, rres] = await Promise.all([
             connectService.getConnectionIds(),
             connectService.getOutgoingRequests()
           ]);
           if (crews.success) setConnectedIds(crews.data);
           if (rres.success) setRequestedIds(rres.data.map(r => r.receiver_id));
        } else {
          Alert.alert('Request Failed', res.message || 'Could not send connection request');
        }
      }
    } catch (error) {
      console.error('[Search] Connect error:', error);
    }
  };

  const renderResult = ({ item }: { item: ProfileResponse }) => {
    const pInfo = item.personal_info;
    const isConnected = connectedIds.includes(item.user_id);
    const isRequested = requestedIds.includes(item.user_id);

    let btnText = 'Connect';
    let btnStyle: any = styles.connectBtn;
    let txtStyle: any = styles.connectBtnText;
    let isDisabled = false;

    if (isConnected) {
      btnText = 'Connected';
      btnStyle = [styles.connectBtn, styles.connectedBtn];
      txtStyle = [styles.connectBtnText, styles.connectedBtnText];
      isDisabled = true;
    } else if (isRequested) {
      btnText = 'Sent';
      btnStyle = [styles.connectBtn, styles.pendingBtn];
      txtStyle = [styles.connectBtnText, styles.pendingBtnText];
      isDisabled = true;
    }

    return (
      <View style={styles.resultCard}>
        <TouchableOpacity 
          style={styles.resultMain} 
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.user_id } } as any)}
        >
          <View style={styles.avatarContainer}>
            {pInfo.avatar ? (
               <View style={styles.avatarPlaceholder} /> // In a real app, use Image
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={20} color={Colors.white} />
              </View>
            )}
          </View>
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>{pInfo.full_name}</Text>
            <View style={styles.resultMeta}>
              <GraduationCap size={14} color={Colors.textMuted} />
              <Text style={styles.resultDegree}>{pInfo.degree} · {pInfo.institution}</Text>
            </View>
            <Text style={styles.resultSkills} numberOfLines={1}>
              {item.skills_and_interests.skills.slice(0, 3).join(', ')}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={btnStyle} 
          onPress={() => handleConnect(item.user_id)}
          disabled={isDisabled}
        >
          <Text style={txtStyle}>{btnText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={Colors.textMuted} />
          <TextInput
            placeholder="Search by name, skills, or domain..."
            style={styles.input}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      ) : query.length >= 2 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No matches found for "{query}"</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <SearchIcon size={48} color={Colors.border} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyText}>Find students and mentors across the platform</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xxxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: Colors.white,
    ...shadow.sm,
    gap: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 45,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: Colors.textPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  listContent: {
    padding: spacing.lg,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
    gap: spacing.md,
  },
  resultMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  resultDegree: {
    fontSize: fontSize.xs,
    color: Colors.textMuted,
  },
  resultSkills: {
    fontSize: fontSize.xs,
    color: Colors.accent,
    fontWeight: fontWeight.medium,
    marginTop: 4,
  },
  connectBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.primaryDark,
    minWidth: 80,
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: Colors.white,
  },
  pendingBtn: {
    backgroundColor: Colors.borderLight,
  },
  pendingBtnText: {
    color: Colors.textMuted,
  },
  connectedBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  connectedBtnText: {
    color: '#10B981',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
