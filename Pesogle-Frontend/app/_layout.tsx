import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { status, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Direct navigation based on auth status
    // If the user is on the Splash screen (index), the splash screen logic handles the first jump.
    // However, this guard handles the dynamic state changes while the app is running (like Logout)
    if (status === 'unauthenticated') {
      console.log('[RootLayout] Status: unauthenticated — Redirecting to onboarding');
      router.replace('/onboarding');
    } else if (status === 'authenticated') {
      console.log('[RootLayout] Status: authenticated');
      // We don't necessarily want to force redirect to home if they are already somewhere else (like Chat or Profile)
      // but if they were on Login/Onboarding and just authenticated, this helps.
    }
  }, [status, isLoading]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.primaryBg },
        headerTintColor: Colors.primaryDark,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="profile-creation" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="connections" options={{ title: "Connections" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      <Stack.Screen name="resume-bot" options={{ title: "Resume Bot" }} />
      <Stack.Screen name="career-simulator" options={{ title: "Career Simulator" }} />
      <Stack.Screen name="user/[id]" options={{ presentation: 'modal', title: "Profile Details" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Norwester": require("../assets/fonts/norwester.otf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
