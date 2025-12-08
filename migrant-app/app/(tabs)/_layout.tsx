import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: 5,
            height: 60,
            borderTopWidth: 1,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 5,
            fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t('tabJobs'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="briefcase" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: t('tabSkills'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="tools" size={28} color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} /> 
    </Tabs>
  );
}