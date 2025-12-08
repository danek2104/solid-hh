import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="skills" />
      <Stack.Screen name="jobs" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
