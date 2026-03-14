import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { Filter, X, Search, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, shadow, spacing } from '@/constants/theme';
import UserCard from '@/components/UserCard';
import EmptyState from '@/components/EmptyState';
import TagChip from '@/components/TagChip';
import { matchService, type User } from '@/services/matchService';

const roleFilters = ['All', 'Student', 'Mentor', 'Researcher'];
const domainFilters = ['All', 'AI & ML', 'Web Dev', 'Security', 'Data Science', 'IoT'];

export default function MatchesScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');

  const [matches, setMatches] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showPerfectMatchModal, setShowPerfectMatchModal] = useState(false);
  const [perfectMatchPurpose, setPerfectMatchPurpose] = useState('');
  const [isPerfectMatchMode, setIsPerfectMatchMode] = useState(false);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setIsPerfectMatchMode(false);
    const result = await matchService.getMatches({
      role: roleFilter !== 'All' ? roleFilter : undefined,
      domain: domainFilter !== 'All' ? domainFilter : undefined,
    });
    if (result.success && result.data) {
      setMatches(result.data);
    } else {
      Alert.alert('Error', result.message || 'Failed to load recommendations');
      setMatches([]);
    }
    setIsLoading(false);
  }, [roleFilter, domainFilter]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleConnect = useCallback(async (user: User) => {
    const res = await matchService.connectUser(user.id);
    if (res.success) {
      Alert.alert('Connection Sent', `Request sent to ${user.name}`);
    } else {
      Alert.alert('Error', res.message || 'Failed to send request');
    }
  }, []);

  const handlePerfectMatchSubmit = async () => {
    if (!perfectMatchPurpose.trim()) return;
    setShowPerfectMatchModal(false);
    setIsLoading(true);
    setIsPerfectMatchMode(true);
    const result = await matchService.getPerfectMatches(perfectMatchPurpose);
    if (result.success && result.data) {
      setMatches(result.data);
    } else {
      Alert.alert('Notice', result.message || 'Could not find perfect matches.');
      setMatches([]);
    }
    setIsLoading(false);
  };

  const renderUser = useCallback(({ item }: { item: User }) => (
    <UserCard
      user={item}
      onPress={() => router.push(`/user/${item.id}`)}
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

      <TouchableOpacity 
        style={styles.perfectMatchBanner} 
        onPress={() => setShowPerfectMatchModal(true)}
      >
        <Sparkles size={20} color={Colors.white} />
        <Text style={styles.perfectMatchText}>Need a perfect match? Tell us your goal!</Text>
      </TouchableOpacity>

      {showFilters && !isPerfectMatchMode && (
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
      
      {isLoading ? (
        <View style={[styles.list, { alignItems: 'center', justifyContent: 'center', flex: 1 }]}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
          <Text style={{ marginTop: spacing.md, color: Colors.textMuted }}>
            {isPerfectMatchMode ? 'Analyzing intent...' : 'Finding best matches...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={isPerfectMatchMode ? "No Perfect Match Found" : "No Matches Found"}
              description={isPerfectMatchMode ? "Try rewording your purpose." : "Try adjusting your filters to find more peers and mentors."}
            />
          }
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultCount}>
                {isPerfectMatchMode ? `Perfect Matches: ${matches.length}` : `${matches.length} matches found`}
              </Text>
              {isPerfectMatchMode && (
                <TouchableOpacity onPress={loadMatches}>
                  <Text style={styles.clearPerfectMatchText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <Modal
        visible={showPerfectMatchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPerfectMatchModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Find a Perfect Match</Text>
              <TouchableOpacity onPress={() => setShowPerfectMatchModal(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Describe exactly what you are looking for (e.g., "I need someone to help me build an AI startup", "Looking for a mentor to learn React Native").
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your purpose here..."
              placeholderTextColor={Colors.textMuted}
              value={perfectMatchPurpose}
              onChangeText={setPerfectMatchPurpose}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handlePerfectMatchSubmit}
            >
              <Search size={18} color={Colors.white} />
              <Text style={styles.searchButtonText}>Search Matches</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  perfectMatchBanner: {
    backgroundColor: Colors.accent,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  perfectMatchText: {
    color: Colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  resultCount: {
    fontSize: fontSize.sm,
    color: Colors.textMuted,
  },
  clearPerfectMatchText: {
    fontSize: fontSize.sm,
    color: Colors.accent,
    fontWeight: fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: 'Norwester',
    fontSize: fontSize.xl,
    color: Colors.primaryDark,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: spacing.md,
  },
  textInput: {
    backgroundColor: Colors.primaryBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: Colors.textPrimary,
    fontSize: fontSize.md,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchButton: {
    backgroundColor: Colors.primaryDark,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  searchButtonText: {
    color: Colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
});
