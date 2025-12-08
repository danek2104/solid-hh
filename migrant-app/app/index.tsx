import { Redirect } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, hasCompletedOnboarding, user } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator /></View>;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasCompletedOnboarding) {
    // If not completed onboarding, personal-info will handle the next steps based on role
    return <Redirect href="/(onboarding)/personal-info" />;
  }

  // If authenticated and onboarding completed, redirect based on role
  if (user?.role === 'employer') {
      return <Redirect href="/(employer)/(tabs)/my-jobs" />;
  }
  // Default for seeker
  return <Redirect href="/(tabs)/jobs" />;
}
