import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function ProjectsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primaryBg },
        headerTintColor: Colors.primaryDark,
        headerShadowVisible: false,
      }}
    />
  );
}
