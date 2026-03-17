import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { registerAuthErrorHandler } from '@/services/api';

type AuthStatus = 'loading' | 'unauthenticated' | 'needsProfile' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  email: string;
  token: string | null;
}

const AUTH_STORAGE_KEY = 'pesogle_auth';
const PROFILE_COMPLETE_KEY = 'pesogle_profile_complete';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    status: 'loading',
    email: '',
    token: null,
  });
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth-state'],
    queryFn: async () => {
      console.log('[AuthContext] Checking AsyncStorage...');
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const profileComplete = await AsyncStorage.getItem(PROFILE_COMPLETE_KEY);
      console.log('[AuthContext] Stored data found:', !!stored, 'Profile complete:', profileComplete);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...parsed, profileComplete: profileComplete === 'true' };
        } catch (e) {
          console.error('[AuthContext] Error parsing stored auth:', e);
          return null;
        }
      }
      return null;
    },
  });

  useEffect(() => {
    if (authQuery.isSuccess) {
      if (authQuery.data) {
        setAuthState({
          status: authQuery.data.profileComplete ? 'authenticated' : 'needsProfile',
          email: authQuery.data.email || '',
          token: authQuery.data.token || null,
        });
      } else {
        setAuthState({ status: 'unauthenticated', email: '', token: null });
      }
    }
    if (authQuery.isError) {
      setAuthState({ status: 'unauthenticated', email: '', token: null });
    }
  }, [authQuery.isSuccess, authQuery.isError, authQuery.data]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, token, profileComplete }: { email: string; token: string; profileComplete: boolean }) => {
      console.log('[Auth] Storing login state');
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email, token }));
      if (profileComplete) {
        await AsyncStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(PROFILE_COMPLETE_KEY);
      }
      return { email, token, profileComplete };
    },
    onSuccess: (data) => {
      setAuthState({
        status: data.profileComplete ? 'authenticated' : 'needsProfile',
        email: data.email,
        token: data.token
      });
      queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const completeProfileMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Marking profile as complete');
      await AsyncStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
    },
    onSuccess: () => {
      setAuthState(prev => ({ ...prev, status: 'authenticated' }));
      queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[AuthContext] Explicitly clearing auth keys...');
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, PROFILE_COMPLETE_KEY]);
      const check = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      console.log('[AuthContext] Verification - Key is now:', check);
    },
    onSuccess: () => {
      setAuthState({ status: 'unauthenticated', email: '', token: null });
      queryClient.clear();
    },
  });

  const login = useCallback((email: string, token: string, profileComplete: boolean = false) => {
    loginMutation.mutate({ email, token, profileComplete });
  }, [loginMutation]);

  const completeProfile = useCallback(() => {
    completeProfileMutation.mutate();
  }, [completeProfileMutation]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  // Register the logout function with the API interceptor
  useEffect(() => {
    console.log('[AuthContext] Registering logout handler with API');
    registerAuthErrorHandler(logout);
  }, [logout]);

  return {
    status: authState.status,
    email: authState.email,
    token: authState.token,
    isLoading: authState.status === 'loading',
    login,
    completeProfile,
    logout,
  };
});
