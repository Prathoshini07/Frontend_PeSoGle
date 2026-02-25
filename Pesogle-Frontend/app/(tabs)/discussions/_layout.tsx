import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function DiscussionsLayout() {
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
