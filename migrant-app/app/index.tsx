import { Redirect } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, hasCompletedOnboarding } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator /></View>;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/personal-info" />;
  }

  return <Redirect href="/(tabs)/profile" />;
}
