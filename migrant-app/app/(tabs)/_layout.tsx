import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: false,
        tabBarStyle: {
            paddingBottom: 5,
            height: 60,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 5,
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
      {/* Hiding index if it exists or redirecting */}
      <Tabs.Screen name="index" options={{ href: null }} /> 
    </Tabs>
  );
}