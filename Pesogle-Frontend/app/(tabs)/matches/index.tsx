import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Filter, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import UserCard from '@/components/UserCard';
import EmptyState from '@/components/EmptyState';
import TagChip from '@/components/TagChip';
import { mockUsers } from '@/mocks/users';
import type { User } from '@/mocks/users';

import { chatService } from '@/services/chatService';

const roleFilters = ['All', 'Student', 'Mentor', 'Researcher'];
const domainFilters = ['All', 'AI & ML', 'Web Dev', 'Security', 'Data Science', 'IoT'];

export default function MatchesScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');

  const filteredUsers = useMemo(() => {
    let results = [...mockUsers].sort((a, b) => b.matchPercentage - a.matchPercentage);
    if (roleFilter !== 'All') {
      results = results.filter(u => u.role === roleFilter.toLowerCase());
    }
    if (domainFilter !== 'All') {
      const domainMap: Record<string, string[]> = {
        'AI & ML': ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision'],
        'Web Dev': ['Web Development', 'Mobile Development'],
        'Security': ['Cybersecurity', 'Blockchain'],
        'Data Science': ['Data Science'],
        'IoT': ['IoT', 'Embedded Systems'],
      };
      const matchDomains = domainMap[domainFilter] || [];
      results = results.filter(u => u.domains.some(d => matchDomains.some(md => d.includes(md))));
    }
    return results;
  }, [roleFilter, domainFilter]);

  const handleConnect = useCallback(async (user: User) => {
    try {
      const response = await chatService.createRequest(user.id);
      if (response.success) {
        Alert.alert('Connection Sent', `Request sent to ${user.name}`);
      } else {
        Alert.alert('Error', 'Failed to send connection request. Please try again.');
      }
    } catch (error) {
      console.error('[MatchesScreen] Failed to connect:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  }, []);

  const renderUser = useCallback(({ item }: { item: User }) => (
    <UserCard
      user={item}
      onPress={() => console.log('[Matches] View user:', item.id)}
      onConnect={() => handleConnect(item)}
    />
  ), [handleConnect]);

  const hasActiveFilters = roleFilter !== 'All' || domainFilter !== 'All';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AI Matches',
          headerRight: () => (
            <TouchableOpacity
              style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} color={showFilters ? Colors.white : Colors.primaryDark} />
              {hasActiveFilters && !showFilters && <View style={styles.filterDot} />}
            </TouchableOpacity>
          ),
        }}
      />
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Role</Text>
            <View style={styles.filterChips}>
              {roleFilters.map(role => (
                <TagChip
                  key={role}
                  label={role}
                  selected={roleFilter === role}
                  onPress={() => setRoleFilter(role)}
                  small
                />
              ))}
            </View>
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Domain</Text>
            <View style={styles.filterChips}>
              {domainFilters.map(domain => (
                <TagChip
                  key={domain}
                  label={domain}
                  selected={domainFilter === domain}
                  onPress={() => setDomainFilter(domain)}
                  small
                />
              ))}
            </View>
          </View>
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setRoleFilter('All'); setDomainFilter('All'); }}
            >
              <X size={14} color={Colors.accent} />
              <Text style={styles.clearText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No Matches Found"
            description="Try adjusting your filters to find more peers and mentors."
          />
        }
        ListHeaderComponent={
          <Text style={styles.resultCount}>{filteredUsers.length} matches found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  filterPanel: {
    backgroundColor: Colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  clearText: {
    fontSize: fontSize.sm,
    color: Colors.accent,
    fontWeight: fontWeight.medium,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  resultCount: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
    marginVertical: spacing.md,
  },
});
