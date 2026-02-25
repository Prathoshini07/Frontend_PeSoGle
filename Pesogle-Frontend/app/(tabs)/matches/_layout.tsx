import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function MatchesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primaryBg },
        headerTintColor: Colors.primaryDark,
        headerShadowVisible: false,
      }}
    />
  );
}
