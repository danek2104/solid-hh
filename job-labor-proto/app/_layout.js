import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider, LanguageContext } from '../context/LanguageContext';
import LanguageSelectScreen from '../screens/LanguageSelectScreen';

const queryClient = new QueryClient();

const RootContent = () => {
  const { isLanguageSelected, isLoading, confirmLanguageSelection } = useContext(LanguageContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#C62828" />
      </View>
    );
  }

  if (!isLanguageSelected) {
    return <LanguageSelectScreen onLanguageSelected={confirmLanguageSelection} />;
  }

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
};

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RootContent />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
